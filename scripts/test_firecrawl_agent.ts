
import dotenv from 'dotenv';
// Load env vars BEFORE importing the library
dotenv.config({ path: '.env.local' });

async function testAgent() {
    // Dynamic import to ensure env vars are loaded first
    const { firecrawlAgent } = await import('../lib/firecrawl');

    console.log('🧪 Testing Firecrawl Agent...');
    const start = Date.now();

    const prompt = `
      You are a "No Bullshit" Market Researcher. 
      Analyze the "Project Management" market specifically for the brand "Linear" targeting "Product-led teams".

      GOAL: Find raw, authentic insights that Product-led teams *actually* care about.
      
      ❌ BANNED CONTENT (Do NOT return):
      - "Market size is growing by X%" (Users don't care about CAGR)
      - "Global adoption is increasing" (Too vague)
      - "Digital transformation" (Buzzword)
      - Generic boilerplate like "Efficiency is key"

      ✅ REQUIRED CONTENT (MusT return):
      1. PAIN POINTS: Specific daily struggles of Product-led teams. 
      2. TRENDS: Concrete behavioral shifts in 2024-2025.
      3. NEWS: Recent events (last 3 months) relevant to this specific niche.
      4. COMPETITORS: Real alternatives and what users hate about them.

      Navigate deep. Read Reddit, G2, Capterra, niche blogs.
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
        },
        required: ["painPoints", "trends"]
    };

    try {
        const result = await firecrawlAgent({
            prompt,
            schema,
            timeout: 90000
        });

        const duration = (Date.now() - start) / 1000;
        console.log(`⏱️ Duration: ${duration}s`);

        if (result.success) {
            console.log('✅ Success!');
            console.log('DATA:', JSON.stringify(result.data, null, 2));
        } else {
            console.error('❌ Failed:', result.error);
        }

    } catch (e) {
        console.error('❌ Script Error:', e);
    }
}

testAgent();
