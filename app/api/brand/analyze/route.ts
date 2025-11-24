import { NextResponse } from 'next/server';
import getColors from 'get-image-colors';
import sharp from 'sharp';

// Helper: Extract dominant colors from an image URL
async function extractColorsFromImage(imageUrl: string): Promise<string[]> {
  try {
    console.log('🎨 Extracting colors from:', imageUrl);
    
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn('Failed to fetch image for color extraction');
      return [];
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Convert to PNG using sharp (handles SVG, WEBP, etc.)
    const pngBuffer = await sharp(buffer)
      .png()
      .resize(200, 200, { fit: 'inside' }) // Resize for faster processing
      .toBuffer();
    
    // Extract colors using get-image-colors
    const colors = await getColors(pngBuffer, 'image/png');
    
    // Convert to hex and filter out near-white/near-black that might be background
    const hexColors = colors
      .map((color: any) => color.hex())
      .filter((hex: string) => {
        // Filter out very light colors (likely background)
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        // Keep colors that are not too light (>0.95) or too dark (<0.05)
        return luminance > 0.05 && luminance < 0.95;
      });
    
    console.log('🎨 Extracted colors:', hexColors);
    return hexColors.slice(0, 5); // Return top 5 colors
  } catch (error) {
    console.error('Color extraction error:', error);
    return [];
  }
}

