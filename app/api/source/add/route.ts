import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('🌐 Scraping additional source:', url);

    // Use Firecrawl V2 to get content - faster with caching
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "screenshot"],
        // V2 improvements
        maxAge: 86400, // 1 day cache
        blockAds: true,
        skipTlsVerification: true
      })
    });

    if (!firecrawlResponse.ok) {
        throw new Error(`Firecrawl failed: ${await firecrawlResponse.text()}`);
    }

    const scrapeData = await firecrawlResponse.json();
    const markdown = scrapeData.data?.markdown || '';
    const metadata = scrapeData.data?.metadata || {};
    const screenshot = scrapeData.data?.screenshot;

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

