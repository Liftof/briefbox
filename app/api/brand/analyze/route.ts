import { NextResponse } from 'next/server';
import getColors from 'get-image-colors';
import sharp from 'sharp';

// Content nugget types for editorial extraction
interface ContentNugget {
  type: 'stat' | 'testimonial' | 'achievement' | 'fact' | 'blog_topic';
  content: string;
  source?: string;
  context?: string;
}

interface IndustryInsight {
  fact: string;
  didYouKnow: string;
  trend?: string;
}

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

// Helper: Discover internal pages to crawl (blog, about, case studies, etc.)
function discoverInternalPages(baseUrl: string, markdown: string): string[] {
  const url = new URL(baseUrl);
  const baseOrigin = url.origin;
  
  // Keywords to find valuable internal pages
  const valuablePagePatterns = [
    /\/blog\/?$/i, /\/articles?\/?$/i, /\/news\/?$/i, /\/actualites?\/?$/i,
    /\/about\/?$/i, /\/a-propos\/?$/i, /\/qui-sommes-nous\/?$/i,
    /\/case-stud(y|ies)\/?$/i, /\/success-stories?\/?$/i, /\/temoignages?\/?$/i,
    /\/clients?\/?$/i, /\/references?\/?$/i,
    /\/services?\/?$/i, /\/solutions?\/?$/i, /\/products?\/?$/i,
    /\/pricing\/?$/i, /\/tarifs?\/?$/i
  ];
  
  // Extract all links from markdown
  const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  const discoveredPages: string[] = [];
  let match;
  
  while ((match = linkRegex.exec(markdown)) !== null) {
    let href = match[2];
    
    // Convert relative to absolute
    if (href.startsWith('/')) {
      href = baseOrigin + href;
    }
    
    // Only same-origin pages
    if (!href.startsWith(baseOrigin)) continue;
    
    // Check if it matches valuable patterns
    const isValuable = valuablePagePatterns.some(pattern => pattern.test(href));
    if (isValuable && !discoveredPages.includes(href)) {
      discoveredPages.push(href);
    }
  }
  
  // Also try common paths even if not found in content
  const commonPaths = ['/blog', '/about', '/a-propos', '/case-studies', '/clients', '/temoignages'];
  for (const path of commonPaths) {
    const fullUrl = baseOrigin + path;
    if (!discoveredPages.includes(fullUrl)) {
      discoveredPages.push(fullUrl);
    }
  }
  
  return discoveredPages.slice(0, 5); // Limit to 5 extra pages
}