// Helper: Merge AI colors with extracted colors, prioritizing extracted
function mergeColorPalettes(aiColors: string[], extractedColors: string[]): string[] {
  if (extractedColors.length === 0) return aiColors;
  if (aiColors.length === 0) return extractedColors;
  
  // Normalize hex colors to uppercase
  const normalize = (hex: string) => hex.toUpperCase().replace(/^#/, '');
  
  // Start with extracted colors (they are the "truth")
  const merged = [...extractedColors];
  
  // Add AI colors that are significantly different from extracted ones
  for (const aiColor of aiColors) {
    const aiNorm = normalize(aiColor);
    const isDifferent = merged.every(extColor => {
      const extNorm = normalize(extColor);
      // Simple color distance check (could be improved with Delta E)
      const rDiff = Math.abs(parseInt(aiNorm.slice(0, 2), 16) - parseInt(extNorm.slice(0, 2), 16));
      const gDiff = Math.abs(parseInt(aiNorm.slice(2, 4), 16) - parseInt(extNorm.slice(2, 4), 16));
      const bDiff = Math.abs(parseInt(aiNorm.slice(4, 6), 16) - parseInt(extNorm.slice(4, 6), 16));
      const totalDiff = rDiff + gDiff + bDiff;
      return totalDiff > 60; // Threshold for "different enough"
    });
    
    if (isDifferent && merged.length < 6) {
      merged.push(aiColor);
    }
  }
  
  return merged.slice(0, 6);
}

export async function POST(request: Request) {
  try {
    const reqBody = await request.json();
    let url = reqBody.url;
    const socialLinks = reqBody.socialLinks || [];
    const otherLinks = reqBody.otherLinks || [];

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    // Gather all URLs to scrape (Website + Socials + Other)
    const urlsToScrape = [url, ...socialLinks, ...otherLinks].filter(
        (u) => u && typeof u === 'string' && u.startsWith('http')
    );

    // 1. Scrape with Firecrawl & Parallel Web Systems
    console.log('🔥 Scraping:', urlsToScrape);
    let firecrawlMarkdown = '';
    let firecrawlMetadata: any = {};
    let parallelContent = '';
    
    const PARALLEL_API_KEY = process.env.PARALLEL_API_KEY;
    const parallelHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (PARALLEL_API_KEY) {
        parallelHeaders['x-api-key'] = PARALLEL_API_KEY;
    }

    try {
        // Firecrawl mainly for the primary website to get structure
        const firecrawlPromise = fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`
            },
            body: JSON.stringify({
                url, // Primary URL only for detailed structure
                formats: ["markdown", "html", "screenshot"],
                onlyMainContent: false
            })
        });

        // Parallel AI for extracting data from ALL links (website + socials)
        const parallelPromise = fetch('https://api.parallel.ai/v1beta/extract', {
            method: 'POST',
            headers: parallelHeaders,
            body: JSON.stringify({
                urls: urlsToScrape, // Send all URLs
                objective: "Extract the brand identity, logo URL, color palette, fonts, brand values, main product images, and analyze social media vibes.",
                excerpts: true,
                full_content: false
            })
        });

        const [firecrawlRes, parallelRes] = await Promise.allSettled([firecrawlPromise, parallelPromise]);

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
                // Concatenate excerpts from all sources
                parallelContent = parallelData.results
                    .map((res: any) => `SOURCE (${res.url}):\n` + (res.excerpts || []).join('\n\n'))
                    .join('\n\n---\n\n');
                console.log('✅ Parallel AI success');
            }
        } else {
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
                // Clean up URL if needed (remove trailing parenthesis if regex caught it)
                let cleanUrl = match[1].split(' ')[0].replace(/\)$/, '');
                matches.push(cleanUrl);
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
             "title": "Short punchy title for the angle",
             "hook": "The ONE thing that makes someone stop scrolling",
             "concept": "DETAILED scene description (100+ words): exact composition, lighting style, specific elements visible, textures, mood. Ready for a senior designer to execute.",
             "emotionalTension": "The before→after or problem→solution implied (e.g. 'From chaos to control')",
             "platform": "instagram or linkedin or both"
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
           "Post stat: [Chiffre clé] en grand sur fond [couleur marque]",
           "Post citation client avec témoignage impactant",
           "Post annonce: [Nouvelle feature/produit] avec headline bold",
           "Post éducatif: Tips ou how-to en format liste"
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
      3. **IMAGE CATEGORIZATION (STRICT RULES):** 
         - 'main_logo': The brand's logo.
         - 'client_logo': Logos of customers, partners, or 'featured in' sections.
         - 'product': Physical items, packaging, devices, equipment, or direct representations of what they sell. This includes: microphones, headphones, electronics, tools, furniture, food, clothing, etc.
         - 'app_ui': Screenshots of software, dashboards, or mobile app interfaces.
         - 'person': ONLY classify as 'person' if there is a CLEARLY VISIBLE human face, human body, or human hands. Do NOT classify objects that vaguely resemble humans (like microphones, mannequins, or abstract shapes). If in doubt, choose 'product' or 'other'.
         - 'icon': Small functional icons or illustrations.
         - 'texture': Abstract backgrounds, patterns, gradients, or zoomed-in details suitable for design backgrounds.
         
         ⚠️ CRITICAL: A microphone is ALWAYS 'product', NEVER 'person'. An object with a round top and a stand is NOT a person. Apply strict visual criteria.
      4. **MAPPING:** 'analyzedImages' must map the URLs from the 'DETECTED IMAGES' list provided above.
      5. **ANGLES (CRITICAL):** Generate 4-5 INDUSTRY-SPECIFIC marketing angles. Each must be a CONCRETE VISUAL CONCEPT, not generic marketing speak.
         
         ADAPT TO INDUSTRY:
         - SaaS/B2B: Dashboard moments, metric callouts, team collaboration scenes, before/after transformations
         - E-commerce: Unboxing, lifestyle context, detail shots, flat lays
         - Beauty: Rituals, texture close-ups, subtle before/after, ingredient stories
         - Food: Hero shots with steam/drips, ingredient spreads, social moments
         - Tech: Product glory shots, in-use contexts, detail macro shots
         - Finance: Freedom/control visuals, growth charts, trust signals
         
         EACH ANGLE MUST HAVE:
         - 'hook': What stops the scroll (be specific: "The contrast between messy desk and clean dashboard")
         - 'concept': 100+ word scene description with lighting, composition, elements, textures
         - 'emotionalTension': The transformation implied (e.g. "From anxiety to peace of mind")
         
         BAD: "Showcase authority" or "Professional image"
         GOOD: "Close-up of weathered hands holding the product against morning window light. Soft bokeh background with green plant visible. Product label slightly angled toward camera. Warm color grade, subtle film grain. Conveys authenticity and craft."
      6. **BACKGROUNDS:** 'backgroundPrompts' should generate high-quality, versatile backgrounds that match the brand aesthetic, suitable for overlays.
      7. **VISUAL CONCEPTS (CRITICAL):** Generate 4 SHORT briefs for STATIC SOCIAL MEDIA POSTS (graphic design, NOT photos). Format: "Type de post: Description courte du design" (max 15 mots chacun).
         BONS: "Post stat: +47% de croissance sur fond noir, typo bold blanche"
         BONS: "Post citation: Témoignage client avec guillemets géants en accent"
         MAUVAIS: "A cluttered desk with papers..." (c'est une photo, pas un design)
         MAUVAIS: "Morning light filtering through..." (c'est cinématique, pas du graphisme)
      
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
        "model": "openai/gpt-4o", // Using GPT-4o for high-quality reasoning (simulating 'gpt-5.1-chat' capability)
        "messages": [
          {"role": "system", "content": "You are an expert Brand Strategist & Creative Director. Your goal is to deeply analyze a website's content to extract a precise Brand Identity and actionable Social Media Visual Concepts. You must understand the company's positioning, value proposition, and aesthetic to generating high-converting visual briefs.\n\nIMAGE CLASSIFICATION RULES:\n- 'person' category is ONLY for images with clearly visible human faces, bodies or hands.\n- Objects like microphones, cameras, headphones, or any equipment are ALWAYS 'product', never 'person'.\n- When in doubt between 'person' and 'product', choose 'product'.\n- Apply strict visual analysis, do not anthropomorphize objects."},
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

    // 3. Extract Colors from Logo (if available) - REAL EXTRACTION
    let extractedColors: string[] = [];
    const logoUrl = brandData.logo || firecrawlMetadata.ogImage || firecrawlMetadata.icon;
    
    if (logoUrl && logoUrl.startsWith('http')) {
        try {
            console.log('🎨 Extracting REAL colors from logo:', logoUrl);
            extractedColors = await extractColorsFromImage(logoUrl);
            
            if (extractedColors.length > 0) {
                console.log('✅ Real colors extracted:', extractedColors);
                // Merge with AI-guessed colors, prioritizing extracted
                const aiColors = Array.isArray(brandData.colors) ? brandData.colors : [];
                brandData.colors = mergeColorPalettes(aiColors, extractedColors);
                console.log('🎨 Final merged palette:', brandData.colors);
            }
        } catch (e) {
            console.error("Color extraction failed:", e);
            // Keep AI colors if extraction fails
        }
    }

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
