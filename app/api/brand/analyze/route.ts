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
  source?: string;
  url?: string;
}

interface ParallelSearchResult {
  url: string;
  title: string;
  publish_date?: string;
  excerpts: string[];
}

// Helper: Search for real industry insights using Parallel Search API
async function searchIndustryInsights(industry: string, brandName: string): Promise<{
  rawExcerpts: string;
  sources: { url: string; title: string }[];
}> {
  const PARALLEL_API_KEY = process.env.PARALLEL_API_KEY;
  
  if (!PARALLEL_API_KEY) {
    console.warn('⚠️ PARALLEL_API_KEY not set, skipping industry search');
    return { rawExcerpts: '', sources: [] };
  }

  try {
    console.log(`🔍 Searching industry insights for: ${industry}`);
    
    const response = await fetch('https://api.parallel.ai/v1beta/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PARALLEL_API_KEY,
        'parallel-beta': 'search-extract-2025-10-10'
      },
      body: JSON.stringify({
        mode: 'agentic',
        objective: `Find specific, quantified market data and trends for the ${industry} industry, specifically related to ${brandName}. 
I do NOT want generic statements like "the market is growing".
I need:
1. Precise numbers (CAGR, Market Value in Billions, User adoption %).
2. Named trends with dates (e.g. "The shift to Headless CMS in 2024").
3. Specific pain points reported by users in this sector.
4. Competitor benchmarks if available.
Focus on data from 2024-2025 reports from Gartner, Forrester, Statista, or specialized industry blogs.`,
        search_queries: [
          `${industry} market size statistics 2024 2025`,
          `${industry} key trends and challenges 2025`,
          `${industry} user pain points report`,
          `${industry} benchmark metrics 2024`
        ],
        max_results: 8,
        excerpts: {
          max_chars_per_result: 3000,
          max_chars_total: 15000
        }
      })
    });

    if (!response.ok) {
      console.warn('Parallel Search API error:', await response.text());
      return { rawExcerpts: '', sources: [] };
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.warn('No search results found');
      return { rawExcerpts: '', sources: [] };
    }

    console.log(`✅ Found ${data.results.length} industry sources`);

    // Compile excerpts and sources
    const sources = data.results.map((r: ParallelSearchResult) => ({
      url: r.url,
      title: r.title
    }));

    const rawExcerpts = data.results
      .map((r: ParallelSearchResult) => {
        const excerptText = r.excerpts?.join('\n\n') || '';
        return `SOURCE: ${r.title} (${r.url})\n${excerptText}`;
      })
      .join('\n\n---\n\n');

    return { rawExcerpts, sources };
  } catch (error) {
    console.error('Industry search error:', error);
    return { rawExcerpts: '', sources: [] };
  }
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