// Helper: Extract content nuggets (stats, quotes, facts) from text
function extractContentNuggets(text: string): ContentNugget[] {
  const nuggets: ContentNugget[] = [];
  
  // Extract statistics (numbers with context)
  const statPatterns = [
    /(\d+(?:[,\.]\d+)?(?:\s*[%xX×]|\s*(?:millions?|milliards?|K\+?|M\+?)))\s+([^.!?\n]{10,80})/gi,
    /([+\-]?\d+(?:[,\.]\d+)?%)\s*(?:de\s+)?([^.!?\n]{10,60})/gi,
    /(\d+(?:\s*\d+)*)\s+(clients?|users?|utilisateurs?|entreprises?|projets?|années?)/gi
  ];
  
  for (const pattern of statPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const stat = match[1];
      const context = match[2] || match[0];
      if (stat && context && context.length > 5) {
        nuggets.push({
          type: 'stat',
          content: `${stat} ${context}`.trim(),
          context: context.trim()
        });
      }
    }
  }
  
  // Extract testimonials/quotes
  const quotePatterns = [
    /"([^"]{30,200})"\s*[-–—]\s*([^,\n]+)/g,
    /«([^»]{30,200})»\s*[-–—]\s*([^,\n]+)/g,
    /"([^"]{30,200})"\s*[-–—]\s*([^,\n]+)/g
  ];
  
  for (const pattern of quotePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      nuggets.push({
        type: 'testimonial',
        content: match[1].trim(),
        source: match[2]?.trim()
      });
    }
  }
  
  // Extract achievements/certifications
  const achievementPatterns = [
    /(certifi[ée]|labelli[ée]|récompens[ée]|award|prix|distinction|best of|top \d+)/gi
  ];
  
  for (const pattern of achievementPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // Get surrounding context (50 chars before and after)
      const start = Math.max(0, match.index - 50);
      const end = Math.min(text.length, match.index + match[0].length + 50);
      const context = text.slice(start, end).replace(/\n/g, ' ').trim();
      
      if (context.length > 20) {
        nuggets.push({
          type: 'achievement',
          content: context
        });
      }
    }
  }
  
  // Remove duplicates and limit
  const uniqueNuggets: ContentNugget[] = [];
  const seen = new Set<string>();
  
  for (const nugget of nuggets) {
    const key = nugget.content.toLowerCase().slice(0, 50);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueNuggets.push(nugget);
    }
  }
  
  return uniqueNuggets.slice(0, 15);
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

    // 1.5. DEEP CRAWL: Discover and scrape additional pages for editorial content
    console.log('🔍 Deep crawling for editorial content...');
    let deepCrawlContent = '';
    let contentNuggets: ContentNugget[] = [];
    
    // Extract nuggets from main page first
    contentNuggets = extractContentNuggets(firecrawlMarkdown + '\n' + parallelContent);
    console.log(`📊 Found ${contentNuggets.length} content nuggets from main page`);
    
    // Discover internal pages
    const internalPages = discoverInternalPages(url, firecrawlMarkdown);
    console.log('🔗 Discovered internal pages:', internalPages);
    
    // Crawl up to 3 internal pages for additional content
    if (internalPages.length > 0) {
        try {
            const deepCrawlPromises = internalPages.slice(0, 3).map(async (pageUrl) => {
                try {
                    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`
                        },
                        body: JSON.stringify({
                            url: pageUrl,
                            formats: ["markdown"],
                            onlyMainContent: true
                        })
                    });
                    
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && data.data?.markdown) {
                            return { url: pageUrl, content: data.data.markdown };
                        }
                    }
                    return null;
                } catch {
                    return null;
                }
            });
            
            const deepResults = await Promise.all(deepCrawlPromises);
            const validResults = deepResults.filter(Boolean) as { url: string; content: string }[];
            
            for (const result of validResults) {
                deepCrawlContent += `\n\n--- PAGE: ${result.url} ---\n${result.content.substring(0, 3000)}`;
                const pageNuggets = extractContentNuggets(result.content);
                contentNuggets = [...contentNuggets, ...pageNuggets];
            }
            
            console.log(`✅ Deep crawl complete: ${validResults.length} pages, ${contentNuggets.length} total nuggets`);
        } catch (e) {
            console.warn('Deep crawl error:', e);
        }
    }
    
    // Deduplicate nuggets
    const uniqueNuggetMap = new Map<string, ContentNugget>();
    for (const nugget of contentNuggets) {
        const key = nugget.content.toLowerCase().slice(0, 40);
        if (!uniqueNuggetMap.has(key)) {
            uniqueNuggetMap.set(key, nugget);
        }
    }
    contentNuggets = Array.from(uniqueNuggetMap.values()).slice(0, 20);
    
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
    
    // Format content nuggets for the AI
    const nuggetsFormatted = contentNuggets.length > 0 
        ? `\n\nEXTRACTED CONTENT NUGGETS (USE THESE FOR POSTS):\n${contentNuggets.map(n => 
            `- [${n.type.toUpperCase()}] ${n.content}${n.source ? ` (Source: ${n.source})` : ''}`
          ).join('\n')}`
        : '';

    const combinedContent = `
    SOURCE 1 (FIRECRAWL METADATA):
    Title: ${firecrawlMetadata.title || 'Unknown'}
    Description: ${firecrawlMetadata.description || 'Unknown'}
    
    SOURCE 2 (FIRECRAWL CONTENT - MAIN PAGE):
    ${firecrawlMarkdown.substring(0, 12000)}

    SOURCE 3 (PARALLEL AI EXTRACT):
    ${parallelContent.substring(0, 4000)}
    
    SOURCE 4 (DEEP CRAWL - BLOG/ABOUT/CASE STUDIES):
    ${deepCrawlContent.substring(0, 5000)}
    ${nuggetsFormatted}
    
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
        "suggestedPosts": [
           {
             "templateId": "stat | announcement | event | quote | expert | product | didyouknow",
             "headline": "Le texte principal du post",
             "subheadline": "Texte secondaire optionnel",
             "metric": "Pour stat: le chiffre clé (ex: '87%', '10K+')",
             "metricLabel": "Pour stat: le contexte du chiffre",
             "source": "real_data | industry_insight | generated",
             "intent": "Pourquoi ce post est pertinent pour cette marque (1 phrase)"
           }
        ],
        "industryInsights": [
           {
             "fact": "Un fait macro sur l'industrie avec un chiffre (ex: 'Le marché du SaaS atteindra 232Mds$ en 2024')",
             "didYouKnow": "Le saviez-vous ? Version vulgarisée et engageante du fait",
             "source": "Source probable ou 'Industry Report 2024'"
           }
        ],
        "contentNuggets": {
           "realStats": ["Statistiques réelles trouvées sur le site"],
           "testimonials": [{"quote": "Citation client", "author": "Nom", "company": "Entreprise"}],
           "achievements": ["Prix, certifications, reconnaissances trouvées"],
           "blogTopics": ["Sujets de blog/articles trouvés sur le site"]
        },
        "analyzedImages": [
           { 
             "url": "url_from_detected_list", 
             "category": "main_logo" | "client_logo" | "product" | "app_ui" | "person" | "icon" | "texture" | "other",
             "description": "Short visual description (e.g. 'Dashboard on laptop', 'Man holding coffee cup')"
           }
        ],
        "backgroundPrompts": [
           "Smooth gradient from [couleur primaire] to black, subtle grain texture, minimal",
           "Soft blurred color wash in [couleur primaire], dreamy and ethereal",
           "Fine geometric grid pattern in [couleur primaire] on dark background, very subtle"
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
      5. **SUGGESTED POSTS (CRITICAL - 6-8 suggestions):** Generate smart, contextual post ideas.
         
         AVAILABLE TEMPLATE IDS:
         - "stat": Big metric post (+47%, 10K+, 3x). REQUIRES: metric + metricLabel
         - "announcement": News/launch post. REQUIRES: headline + subheadline
         - "quote": Testimonial post. REQUIRES: headline (the quote text)
         - "event": Webinar/event post. REQUIRES: headline (event name)
         - "expert": Feature a speaker/expert. REQUIRES: headline + subheadline
         - "product": Product showcase. REQUIRES: headline + subheadline
         - "didyouknow": Industry insight/educational post. REQUIRES: headline (the fact) + subheadline (so what?)
         
         POST SOURCES (in priority order):
         1. REAL DATA (source: "real_data"): Use stats, quotes, achievements from EXTRACTED CONTENT NUGGETS
         2. INDUSTRY INSIGHTS (source: "industry_insight"): Use facts from industryInsights for "didyouknow" posts
         3. GENERATED (source: "generated"): Only if no real data, create plausible specific content
         
         EXAMPLES WITH INTENT:
         - { "templateId": "stat", "metric": "10K+", "metricLabel": "utilisateurs actifs", "source": "real_data", "intent": "Crédibilité sociale - chiffre trouvé sur leur page clients" }
         - { "templateId": "didyouknow", "headline": "85% des équipes perdent 2h/jour sur des tâches répétitives", "subheadline": "L'automatisation change la donne", "source": "industry_insight", "intent": "Pain point industrie → positionnement solution" }
         - { "templateId": "quote", "headline": "On a réduit nos coûts de 40% en 6 mois", "subheadline": "— Sophie Martin, DG @TechCorp", "source": "real_data", "intent": "Preuve sociale avec résultat chiffré" }
         
         RULES:
         - PRIORITIZE real data from extracted nuggets when available
         - Include at least 2 "didyouknow" posts with industry macro insights
         - Each post MUST have an "intent" explaining WHY this post is strategic
         - Be SPECIFIC: not "amélioration" but "+47% en 3 mois"
         
      6. **INDUSTRY INSIGHTS (CRITICAL):** Generate 3-4 relevant industry facts/stats.
         
         These should be:
         - Macro-level statistics about the industry (market size, trends, pain points)
         - Written as "Le saviez-vous ?" hooks
         - Credible and specific (not vague claims)
         
         EXAMPLES for a CRM SaaS:
         - { "fact": "Le marché mondial du CRM atteindra 128Mds$ en 2028", "didYouKnow": "Le saviez-vous ? Le CRM est le logiciel d'entreprise #1 en croissance depuis 5 ans", "source": "Gartner 2024" }
         - { "fact": "67% des commerciaux n'atteignent pas leurs quotas", "didYouKnow": "Le saviez-vous ? 2 commerciaux sur 3 passent plus de temps sur l'admin que sur la vente", "source": "Salesforce State of Sales" }
         
      7. **CONTENT NUGGETS:** Extract and structure REAL content found on the site.
         - realStats: Any numbers, percentages, metrics mentioned
         - testimonials: Client quotes with attribution
         - achievements: Awards, certifications, recognitions
         - blogTopics: Headlines/topics from blog or articles section
      8. **BACKGROUNDS:** 'backgroundPrompts' should generate high-quality, versatile backgrounds that match the brand aesthetic, suitable for overlays.
      
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
