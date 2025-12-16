import { NextResponse } from 'next/server';
import { firecrawlScrape } from '@/lib/firecrawl';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('🌐 Scraping additional source:', url);

    // Use centralized Firecrawl helper with retry on network errors
    const scrapeResult = await firecrawlScrape(url, {
      formats: ['markdown', 'screenshot'],
      timeout: 30000,
      retries: 1, // 1 retry on network/5xx errors
    });

    if (!scrapeResult.success) {
      throw new Error(`Firecrawl failed: ${scrapeResult.error}`);
    }

    const markdown = scrapeResult.markdown;
    const metadata = scrapeResult.metadata;
    const screenshot = scrapeResult.screenshot;

    // Extract Images from Markdown
    const extractImagesFromMarkdown = (md: string) => {
        const regex = /!\[.*?\]\((.*?)\)/g;
        const matches = [];
        let match;
        while ((match = regex.exec(md)) !== null) {
            if (match[1] && match[1].startsWith('http')) {
                matches.push(match[1]);
            }
        }
        return matches;
    };

    const images = [
        ...extractImagesFromMarkdown(markdown),
        metadata.ogImage,
        screenshot
    ].filter(Boolean);

    // Use LLM to extract key insights if text is substantial
    let extractedInfo = {};
    if (markdown.length > 100) {
        const prompt = `
          Analyze this content from a supplemental source URL (${url}).
          Extract key features, services, or selling points that could be relevant for a brand's marketing material.
          
          Content:
          ${markdown.substring(0, 10000)}
          
          Return ONLY a valid JSON object:
          {
            "features": ["Feature 1", "Feature 2"],
            "keyPoints": ["Point 1", "Point 2"]
          }
        `;

        try {
            const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://thepalette.app",
                    "X-Title": "Palette"
                },
                body: JSON.stringify({
                    "model": "openai/gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}]
                })
            });

            if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                let text = aiData.choices[0].message.content;
                text = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
                extractedInfo = JSON.parse(text);
            }
        } catch (e) {
            console.warn('AI Extraction failed for source', e);
        }
    }

    return NextResponse.json({
      success: true,
      data: {
        images: Array.from(new Set(images)), // Deduplicate
        ...extractedInfo
      }
    });

  } catch (error: any) {
    console.error('Source Add Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}

