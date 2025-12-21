import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { batchGenerationQueue, brands, users, generations } from '@/db/schema';
import { eq, and, lte, sql, or, inArray } from 'drizzle-orm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { put } from '@vercel/blob';

// Initialize Gemini
const genAI = process.env.GOOGLE_AI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  : null;

// Batch processing - cheaper but slower (up to 24h)
// Price: ~$0.067/image vs $0.134/image for standard
const BATCH_SIZE = 50; // Process 50 at a time (more for daily subscribers)

export async function POST(request: NextRequest) {
  try {
    // Verify internal API key (for cron job security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🚧 FEATURE DISABLED: Daily automatic generation for Pro/Premium users
    // This feature will be launched later. For now, we skip all batch processing.
    console.log('⚠️ Batch generation is currently disabled');
    return NextResponse.json({
      success: true,
      message: 'Batch generation feature is disabled',
      processed: 0,
      dailyJobsCreated: 0,
    });

    // STEP 1: Process existing pending jobs (new user reactivation)
    const pendingJobs = await db.query.batchGenerationQueue.findMany({
      where: and(
        eq(batchGenerationQueue.status, 'pending'),
        lte(batchGenerationQueue.scheduledFor, new Date())
      ),
      limit: BATCH_SIZE,
    });

    // STEP 2: Generate daily visuals for Pro/Premium subscribers
    // Find all active Pro/Premium users with at least one brand
    const paidUsers = await db.query.users.findMany({
      where: or(
        eq(users.plan, 'pro'),
        eq(users.plan, 'premium')
      ),
    });

    console.log(`📦 Found ${pendingJobs.length} pending jobs + ${paidUsers.length} paid subscribers`);

    // Queue daily jobs for paid users (if not already queued today)
    const today = new Date().toISOString().split('T')[0];
    let dailyJobsCreated = 0;

    for (const user of paidUsers) {
      // Check if we already have a job for this user today
      const existingTodayJob = await db.query.batchGenerationQueue.findFirst({
        where: and(
          eq(batchGenerationQueue.userId, user.clerkId),
          sql`DATE(${batchGenerationQueue.scheduledFor}) = ${today}`
        ),
      });

      if (!existingTodayJob) {
        // Get user's primary brand
        const userBrand = await db.query.brands.findFirst({
          where: eq(brands.userId, user.clerkId),
          orderBy: (brands, { desc }) => [desc(brands.updatedAt)],
        });

        if (userBrand) {
          // Create daily generation job (scheduled for now)
          await db.insert(batchGenerationQueue).values({
            userId: user.clerkId,
            brandId: userBrand.id,
            status: 'pending',
            scheduledFor: new Date(),
            prompt: `daily-${today}`, // Mark as daily job
          });
          dailyJobsCreated++;
        }
      }
    }

    if (dailyJobsCreated > 0) {
      console.log(`📅 Created ${dailyJobsCreated} new daily jobs for paid subscribers`);
    }

    // Refetch pending jobs including newly created daily ones
    const allPendingJobs = await db.query.batchGenerationQueue.findMany({
      where: and(
        eq(batchGenerationQueue.status, 'pending'),
        lte(batchGenerationQueue.scheduledFor, new Date())
      ),
      limit: BATCH_SIZE,
    });

    if (!allPendingJobs.length) {
      return NextResponse.json({ 
        success: true, 
        message: 'No pending batch jobs',
        processed: 0,
        dailyJobsCreated,
      });
    }

    console.log(`📦 Processing ${allPendingJobs.length} total batch jobs...`);

    const results = await Promise.allSettled(
      allPendingJobs.map(job => processBatchJob(job))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      processed: allPendingJobs.length,
      successful,
      failed,
      dailyJobsCreated,
    });

  } catch (error: any) {
    console.error('Batch process error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function processBatchJob(job: typeof batchGenerationQueue.$inferSelect) {
  try {
    // Mark as processing
    await db.update(batchGenerationQueue)
      .set({ status: 'processing' })
      .where(eq(batchGenerationQueue.id, job.id));

    // Get user and brand info
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, job.userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get the user's most recent brand (or specific one if set)
    let brand;
    if (job.brandId) {
      brand = await db.query.brands.findFirst({
        where: eq(brands.id, job.brandId),
      });
    } else {
      // Get most recent brand for user
      brand = await db.query.brands.findFirst({
        where: eq(brands.userId, job.userId),
        orderBy: (brands, { desc }) => [desc(brands.createdAt)],
      });
    }

    if (!brand) {
      throw new Error('No brand found for user');
    }

    // Update job with brandId
    if (!job.brandId) {
      await db.update(batchGenerationQueue)
        .set({ brandId: brand.id })
        .where(eq(batchGenerationQueue.id, job.id));
    }

    // For Pro/Premium users: consume 1 credit from their monthly quota
    // (Daily visual is part of the subscription, not a gift!)
    if (user.plan === 'pro' || user.plan === 'premium') {
      if (user.creditsRemaining < 1) {
        throw new Error('No credits remaining for daily visual');
      }
      
      await db.update(users)
        .set({ creditsRemaining: user.creditsRemaining - 1 })
        .where(eq(users.clerkId, job.userId));
      
      console.log(`💳 Consumed 1 credit for daily visual (${user.creditsRemaining - 1} remaining)`);
    }

    // Generate a smart prompt based on brand
    const prompt = generateSmartBatchPrompt(brand);

    // Generate image with Gemini (batch mode - same API but queued)
    const imageUrl = await generateWithGemini(prompt, brand);

    if (!imageUrl) {
      throw new Error('Failed to generate image');
    }

    // Save to generations table
    await db.insert(generations).values({
      userId: job.userId,
      brandId: brand.id,
      type: 'daily',
      prompt,
      imageUrl,
      format: '1:1',
      brandName: brand.name,
    });

    // Mark job as completed
    await db.update(batchGenerationQueue)
      .set({ 
        status: 'completed',
        resultUrl: imageUrl,
        processedAt: new Date(),
      })
      .where(eq(batchGenerationQueue.id, job.id));

    console.log(`✅ Batch job ${job.id} completed for user ${job.userId}`);

    // TODO: Send email notification to user with the new visual
    // await sendReactivationEmail(user.email, imageUrl, brand.name);

    return { success: true, jobId: job.id };

  } catch (error: any) {
    console.error(`❌ Batch job ${job.id} failed:`, error.message);

    // Mark job as failed
    await db.update(batchGenerationQueue)
      .set({ 
        status: 'failed',
        error: error.message,
        processedAt: new Date(),
      })
      .where(eq(batchGenerationQueue.id, job.id));

    throw error;
  }
}

function generateSmartBatchPrompt(brand: typeof brands.$inferSelect): string {
  const brandName = brand.name || 'Brand';
  const industry = brand.industry || 'business';
  const colors = (brand.colors as string[]) || [];
  const aesthetic = (brand.aesthetic as string[]) || [];
  const values = (brand.values as string[]) || [];
  
  // Get a random angle from marketing angles if available
  const angles = (brand.marketingAngles as any[]) || [];
  const randomAngle = angles.length > 0 
    ? angles[Math.floor(Math.random() * angles.length)]
    : null;

  // Build a contextual prompt
  const promptParts = [
    `Create a professional social media visual for ${brandName}`,
    industry && `in the ${industry} industry`,
    colors.length > 0 && `using brand colors: ${colors.slice(0, 3).join(', ')}`,
    aesthetic.length > 0 && `with ${aesthetic[0]} aesthetic`,
    randomAngle && `featuring the concept: "${randomAngle.title || randomAngle.concept}"`,
    values.length > 0 && `emphasizing ${values[0]}`,
    'Modern, clean design with professional typography.',
    'High quality, suitable for Instagram/LinkedIn.',
  ].filter(Boolean).join('. ');

  return promptParts;
}

async function generateWithGemini(
  prompt: string, 
  brand: typeof brands.$inferSelect
): Promise<string | null> {
  if (!genAI) {
    console.warn('⚠️ Google AI not configured for batch');
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-pro-image-preview",
      generationConfig: {
        // @ts-ignore
        responseModalities: ["image", "text"],
      },
    });

    // Build content with logo if available
    const parts: any[] = [{ text: prompt }];

    // Add logo as reference if available
    if (brand.logo) {
      try {
        const logoResponse = await fetch(brand.logo);
        if (logoResponse.ok) {
          const logoBuffer = await logoResponse.arrayBuffer();
          const logoBase64 = Buffer.from(logoBuffer).toString('base64');
          const contentType = logoResponse.headers.get('content-type') || 'image/png';
          
          parts.push({
            inlineData: {
              mimeType: contentType,
              data: logoBase64,
            }
          });
          parts[0].text += '\n\nIncorporate the brand logo (Image 1) naturally into the design.';
        }
      } catch (e) {
        console.warn('Could not fetch logo for batch generation');
      }
    }

    const response = await model.generateContent(parts);
    const result = response.response;

    // Extract image from response
    if (result.candidates?.[0]?.content?.parts) {
      for (const part of result.candidates[0].content.parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          // Upload to Vercel Blob
          const imageData = part.inlineData.data;
          const blob = await put(
            `batch/${Date.now()}-${Math.random().toString(36).slice(2)}.png`,
            Buffer.from(imageData, 'base64'),
            { 
              access: 'public',
              contentType: part.inlineData.mimeType,
            }
          );
          return blob.url;
        }
      }
    }

    return null;
  } catch (error: any) {
    console.error('Gemini batch generation error:', error.message);
    return null;
  }
}

// GET endpoint to check batch queue status (for debugging)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stats = await db.execute(sql`
    SELECT 
      status,
      COUNT(*) as count
    FROM batch_generation_queue
    GROUP BY status
  `);

  const pending = await db.query.batchGenerationQueue.findMany({
    where: eq(batchGenerationQueue.status, 'pending'),
    limit: 5,
    orderBy: (batchGenerationQueue, { asc }) => [asc(batchGenerationQueue.scheduledFor)],
  });

  return NextResponse.json({
    stats: stats.rows,
    nextPending: pending.map(p => ({
      id: p.id,
      userId: p.userId,
      scheduledFor: p.scheduledFor,
    })),
  });
}
