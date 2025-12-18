import { NextRequest, NextResponse } from 'next/server';
import { firecrawlAgent } from '@/lib/firecrawl';
import { db } from '@/db';
import { brands } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const maxDuration = 300; // 5 minutes timeout for Vercel Pro

// Helper: Transform Agent result to Calendar Plan
// This would typically involve another LLM call, but we'll mock the structure for now or use a basic transform.
async function generateCalendarPlan(agentData: any, month: number, year: number) {
    // TODO: Use Gemini/Claude to generate actual posts from insights
    return {
        month,
        year,
        topics: agentData.trends?.map((t: any) => t.trend) || [],
        posts: [] // To be filled
    };
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { brandId, month, year } = body;

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

        // 2. Generate Calendar Plan (Stub)
        const plan = await generateCalendarPlan(agentResult.data, month, year);

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