// Helper: Map website to find all URLs using Firecrawl /map
async function mapWebsite(url: string): Promise<string[]> {
    try {
      console.log('🗺️ Mapping website structure:', url);
      const controller = new AbortController();
      // Increased timeout to 45s as Firecrawl mapping can take time for larger sites
      // or when the service is under load.
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const response = await fetch('https://api.firecrawl.dev/v1/map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`
        },
        body: JSON.stringify({
          url,
          search: "about story mission team blog press careers values history",
          ignoreSitemap: false,
          includeSubdomains: false,
          limit: 50
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
      console.warn('Map API failed:', await response.text());
      return [];
    }

    const data = await response.json();
    if (data.success && Array.isArray(data.links)) {
      console.log(`✅ Map found ${data.links.length} potential pages`);
      return data.links;
    }
    return [];
  } catch (e) {
    console.warn('Map error:', e);
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
  
  return discoveredPages.slice(0, 10); // Limit to 10 extra pages for fallback
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
    
    // 1.5. DEEP CRAWL: Recursive crawling for maximum editorial content AND images
    console.log('🔍 Starting recursive deep crawl for editorial content & images...');
    let deepCrawlContent = '';
    let contentNuggets: ContentNugget[] = [];
    let deepCrawlImages: string[] = []; // NEW: Collect images from all crawled pages
    
    // Helper to extract images from Markdown (defined early so we can use it throughout)
    const extractImagesFromMarkdown = (md: string): string[] => {
        const images: string[] = [];
        
        // Pattern 1: Standard markdown ![alt](url)
        const mdRegex = /!\[.*?\]\((https?:\/\/[^)\s]+)\)/g;
        let match;
        while ((match = mdRegex.exec(md)) !== null) {
            if (match[1]) {
                const cleanUrl = match[1].split(' ')[0].replace(/\)$/, '');
                images.push(cleanUrl);
            }
        }
        
        // Pattern 2: HTML img tags <img src="url">
        const imgRegex = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi;
        while ((match = imgRegex.exec(md)) !== null) {
            if (match[1]) {
                images.push(match[1]);
            }
        }
        
        // Pattern 3: Background URLs in style attributes
        const bgRegex = /url\(['"]?(https?:\/\/[^'")\s]+)['"]?\)/gi;
        while ((match = bgRegex.exec(md)) !== null) {
            if (match[1]) {
                images.push(match[1]);
            }
        }
        
        // Pattern 4: Standalone image URLs (common in markdown conversions)
        const standaloneRegex = /(?:^|\s)(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|avif)(?:\?[^\s]*)?)/gmi;
        while ((match = standaloneRegex.exec(md)) !== null) {
            if (match[1]) {
                images.push(match[1].trim());
            }
        }
        
        return images;
    };
    
    // Helper to filter valid images (no tracking pixels, icons too small, etc.)
    const isValidImageUrl = (url: string): boolean => {
        if (!url || !url.startsWith('http')) return false;
        
        const invalidPatterns = [
            /facebook\.com\/tr/i,
            /google-analytics/i,
            /pixel/i,
            /1x1/i,
            /tracking/i,
            /beacon/i,
            /favicon/i,
            /\.ico$/i,
            /data:image/i,
            /placeholder/i,
            /spacer/i,
            /blank\./i,
            /ad\./i,
            /ads\./i,
            /doubleclick/i,
        ];
        
        return !invalidPatterns.some(pattern => pattern.test(url));
    };
    
    // Extract nuggets and images from main page first
    contentNuggets = extractContentNuggets(firecrawlMarkdown + '\n' + parallelContent);
    console.log(`📊 Found ${contentNuggets.length} content nuggets from main page`);
    
    // 🚀 NEW STRATEGY: MAP & SELECT (Holistic Crawling)
    // Instead of blindly crawling links, we MAP the site to find the high-value pages.
    try {
        console.log('🗺️ Mapping site to find Story, About, and Team pages...');
        let targetPages = await mapWebsite(url);
        
        // Fallback if map fails or returns nothing (e.g. single page app or blocked)
        if (targetPages.length === 0) {
            console.log('⚠️ Map failed, falling back to link discovery');
            targetPages = discoverInternalPages(url, firecrawlMarkdown);
        }

        // INTELLIGENT SELECTION: Pick the most valuable pages
        const priorityKeywords = ['about', 'apropos', 'story', 'histoire', 'mission', 'team', 'equipe', 'valeurs', 'manifesto', 'presse'];
        const secondaryKeywords = ['blog', 'news', 'actualites', 'services', 'solutions', 'produits', 'case-studies', 'clients'];
        
        const selectedPages = targetPages.filter(link => {
            const lowerLink = link.toLowerCase();
            if (lowerLink === url || lowerLink === url + '/') return false; // Skip home
            return priorityKeywords.some(k => lowerLink.includes(k)) || 
                   secondaryKeywords.some(k => lowerLink.includes(k));
        });

        // Fill up with other pages if we don't have enough, up to 15
        const finalPagesToScrape = [...new Set([...selectedPages, ...targetPages])].slice(0, 15);
        
        console.log(`🎯 Selected ${finalPagesToScrape.length} high-value pages to scrape:`, finalPagesToScrape);

        // BATCH SCRAPE: Scrape all selected pages in parallel
        // We use Firecrawl /scrape for high quality markdown + metadata
        const scrapePromises = finalPagesToScrape.map(async (pageUrl) => {
            try {
                const controller = new AbortController();
                // Increased to 30s per page to account for rendering, queue times, and heavier pages
                const timeoutId = setTimeout(() => controller.abort(), 30000); 

                const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`
                    },
                    body: JSON.stringify({
                        url: pageUrl,
                        formats: ["markdown", "html"], // HTML helps finding images hidden in markup
                        onlyMainContent: false
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data) {
                        return {
                            url: pageUrl,
                            content: data.data.markdown || '',
                            html: data.data.html || '',
                            metadata: data.data.metadata || {}
                        };
                    }
                }
                return null;
            } catch (err) {
                console.warn(`Failed to scrape ${pageUrl}`, err);
                return null;
            }
        });

        const scrapeResults = await Promise.all(scrapePromises);
        const validResults = scrapeResults.filter(Boolean) as { url: string; content: string; html: string; metadata: any }[];

        console.log(`✅ Successfully scraped ${validResults.length} deep pages`);

        // PROCESS RESULTS
        for (const result of validResults) {
            // Aggregate content for the LLM
            deepCrawlContent += `\n\n--- PAGE: ${result.url} ---\nTITLE: ${result.metadata.title || 'No Title'}\n${result.content.substring(0, 6000)}`;
            
            // Extract Images
            const pageImages = [
                ...extractImagesFromMarkdown(result.content),
                ...extractImagesFromMarkdown(result.html),
                result.metadata?.ogImage,
                result.metadata?.image,
            ].filter(isValidImageUrl);
            
            deepCrawlImages.push(...pageImages);
            
            // Extract Nuggets
            const pageNuggets = extractContentNuggets(result.content);
            contentNuggets = [...contentNuggets, ...pageNuggets];
            
            console.log(`   📄 ${result.url}: ${pageNuggets.length} nuggets, ${pageImages.length} images`);
        }

    } catch (e) {
        console.warn('Deep crawl error:', e);
    }
    
    // Deduplicate nuggets
    const uniqueNuggetMap = new Map<string, ContentNugget>();
    for (const nugget of contentNuggets) {
        const key = nugget.content.toLowerCase().slice(0, 40);
        if (!uniqueNuggetMap.has(key)) {
            uniqueNuggetMap.set(key, nugget);
        }
    }
    contentNuggets = Array.from(uniqueNuggetMap.values()).slice(0, 40); // Increased from 30 to 40

    // ══════════════════════════════════════════════════════════════════════════════
    // COMPREHENSIVE IMAGE COLLECTION - Main page + Deep crawl + Metadata
    // ══════════════════════════════════════════════════════════════════════════════
    const allCollectedImages = [
        // Priority: Main page images
        ...extractImagesFromMarkdown(firecrawlMarkdown),
        
        // Metadata images (high quality, usually hero/og images)
        firecrawlMetadata.ogImage,
        firecrawlMetadata.icon,
        firecrawlMetadata.logo,
        firecrawlMetadata.screenshot,
        firecrawlMetadata.image,
        
        // Deep crawl images (from all crawled pages)
        ...deepCrawlImages
    ].filter(isValidImageUrl);

    // Deduplicate while preserving order (priority first)
    const uniqueImages = Array.from(new Set(allCollectedImages));
    
    console.log(`🖼️ TOTAL UNIQUE IMAGES COLLECTED: ${uniqueImages.length}`);
    console.log(`   - From main page: ${extractImagesFromMarkdown(firecrawlMarkdown).length}`);
    console.log(`   - From deep crawl: ${deepCrawlImages.length}`);
    console.log(`   - From metadata: 5 (og, icon, logo, screenshot, image)`);

    // 2. Analyze with OpenRouter (Grok or other)
    console.log('🤖 Analyzing with OpenRouter...');
    
    // Format content nuggets for the AI
    const nuggetsFormatted = contentNuggets.length > 0 
        ? `\n\nEXTRACTED CONTENT NUGGETS (USE THESE FOR POSTS):\n${contentNuggets.map(n => 
            `- [${n.type.toUpperCase()}] ${n.content}${n.source ? ` (Source: ${n.source})` : ''}`
          ).join('\n')}`
        : '';
    
    // Limit images sent to AI to avoid token limits and ensure quality
    const imagesForAnalysis = uniqueImages.slice(0, 40);

    const combinedContent = `
    SOURCE 1 (FIRECRAWL METADATA):
    Title: ${firecrawlMetadata.title || 'Unknown'}
    Description: ${firecrawlMetadata.description || 'Unknown'}
    
    SOURCE 2 (FIRECRAWL CONTENT - MAIN PAGE):
    ${firecrawlMarkdown.substring(0, 12000)}

    SOURCE 3 (PARALLEL AI EXTRACT):
    ${parallelContent.substring(0, 4000)}
    
    SOURCE 4 (DEEP CRAWL - BLOG/ABOUT/CASE STUDIES - UP TO 7 PAGES):
    ${deepCrawlContent.substring(0, 10000)}
    ${nuggetsFormatted}
    
    DETECTED IMAGES (Analyze these):
    ${imagesForAnalysis.join('\n')}
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
        "brandStory": "A compelling 2-3 sentence summary of the brand's origin, mission, or founding story found in the content.",
        "targetAudience": "Specific description of who this brand targets (e.g. 'Busy HR Managers', 'Eco-conscious students', 'Small Business Owners').",
        "uniqueValueProposition": "The single most important promise or benefit they offer (e.g. 'Saves 10h/week', 'Provides clean water to villages').",
        "colors": ["#hex1", "#hex2", "#hex3", "#hex4"], 
        "fonts": ["Font Name 1", "Font Name 2"],
        "values": ["Value 1", "Value 2", "Value 3"],
        "features": ["Specific Feature 1", "Specific Feature 2", "Specific Feature 3", "Specific Feature 4"],
        "painPoints": ["Customer Pain Point 1", "Pain Point 2", "Pain Point 3"],
        "vocabulary": ["Specific Term 1", "Specific Term 2", "Brand Keyword 1", "Brand Keyword 2"],
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
      2. **VOCABULARY & PAIN POINTS (NEW):**
         - 'vocabulary': Extract specific terms the brand uses. E.g. instead of "software", do they say "Platform", "OS", "Hub"? Extract 4-5 distinct terms.
         - 'painPoints': What problems do they solve? Extract 3-4 specific customer struggles (e.g. "Manual data entry", "Security compliance costs").
      3. **TARGET AUDIENCE & UVP (CRITICAL):**
         - 'targetAudience': Be precise. Not just "Everyone", but "Remote-first CTOs" or "Parents of toddlers".
         - 'uniqueValueProposition': What is the #1 Benefit? If it's a non-profit, it's the Impact (e.g. "Saving oceans"). If service, it's the Outcome (e.g. "Doubling revenue"). If product, it's the Utility.
      4. **INDUSTRY & MOTIFS:** Identify the specific sector. List 3 visual elements typical of this industry (e.g. for Cybersec: 'Locks', 'Shields', 'Code').
      5. **IMAGE CATEGORIZATION (STRICT RULES):** 
         - 'main_logo': The brand's logo.
         - 'client_logo': Logos of customers, partners, or 'featured in' sections.
         - 'product': Physical items, packaging, devices, equipment, or direct representations of what they sell. This includes: microphones, headphones, electronics, tools, furniture, food, clothing, etc.
         - 'app_ui': Screenshots of software, dashboards, or mobile app interfaces.
         - 'person': ONLY classify as 'person' if there is a CLEARLY VISIBLE human face, human body, or human hands. Do NOT classify objects that vaguely resemble humans (like microphones, mannequins, or abstract shapes). If in doubt, choose 'product' or 'other'.
         - 'icon': Small functional icons or illustrations.
         - 'texture': Abstract backgrounds, patterns, gradients, or zoomed-in details suitable for design backgrounds.
         
         ⚠️ CRITICAL: A microphone is ALWAYS 'product', NEVER 'person'. An object with a round top and a stand is NOT a person. Apply strict visual criteria.
      6. **MAPPING:** 'analyzedImages' must map the URLs from the 'DETECTED IMAGES' list provided above.
      7. **SUGGESTED POSTS (CRITICAL - 6-8 suggestions):** Generate smart, contextual post ideas.
         
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
         
      8. **INDUSTRY INSIGHTS (CRITICAL):** Generate 3-4 relevant industry facts/stats.
         
         These should be:
         - Macro-level statistics about the industry (market size, trends, pain points)
         - Written as "Le saviez-vous ?" hooks
         - Credible and specific (not vague claims)
         
         EXAMPLES for a CRM SaaS:
         - { "fact": "Le marché mondial du CRM atteindra 128Mds$ en 2028", "didYouKnow": "Le saviez-vous ? Le CRM est le logiciel d'entreprise #1 en croissance depuis 5 ans", "source": "Gartner 2024" }
         - { "fact": "67% des commerciaux n'atteignent pas leurs quotas", "didYouKnow": "Le saviez-vous ? 2 commerciaux sur 3 passent plus de temps sur l'admin que sur la vente", "source": "Salesforce State of Sales" }
         
      9. **CONTENT NUGGETS:** Extract and structure REAL content found on the site.
         - realStats: Any numbers, percentages, metrics mentioned
         - testimonials: Client quotes with attribution
         - achievements: Awards, certifications, recognitions
         - blogTopics: Headlines/topics from blog or articles section
      10. **BACKGROUNDS:** 'backgroundPrompts' should generate high-quality, versatile backgrounds that match the brand aesthetic, suitable for overlays.
      
      If content is empty, INFER reasonable defaults based on the URL and domain name.
    `;

    // Prepare message content for GPT-4o (Vision or Text)
    const userMessageContent: any[] = [
        { type: "text", text: prompt }
    ];

    // Add screenshot if available
    if (firecrawlMetadata.screenshot && firecrawlMetadata.screenshot.startsWith('http')) {
        console.log('📸 Adding screenshot to Vision analysis');
        userMessageContent.push({
            type: "image_url",
            image_url: {
                "url": firecrawlMetadata.screenshot
            }
        });
    }

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://briefbox.vercel.app", // Optional, for including your app on openrouter.ai rankings.
        "X-Title": "BriefBox" // Optional. Shows in rankings on openrouter.ai.
      },
      body: JSON.stringify({
        "model": "openai/gpt-4o", // Using GPT-4o for high-quality reasoning + Vision
        "messages": [
          {"role": "system", "content": "You are an expert Brand Strategist & Creative Director. Your goal is to deeply analyze a website's content (and screenshot if provided) to extract a precise Brand Identity and actionable Social Media Visual Concepts. You must understand the company's positioning, value proposition, and aesthetic to generating high-converting visual briefs.\n\nIMAGE CLASSIFICATION RULES:\n- 'person' category is ONLY for images with clearly visible human faces, bodies or hands.\n- Objects like microphones, cameras, headphones, or any equipment are ALWAYS 'product', never 'person'.\n- When in doubt between 'person' and 'product', choose 'product'.\n- Apply strict visual analysis, do not anthropomorphize objects."},
          {"role": "user", "content": userMessageContent}
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

    // 4. Search for REAL industry insights using Parallel Search API
    if (brandData.industry) {
        console.log(`🔍 Searching real industry insights for: ${brandData.industry}`);
        
        try {
            const { rawExcerpts, sources } = await searchIndustryInsights(
                brandData.industry, 
                brandData.name || 'the company'
            );
            
            if (rawExcerpts && rawExcerpts.length > 500) {
                console.log('📊 Processing industry data from search...');
                
                // Use AI to extract structured insights from the search results
                const insightPrompt = `
You are an expert Market Analyst.
INDUSTRY: ${brandData.industry}
BRAND: ${brandData.name}

SEARCH RESULTS:
${rawExcerpts.substring(0, 12000)}

TASK: Extract 4-6 ultra-specific market insights.
CRITICAL RULES:
1. **NO GENERIC FLUFF**: Reject phrases like "The market is growing", "Social media is important", "Efficiency is key".
2. **MUST CONTAIN A NUMBER OR PROPER NOUN**: If an insight doesn't have a %, a $, a year, or a specific entity name (e.g. "Google"), DELETE IT.
3. **SOURCE IS MANDATORY**: Must attribute to a specific report or entity found in the text.

FORMAT: Return ONLY a valid JSON array:
[
  {
    "fact": "Specific stat (e.g. 'SaaS churn rates increased to 5.4% in 2024')",
    "didYouKnow": "Le saviez-vous ? [Hook based on the stat]",
    "source": "Source (e.g. 'Paddle 2024 Report')",
    "relevance": "Why this matters for ${brandData.name}"
  }
]`;

                const insightResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        "model": "openai/gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": "You extract business insights from research data and format them for social media. Always return valid JSON."},
                            {"role": "user", "content": insightPrompt}
                        ]
                    })
                });

                if (insightResponse.ok) {
                    const insightData = await insightResponse.json();
                    let insightText = insightData.choices[0]?.message?.content || '';
                    insightText = insightText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
                    
                    try {
                        const jsonMatch = insightText.match(/\[[\s\S]*\]/);
                        if (jsonMatch) {
                            const realInsights = JSON.parse(jsonMatch[0]);
                            
                            // Merge with AI-generated insights, prioritizing real data
                            if (Array.isArray(realInsights) && realInsights.length > 0) {
                                console.log(`✅ Extracted ${realInsights.length} real industry insights`);
                                
                                // Mark these as real data
                                const enrichedInsights = realInsights.map((insight: any) => ({
                                    ...insight,
                                    isRealData: true
                                }));
                                
                                // Replace or merge with AI-generated insights
                                brandData.industryInsights = [
                                    ...enrichedInsights,
                                    ...(brandData.industryInsights || []).slice(0, 2) // Keep max 2 AI-generated as fallback
                                ].slice(0, 6);
                                
                                // Also add source URLs for transparency
                                brandData.industrySources = sources.slice(0, 5);
                            }
                        }
                    } catch (parseError) {
                        console.warn('Failed to parse industry insights:', parseError);
                    }
                }
            }
        } catch (searchError) {
            console.warn('Industry search error:', searchError);
            // Keep AI-generated insights as fallback
        }
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
        // Robust matching: try exact match, then fuzzy match
        const aiData = brandData.analyzedImages?.find((img: any) => {
            if (!img.url) return false;
            if (img.url === url) return true;
            // Fuzzy match: check if one contains the other (handles query params or minor variations)
            if (url.includes(img.url) || img.url.includes(url)) return true;
            return false;
        });

        return {
            url,
            category: aiData?.category || (url === brandData.logo ? 'main_logo' : 'other'),
            description: aiData?.description || ""
        };
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // INJECT REAL EXTRACTED DATA - Don't trust AI to fill contentNuggets properly
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Build REAL contentNuggets from our extraction (not AI-generated)
    const realContentNuggets = {
        realStats: contentNuggets
            .filter(n => n.type === 'stat')
            .map(n => n.content)
            .slice(0, 8),
        testimonials: contentNuggets
            .filter(n => n.type === 'testimonial')
            .map(n => ({
                quote: n.content,
                author: n.source || 'Client',
                company: n.context || ''
            }))
            .slice(0, 5),
        achievements: contentNuggets
            .filter(n => n.type === 'achievement')
            .map(n => n.content)
            .slice(0, 5),
        blogTopics: contentNuggets
            .filter(n => n.type === 'blog_topic')
            .map(n => n.content)
            .slice(0, 5),
        // Keep track of extraction metadata
        _extractedCount: contentNuggets.length,
        _pagesScraped: deepCrawlContent.split('--- PAGE:').length - 1
    };

    // Merge: prioritize REAL data (regex), but accept AI data if it looks valid
    // RELAXED MODE: We allow AI nuggets if they are not duplicates
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const mergeUnique = (real: string[], ai: string[]) => {
        const seen = new Set(real.map(normalize));
        const merged = [...real];
        
        for (const item of ai || []) {
            const norm = normalize(item);
            if (norm.length > 10 && !seen.has(norm)) {
                merged.push(item);
                seen.add(norm);
            }
        }
        return merged.slice(0, 12); // Limit to 12 items
    };

    const mergeTestimonials = (real: any[], ai: any[]) => {
        const seen = new Set(real.map((t: any) => normalize(t.quote)));
        const merged = [...real];
        
        for (const item of ai || []) {
            const norm = normalize(item.quote || '');
            if (norm.length > 20 && !seen.has(norm)) {
                merged.push(item);
                seen.add(norm);
            }
        }
        return merged.slice(0, 8);
    };

    const mergedContentNuggets = {
        realStats: mergeUnique(realContentNuggets.realStats, brandData.contentNuggets?.realStats),
        testimonials: mergeTestimonials(realContentNuggets.testimonials, brandData.contentNuggets?.testimonials),
        achievements: mergeUnique(
            realContentNuggets.achievements, 
            brandData.contentNuggets?.achievements
        ),
        blogTopics: mergeUnique(
            realContentNuggets.blogTopics,
            brandData.contentNuggets?.blogTopics
        ),
        _meta: {
            extractedNuggets: realContentNuggets._extractedCount,
            pagesScraped: realContentNuggets._pagesScraped,
            hasRealData: realContentNuggets.realStats.length > 0 || realContentNuggets.testimonials.length > 0
        }
    };

    console.log('📊 Content Nuggets Summary:');
    console.log(`   Real stats: ${mergedContentNuggets.realStats.length}`);
    console.log(`   Testimonials: ${mergedContentNuggets.testimonials.length}`);
    console.log(`   Achievements: ${mergedContentNuggets.achievements.length}`);
    console.log(`   Blog topics: ${mergedContentNuggets.blogTopics.length}`);
    console.log(`   Pages scraped: ${mergedContentNuggets._meta.pagesScraped}`);

    // Also validate suggestedPosts - mark which ones use real data
    if (Array.isArray(brandData.suggestedPosts)) {
        brandData.suggestedPosts = brandData.suggestedPosts.map((post: any) => {
            // Check if this post's content matches any real extracted data
            const postText = (post.headline || '') + (post.metric || '') + (post.metricLabel || '');
            const usesRealStat = mergedContentNuggets.realStats.some((stat: string) => 
                postText.toLowerCase().includes(stat.toLowerCase().slice(0, 20))
            );
            const usesRealTestimonial = mergedContentNuggets.testimonials.some((t: any) =>
                postText.toLowerCase().includes(t.quote?.toLowerCase().slice(0, 30) || '')
            );
            
            return {
                ...post,
                source: usesRealStat || usesRealTestimonial ? 'real_data' : (post.source || 'generated'),
                _verified: usesRealStat || usesRealTestimonial
            };
        });
    }

    return NextResponse.json({
      success: true,
      brand: {
        ...brandData,
        url: url,
        images: uniqueFinalImages,
        labeledImages: labeledImages,
        contentNuggets: mergedContentNuggets, // OVERRIDE with real data
        _crawlStats: {
            mainPageLength: firecrawlMarkdown.length,
            deepCrawlLength: deepCrawlContent.length,
            pagesScraped: mergedContentNuggets._meta.pagesScraped,
            nuggetsExtracted: mergedContentNuggets._meta.extractedNuggets
        }
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