import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const reqBody = await request.json();
    let url = reqBody.url;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    // 1. Scrape with Firecrawl & Parallel Web Systems
    console.log('🔥 Scraping:', url);
    let firecrawlMarkdown = '';
    let firecrawlMetadata: any = {};
    let parallelContent = '';
    let parallelImages: string[] = [];
    
    const PARALLEL_API_KEY = process.env.PARALLEL_API_KEY;
    const parallelHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (PARALLEL_API_KEY) {
        parallelHeaders['x-api-key'] = PARALLEL_API_KEY;
    }

    try {
        const [firecrawlRes, parallelRes] = await Promise.allSettled([
            fetch('https://api.firecrawl.dev/v1/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`
                },
                body: JSON.stringify({
                    url,
                    formats: ["markdown", "html", "screenshot"], // Request HTML and Screenshot
                    onlyMainContent: false // Try to get everything including headers/footers for logos
                })
            }),
            fetch('https://api.parallel.ai/v1beta/extract', {
                method: 'POST',
                headers: parallelHeaders,
                body: JSON.stringify({
                    urls: [url],
                    objective: "Extract the brand identity, logo URL, color palette, fonts, brand values, and main product images.",
                    excerpts: true,
                    full_content: false // We use excerpts for focused info, Firecrawl for structure
                })
            })
        ]);

        // Process Firecrawl
        if (firecrawlRes.status === 'fulfilled' && firecrawlRes.value.ok) {
            const scrapeData = await firecrawlRes.value.json();
            if (scrapeData.success) {
                firecrawlMarkdown = scrapeData.data?.markdown || '';
                firecrawlMetadata = { 
                    ...(scrapeData.data?.metadata || {}), 
                    screenshot: scrapeData.data?.screenshot 
                };
                console.log('✅ Firecrawl success');
            } else {
                console.warn('Firecrawl returned success:false', scrapeData);
            }
        } else {
            console.warn('Firecrawl failed or rejected');
        }

        // Process Parallel
        if (parallelRes.status === 'fulfilled' && parallelRes.value.ok) {
            const parallelData = await parallelRes.value.json();
            if (parallelData.results && parallelData.results.length > 0) {
                const result = parallelData.results[0];
                // Extract excerpts
                if (result.excerpts) {
                    parallelContent = result.excerpts.join('\n\n');
                }
                console.log('✅ Parallel AI success');
            }
        } else {
             // Log the error body if possible
             if (parallelRes.status === 'fulfilled') {
                 console.warn('Parallel API failed:', await parallelRes.value.text());
             } else {
                 console.warn('Parallel API rejected:', parallelRes.reason);
             }
        }

    } catch (e) {
        console.warn('Scraping error:', e);
    }
    
    // Helper to extract images from Markdown
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

    const extractedImages = [
        ...extractImagesFromMarkdown(firecrawlMarkdown),
        firecrawlMetadata.ogImage,
        firecrawlMetadata.icon,
        firecrawlMetadata.logo,
        firecrawlMetadata.screenshot
    ].filter(Boolean);

    // Unique images
    const uniqueImages = Array.from(new Set(extractedImages));

    // 2. Analyze with OpenRouter (Grok or other)
    console.log('🤖 Analyzing with OpenRouter...');
    
    const combinedContent = `
    SOURCE 1 (FIRECRAWL METADATA):
    Title: ${firecrawlMetadata.title || 'Unknown'}
    Description: ${firecrawlMetadata.description || 'Unknown'}
    
    SOURCE 2 (FIRECRAWL CONTENT):
    ${firecrawlMarkdown.substring(0, 15000)}

    SOURCE 3 (PARALLEL AI EXTRACT):
    ${parallelContent.substring(0, 5000)}
    
    DETECTED IMAGES:
    ${uniqueImages.join('\n')}
    `;
    
    const prompt = `
      Analyze this website content to extract brand identity information.
      
      Website URL: ${url}
      
      Content:
      ${combinedContent}
      
      Return ONLY a valid JSON object with the following structure:
      {
        "name": "Brand Name",
        "tagline": "Brand Tagline or Slogan",
        "description": "A short summary paragraph (max 200 chars)",
        "colors": ["#hex1", "#hex2", "#hex3", "#hex4"], 
        "fonts": ["Font Name 1", "Font Name 2"],
        "values": ["Value 1", "Value 2", "Value 3"],
        "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
        "services": ["Service 1", "Service 2", "Service 3"],
        "keyPoints": ["Unique Selling Point 1", "USP 2", "USP 3"],
        "aesthetic": ["Adjective 1", "Adjective 2", "Adjective 3"],
        "toneVoice": ["Adjective 1", "Adjective 2", "Adjective 3"],
        "logo": "URL to the MAIN brand logo (prioritize clear, high-res, distinct from client logos)",
        "industry": "Specific industry (e.g. 'SaaS Fintech', 'Organic Skincare', 'Industrial Manufacturing')",
        "visualMotifs": ["Motif 1 (e.g. 'Data charts')", "Motif 2 (e.g. 'Abstract networks')", "Motif 3"],
        "marketingAngles": [
           {
             "title": "Market Authority",
             "concept": "A visual representing leadership in [Industry], showcasing stability and growth. Minimalist and confident."
           },
           {
             "title": "Product Focus",
             "concept": "A high-end product photography setup with dramatic lighting matching brand colors."
           },
           {
             "title": "Customer Success",
             "concept": "A lifestyle shot representing the benefit of the service (e.g. relaxed professional, happy family)."
           }
        ],
        "analyzedImages": [
           { 
             "url": "url_from_detected_list", 
             "category": "main_logo" | "client_logo" | "product" | "app_ui" | "person" | "icon" | "texture" | "other",
             "description": "Short visual description (e.g. 'Dashboard on laptop', 'Man holding coffee cup')"
           }
        ],
        "visualConcepts": [
           "Concept 1: ...",
           "Concept 2: ...",
           "Concept 3: ...",
           "Concept 4: ..."
        ],
        "backgroundPrompts": [
           "Background 1: Description of a textured background (e.g. 'Subtle grain with soft gradient of brand colors')",
           "Background 2: Description of a pattern background (e.g. 'Minimalist geometric shapes in light grey')",
           "Background 3: Description of an abstract background (e.g. 'Blurred abstract forms in brand primary color')"
        ]
      }
      
      IMPORTANT ANALYSIS RULES:
      1. **MAIN LOGO:** Identify the brand's OWN logo. Do NOT mistake 'Client' or 'Partner' logos for the main brand logo. Look for the logo usually found in the navbar or footer top.
      2. **INDUSTRY & MOTIFS:** Identify the specific sector. List 3 visual elements typical of this industry (e.g. for Cybersec: 'Locks', 'Shields', 'Code').
      3. **IMAGE CATEGORIZATION:** 
         - 'main_logo': The brand's logo.
         - 'client_logo': Logos of customers, partners, or 'featured in' sections.
         - 'product': Physical items, packaging, or direct representations of what they sell.
         - 'app_ui': Screenshots of software, dashboards, or mobile app interfaces.
         - 'person': Photos of people, founders, or lifestyle shots.
         - 'icon': Small functional icons or illustrations.
         - 'texture': Abstract backgrounds, patterns, gradients, or zoomed-in details suitable for design backgrounds.
      4. **MAPPING:** 'analyzedImages' must map the URLs from the 'DETECTED IMAGES' list provided above.
      5. **ANGLES:** 'marketingAngles' must be specific. Do NOT use generic phrases. Use the brand's actual value prop.
      6. **BACKGROUNDS:** 'backgroundPrompts' should generate high-quality, versatile backgrounds that match the brand aesthetic, suitable for overlays.
      
      If content is empty, INFER reasonable defaults based on the URL and domain name.
    `;

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://briefbox.vercel.app", // Optional, for including your app on openrouter.ai rankings.
        "X-Title": "BriefBox" // Optional. Shows in rankings on openrouter.ai.
      },
      body: JSON.stringify({
        "model": "openai/gpt-5-mini", // Using GPT-5 Mini as requested
        "messages": [
          {"role": "user", "content": prompt}
        ]
      })
    });

    if (!aiResponse.ok) {
       const err = await aiResponse.text();
       console.error("OpenRouter Error:", err);
       
       // Fallback manual extraction if AI fails
       const fallbackData = {
          name: firecrawlMetadata.title || "Brand Name",
          tagline: firecrawlMetadata.description || "",
          description: firecrawlMetadata.description || "",
          colors: ["#000000", "#ffffff"],
          fonts: ["Sans-serif"],
          values: ["Quality", "Innovation"],
          aesthetic: "Modern",
          toneVoice: "Professional",
          logo: firecrawlMetadata.ogImage || null
       };
       
       return NextResponse.json({
          success: true,
          brand: {
            ...fallbackData,
            url: url,
            images: uniqueImages.length > 0 ? uniqueImages : [fallbackData.logo].filter(Boolean)
          }
       });
    }

    const aiData = await aiResponse.json();
    let text = aiData.choices[0].message.content;
    
    // Clean up markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    
    let brandData;
    try {
        // Ensure we have valid JSON content even if model adds chatter
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            text = jsonMatch[0];
        }
        brandData = JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse JSON from Gemini:", text);
        // Fallback data on parse error
        brandData = {
          name: firecrawlMetadata.title || "Brand",
          description: firecrawlMetadata.description || "",
          colors: ["#000000"],
          aesthetic: "Modern",
          logo: null
        };
    }

    // 3. Refine Images
    // Combine extracted images with AI found logo and metadata
    
    // Refine the main logo selection based on AI classification
    const aiIdentifiedLogo = brandData.analyzedImages?.find((img: any) => img.category === 'main_logo')?.url;
    if (aiIdentifiedLogo) {
        brandData.logo = aiIdentifiedLogo;
    } else if (!brandData.logo && firecrawlMetadata.ogImage) {
        brandData.logo = firecrawlMetadata.ogImage;
    }

    // Prioritize the logo, then unique images found
    const rawImages = [
        brandData.logo,
        firecrawlMetadata.ogImage,
        ...uniqueImages
    ].filter((img) => img && typeof img === 'string' && img.startsWith('http'));

    // Deduplicate URLs
    const uniqueFinalImages = Array.from(new Set(rawImages));

    if (uniqueFinalImages.length === 0) {
        uniqueFinalImages.push('https://placehold.co/600x600?text=Brand+Logo'); 
    }

    // Merge AI categories with final list
    // If AI didn't return analyzedImages, default to 'other'
    const labeledImages = uniqueFinalImages.map(url => {
        const aiData = brandData.analyzedImages?.find((img: any) => img.url === url);
        return {
            url,
            category: aiData?.category || (url === brandData.logo ? 'main_logo' : 'other'),
            description: aiData?.description || ""
        };
    });

    return NextResponse.json({
      success: true,
      brand: {
        ...brandData,
        url: url,
        images: uniqueFinalImages, // Keep simple array for compatibility
        labeledImages: labeledImages // New structured array with descriptions
      }
    });

  } catch (error: any) {
    console.error('Analysis Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}
