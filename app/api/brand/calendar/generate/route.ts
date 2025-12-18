import { NextRequest, NextResponse } from 'next/server';
import { firecrawlAgent } from '@/lib/firecrawl';
import { db } from '@/db';
import { brands } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const maxDuration = 300; // 5 minutes timeout for Vercel Pro

// Helper: Transform Agent result to Calendar Plan
async function generateCalendarPlan(agentData: any, month: number, year: number, userPlan: string = 'free') {
    const posts: any[] = [];

    // 1. Create posts from Trends (High priority)
    if (agentData.trends) {
        agentData.trends.slice(0, 4).forEach((trend: any, i: number) => {
            posts.push({
                day: (i * 7) + 2, // Spread out (Tue)
                idea: `Trend: ${trend.trend}`,
                content: `Analyzing the shift: ${trend.trend}. Evidence suggests ${trend.source || 'market data'} supports this.`,
                platform: 'linkedin',
                isPremium: false
            });
        });
    }

    // 2. Create posts from Pain Points (Empathy)
    if (agentData.painPoints) {
        agentData.painPoints.slice(0, 4).forEach((pain: any, i: number) => {
            posts.push({
                day: (i * 7) + 4, // Spread out (Thu)
                idea: `Problem: ${pain.point}`,
                content: `Do you struggle with ${pain.point}? You're not alone.`,
                platform: 'instagram',
                isPremium: false
            });
        });
    }

    // PREMIUM LOGIC: The first 2 posts get "Auto-Generated" flag
    if (userPlan === 'premium') {
        if (posts.length > 0) posts[0].isPremium = true;
        if (posts.length > 1) posts[1].isPremium = true;
    }

    // Sort by day
    posts.sort((a, b) => a.day - b.day);

    // Map to final structure with dates
    const finalPosts = posts.map(p => {
        const date = new Date(year, month, p.day);
        return {
            scheduledDate: date.toISOString(),
            content: p.content,
            platform: p.platform,
            status: p.isPremium ? 'generated' : 'idea', // Premium gets 'generated' status (stub)
            imageUrl: p.isPremium ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' : null // Mock URL for now
        };
    });

    return {
        month,
        year,
        topics: agentData.trends?.map((t: any) => t.trend) || [],
        posts: finalPosts
    };
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { brandId, month, year, userPlan } = body; // userPlan passed from frontend

        if (!brandId) {
            return NextResponse.json({ success: false, error: 'Brand ID required' }, { status: 400 });
        }

        // Fetch brand details from DB
        const brand = await db.query.brands.findFirst({
            where: eq(brands.id, brandId)
        });

        if (!brand) {
            return NextResponse.json({ success: false, error: 'Brand not found' }, { status: 404 });
        }

        const brandName = brand.name;
        const industry = brand.industry || 'General';
        const targetAudience = brand.targetAudience || 'Clients';

        console.log(`🗓️ Starting Background Calendar Research for ${brandName}...`);

        // 1. Firecrawl Agent Deep Research (The slow part)
        const prompt = `
      You are a "No Bullshit" Market Researcher. 
      Analyze the "${industry}" market specifically for the brand "${brandName}" targeting "${targetAudience}".

      GOAL: Find raw, authentic insights that "${targetAudience}" *actually* care about.
      
      ❌ BANNED CONTENT:
      - "Market size is growing by X%" (Users don't care about CAGR)
      - "Global adoption is increasing" (Too vague)
      - "Digital transformation" (Buzzword)

      ✅ REQUIRED CONTENT:
      1. PAIN POINTS: Specific daily struggles. 
      2. TRENDS: Concrete behavioral shifts in ${year}.
      3. NEWS: Recent events (last 3 months).
      4. COMPETITORS: Real alternatives and what users hate about them.
    `;

        const schema = {
            type: "object",
            properties: {
                painPoints: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            point: { type: "string" },
                            source: { type: "string" }
                        }
                    }
                },
                trends: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            trend: { type: "string" },
                            source: { type: "string" }
                        }
                    }
                },
                competitors: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            weakness: { type: "string" },
                            source: { type: "string" }
                        }
                    }
                },
                newsHighlights: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            headline: { type: "string" },
                            date: { type: "string" },
                            url: { type: "string" }
                        }
                    }
                }
            },
            required: ["painPoints", "trends", "competitors"]
        };

        // Execute Agent
        const agentResult = await firecrawlAgent({
            prompt,
            schema,
            timeout: 120000 // 2 minutes internal timeout
        });

        if (!agentResult.success) {
            throw new Error(agentResult.error || 'Agent failed');
        }

        console.log('✅ Agent research complete!');

        // 2. Generate Calendar Plan 
        // Pass userPlan to handle "Premium gets 2 free visuals" logic
        const plan = await generateCalendarPlan(agentResult.data, month, year, userPlan);

        // 3. Save to DB (Stub - in real app we'd save to a 'CalendarGenerations' table)
        // For now, return the data directly for the UI to handle or poll

        return NextResponse.json({
            success: true,
            data: {
                research: agentResult.data,
                plan
            }
        });

    } catch (error: any) {
        console.error('Calendar Generation Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
