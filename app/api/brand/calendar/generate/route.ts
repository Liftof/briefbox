import { NextRequest, NextResponse } from 'next/server';
import { firecrawlAgent } from '@/lib/firecrawl';
import { db } from '@/db';
import { brands } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const maxDuration = 300; // 5 minutes timeout for Vercel Pro

// Helper: Transform Agent result to Calendar Plan
async function generateCalendarPlan(agentData: any, month: number, year: number, userPlan: string = 'free') {
    // 4. Distribute posts (Mon, Wed, Fri) throughout the month
    const posts: any[] = [];
    let currentDay = 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Combine all ideas
    const allIdeas = [
        ...(agentData.trends || []).map((t: any) => ({ type: 'trend', ...t })),
        ...(agentData.painPoints || []).map((p: any) => ({ type: 'pain', ...p })),
        ...(agentData.competitors || []).map((c: any) => ({ type: 'competitor', ...c })),
    ];

    let ideaIndex = 0;

    // Iterate through days
    while (currentDay <= daysInMonth && ideaIndex < allIdeas.length) {
        const date = new Date(year, month, currentDay);
        const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ...

        // Schedule on Mon (1), Wed (3), Fri (5)
        if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
            const idea = allIdeas[ideaIndex];
            if (idea) {
                let content = '';
                let platform = 'linkedin';

                if (idea.type === 'trend') {
                    content = `Analyzing the shift: ${idea.trend}. Evidence suggests ${idea.source || 'market data'} supports this.`;
                    platform = 'linkedin';
                } else if (idea.type === 'pain') {
                    content = `Do you struggle with ${idea.point}? You're not alone.`;
                    platform = 'instagram';
                } else {
                    content = `Alternative to ${idea.name}: Here is why users are switching.`;
                    platform = 'twitter';
                }

                posts.push({
                    day: currentDay,
                    idea: idea.type === 'trend' ? `Trend: ${idea.trend}` : (idea.type === 'pain' ? `Problem: ${idea.point}` : `Vs: ${idea.name}`),
                    content,
                    platform,
                    isPremium: false
                });
                ideaIndex++;
            }
        }
        currentDay++;
    }

    // PREMIUM LOGIC: The first 2 posts get "Auto-Generated" flag
    if (userPlan === 'premium') {
        if (posts.length > 0) posts[0].isPremium = true;
        if (posts.length > 1) posts[1].isPremium = true;
    }

    // Map to final structure with dates
    const finalPosts = posts.map(p => {
        const date = new Date(year, month, p.day);
        return {
            scheduledDate: date.toISOString(),
            content: p.content,
            platform: p.platform,
            status: p.isPremium ? 'generated' : 'idea',
            imageUrl: p.isPremium ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' : null
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
