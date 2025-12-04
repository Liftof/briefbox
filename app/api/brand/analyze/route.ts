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

// Helper: Enrich with Firecrawl Search when main scrape is poor
async function enrichWithFirecrawlSearch(
  industry: string, 
  brandName: string,
  targetAudience?: string
): Promise<{
  painPoints: { point: string; source: string }[];
  trends: { trend: string; source: string }[];
  marketContext: string[];
}> {
  const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
  
  if (!FIRECRAWL_API_KEY) {
    console.warn('⚠️ FIRECRAWL_API_KEY not set, skipping enrichment search');
    return { painPoints: [], trends: [], marketContext: [] };
  }

  const results = {
    painPoints: [] as { point: string; source: string }[],
    trends: [] as { trend: string; source: string }[],
    marketContext: [] as string[]
  };

  try {
    console.log(`🔥 Firecrawl Search enrichment for: ${industry} / ${brandName}`);
    
    // Search queries tailored for content creation
    const searches = [
      {
        query: `"${industry}" challenges problems users face 2024`,
        type: 'painPoints'
      },
      {
        query: `"${industry}" trends growth statistics 2024 2025`,
        type: 'trends'
      }
    ];

    // Add audience-specific search if we have target audience
    if (targetAudience) {
      searches.push({
        query: `"${targetAudience}" frustrations problems "${industry}"`,
        type: 'painPoints'
      });
    }

    // Execute searches in parallel
    const searchPromises = searches.map(async (search) => {
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
          },
          body: JSON.stringify({
            query: search.query,
            limit: 5,
            scrapeOptions: {
              formats: ['markdown']
            }
          })
        });

        if (!response.ok) {
          console.warn(`Firecrawl search failed for "${search.query}":`, response.status);
          return { type: search.type, data: [] };
        }

        const data = await response.json();
        return { type: search.type, data: data.data || [] };
      } catch (e) {
        console.warn(`Firecrawl search error for "${search.query}":`, e);
        return { type: search.type, data: [] };
      }
    });

    const searchResults = await Promise.all(searchPromises);

    // Process results
    for (const result of searchResults) {
      for (const item of result.data) {
        const content = item.markdown || item.description || '';
        const source = item.url || 'web';
        
        if (result.type === 'painPoints' && content) {
          // Extract pain point sentences
          const painSentences = content
            .split(/[.!?]/)
            .filter((s: string) => 
              s.length > 30 && 
              s.length < 200 &&
              (s.toLowerCase().includes('challenge') || 
               s.toLowerCase().includes('problem') ||
               s.toLowerCase().includes('struggle') ||
               s.toLowerCase().includes('difficult') ||
               s.toLowerCase().includes('pain') ||
               s.toLowerCase().includes('frustrat'))
            )
            .slice(0, 2);
          
          for (const sentence of painSentences) {
            results.painPoints.push({
              point: sentence.trim(),
              source: new URL(source).hostname
            });
          }
        }
        
        if (result.type === 'trends' && content) {
          // Extract trend/stat sentences
          const trendSentences = content
            .split(/[.!?]/)
            .filter((s: string) => 
              s.length > 30 && 
              s.length < 200 &&
              (s.match(/\d+%/) || // Has percentage
               s.match(/\$\d+/) || // Has dollar amount
               s.toLowerCase().includes('grow') ||
               s.toLowerCase().includes('increase') ||
               s.toLowerCase().includes('trend') ||
               s.toLowerCase().includes('market'))
            )
            .slice(0, 2);
          
          for (const sentence of trendSentences) {
            results.trends.push({
              trend: sentence.trim(),
              source: new URL(source).hostname
            });
          }
        }
      }
    }

    // Deduplicate
    results.painPoints = results.painPoints
      .filter((p, i, arr) => arr.findIndex(x => x.point.slice(0, 50) === p.point.slice(0, 50)) === i)
      .slice(0, 5);
    
    results.trends = results.trends
      .filter((t, i, arr) => arr.findIndex(x => x.trend.slice(0, 50) === t.trend.slice(0, 50)) === i)
      .slice(0, 5);

    console.log(`✅ Firecrawl enrichment: ${results.painPoints.length} pain points, ${results.trends.length} trends`);
    
    return results;
  } catch (error) {
    console.error('Firecrawl enrichment error:', error);
    return results;
  }
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
    
    // Skip SVGs - they often have parsing issues and Sharp can't always handle them
    const isSvg = imageUrl.toLowerCase().includes('.svg') || imageUrl.includes('image/svg');
    if (isSvg) {
      console.log('⚠️ Skipping SVG for color extraction (not supported reliably)');
      return [];
    }
    
    // Fetch the image with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(imageUrl, { 
      signal: controller.signal,
      headers: { 'Accept': 'image/*' }
    });
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.warn('Failed to fetch image for color extraction:', response.status);
      return [];
    }
    
    const contentType = response.headers.get('content-type') || '';
    
    // Double-check for SVG in content-type
    if (contentType.includes('svg')) {
      console.log('⚠️ Detected SVG via content-type, skipping color extraction');
      return [];
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Check if buffer looks like SVG (starts with < or <?xml)
    const bufferStart = buffer.slice(0, 100).toString('utf8').trim();
    if (bufferStart.startsWith('<') || bufferStart.startsWith('<?xml')) {
      console.log('⚠️ Buffer appears to be SVG/XML, skipping');
      return [];
    }
    
    // Convert to PNG using sharp (handles WEBP, etc.)
    const pngBuffer = await sharp(buffer)
      .png()
      .resize(200, 200, { fit: 'inside' })
      .toBuffer();
    
    // Extract colors using get-image-colors
    const colors = await getColors(pngBuffer, 'image/png');
    
    // Convert to hex and filter out near-white/near-black that might be background
    const hexColors = colors
      .map((color: any) => color.hex())
      .filter((hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.05 && luminance < 0.95;
      });
    
    console.log('🎨 Extracted colors:', hexColors);
    return hexColors.slice(0, 5);
  } catch (error: any) {
    // Don't log full error for expected SVG issues
    if (error.message?.includes('XML') || error.message?.includes('SVG')) {
      console.warn('⚠️ SVG processing skipped');
    } else {
      console.error('Color extraction error:', error.message || error);
    }
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
  
  // patterns to exclude (pricing, dates, common UI noise)
  const excludePatterns = [
    /€|\$|£|eur|usd|prix|price|tarif|mois|month|an|year|user|utilisateur/i, // Currency & billing
    /inclus|offert|gratuit|free/i,
    /copyright|all rights reserved/i,
    /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i, // Dates
    /version\s+\d/i,
    /step\s+\d/i,
    /réduction|promo|remise|discount|save/i // Filters out "5% de réduction"
  ];

  for (const pattern of statPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const stat = match[1];
      const context = match[2] || match[0];
      const fullString = `${stat} ${context}`.toLowerCase();
      
      // Skip if matches exclusion patterns
      if (excludePatterns.some(p => p.test(fullString))) continue;

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

    // Store branding data from Firecrawl
    let firecrawlBranding: any = null;
    
    try {
        // Firecrawl mainly for the primary website to get structure
        // NOW WITH BRANDING FORMAT for native color/font extraction!
        const firecrawlPromise = fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`
            },
            body: JSON.stringify({
                url, // Primary URL only for detailed structure
                formats: ["markdown", "html", "screenshot", "branding"], // Added branding!
                onlyMainContent: false,
                proxy: "auto" // Auto-retry with stealth if basic fails
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
                
                // NEW: Extract branding data from Firecrawl native extraction
                if (scrapeData.data?.branding) {
                    firecrawlBranding = scrapeData.data.branding;
                    console.log('✅ Firecrawl branding extracted:', {
                        hasColors: !!firecrawlBranding.colors,
                        hasFonts: !!firecrawlBranding.fonts,
                        hasLogo: !!firecrawlBranding.logo,
                        colorScheme: firecrawlBranding.colorScheme
                    });
                }
                
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
    
    // Log all collected images for debugging
    console.log(`📝 Full Image List (${uniqueImages.length}):`, uniqueImages);

    // 2. Analyze with OpenRouter (Grok or other)
    console.log('🤖 Analyzing with OpenRouter...');
    
    // Format content nuggets for the AI
    // SHORTENED: Reduce content to avoid "prompt too long" errors
    const nuggetsFormatted = contentNuggets.length > 0 
        ? `\nNUGGETS:\n${contentNuggets.slice(0, 15).map(n => `[${n.type}] ${n.content.slice(0, 100)}`).join('\n')}`
        : '';
    
    // Limit images to 25 max
    const imagesForAnalysis = uniqueImages.slice(0, 25);

    // SHORTENED combinedContent - reduced from ~30K to ~15K chars max
    const combinedContent = `
TITLE: ${firecrawlMetadata.title || 'Unknown'}
DESC: ${firecrawlMetadata.description || ''}

MAIN PAGE:
${firecrawlMarkdown.substring(0, 6000)}

EXTRA PAGES:
${deepCrawlContent.substring(0, 4000)}
${nuggetsFormatted}

IMAGES:
${imagesForAnalysis.join('\n')}
`;
    
    // ====== SHORTENED PROMPT - Fixed "prompt too long" error ======
    const prompt = `Extract brand identity from: ${url}

${combinedContent}

Return ONLY valid JSON with this structure:
{
  "name": "Brand Name",
  "tagline": "Slogan",
  "description": "200 char summary",
  "brandStory": "2-3 sentence origin/mission",
  "targetAudience": "Specific audience (e.g. 'Remote CTOs')",
  "uniqueValueProposition": "Main benefit they offer",
  "colors": ["#hex1", "#hex2", "#hex3"],
  "fonts": ["Font 1", "Font 2"],
  "values": ["Value 1", "Value 2"],
  "features": ["Feature 1", "Feature 2", "Feature 3"],
  "painPoints": ["User Pain 1", "Pain 2"],
  "vocabulary": ["Brand Term 1", "Term 2"],
  "services": ["Service 1", "Service 2"],
  "keyPoints": ["USP 1", "USP 2"],
  "aesthetic": ["Adj 1", "Adj 2"],
  "toneVoice": ["Adj 1", "Adj 2"],
  "logo": "URL to brand's OWN logo",
  "industry": "Specific sector",
  "visualMotifs": ["Motif 1", "Motif 2"],
  "suggestedPosts": [{"templateId":"stat|announcement|quote|product|didyouknow","headline":"Hook","subheadline":"Context","metric":"Number","metricLabel":"Label","source":"real_data|generated","intent":"Why"}],
  "industryInsights": [{"painPoint":"Problem with numbers","consequence":"Cost","solution":"How brand solves it","type":"pain_point|trend|cost_of_inaction"}],
  "contentNuggets": {"realStats":[],"testimonials":[{"quote":"","author":"","company":""}],"achievements":[],"blogTopics":[]},
  "analyzedImages": [{"url":"img_url","category":"main_logo|client_logo|product|app_ui|person|icon|texture|other","description":"Brief desc"}],
  "backgroundPrompts": ["Gradient prompt", "Abstract prompt", "Pattern prompt"]
}

RULES:
1. LOGO: Brand's OWN logo only (navbar/footer). Client/partner logos = client_logo category.
2. IMAGES: Categorize ALL images. person = CLEAR human face only. Microphone = product.
3. POSTS: 6-8 posts. Be specific ("+47%" not "amélioration"). Templates: stat, announcement, quote, product, didyouknow.
4. INSIGHTS: User pain points with NUMBERS. NO generic market size stats like "Le marché atteindra X Mds$".
5. TESTIMONIALS: Only if explicitly quoted with author name. Don't invent. Empty array if none found.
6. If content sparse, infer from URL/domain.`;

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

    // 3. COLORS & FONTS - Prioritize Firecrawl native branding extraction
    if (firecrawlBranding) {
        console.log('🎨 Using Firecrawl native branding extraction...');
        
        // Extract colors from branding (more reliable than Sharp!)
        if (firecrawlBranding.colors) {
            const brandingColors: string[] = [];
            const colors = firecrawlBranding.colors;
            
            // Add colors in priority order
            if (colors.primary) brandingColors.push(colors.primary);
            if (colors.secondary) brandingColors.push(colors.secondary);
            if (colors.accent) brandingColors.push(colors.accent);
            if (colors.background && colors.background !== '#FFFFFF' && colors.background !== '#ffffff') {
                brandingColors.push(colors.background);
            }
            if (colors.textPrimary && colors.textPrimary !== '#000000' && colors.textPrimary !== '#FFFFFF') {
                brandingColors.push(colors.textPrimary);
            }
            
            if (brandingColors.length > 0) {
                console.log('✅ Firecrawl colors:', brandingColors);
                // Merge with AI colors, prioritizing Firecrawl's extraction
                const aiColors = Array.isArray(brandData.colors) ? brandData.colors : [];
                brandData.colors = mergeColorPalettes(aiColors, brandingColors);
            }
        }
        
        // Extract fonts from branding
        if (firecrawlBranding.fonts && firecrawlBranding.fonts.length > 0) {
            const brandingFonts = firecrawlBranding.fonts
                .map((f: any) => f.family || f)
                .filter((f: string) => f && f.length > 0);
            
            if (brandingFonts.length > 0) {
                console.log('✅ Firecrawl fonts:', brandingFonts);
                brandData.fonts = brandingFonts;
            }
        }
        
        // Use branding logo if AI didn't find one
        if (!brandData.logo && firecrawlBranding.logo) {
            brandData.logo = firecrawlBranding.logo;
            console.log('✅ Using Firecrawl logo:', firecrawlBranding.logo);
        }
        
        // Store color scheme (light/dark)
        if (firecrawlBranding.colorScheme) {
            brandData._colorScheme = firecrawlBranding.colorScheme;
        }
    }
    
    // Fallback: Extract Colors from Logo using Sharp (if Firecrawl branding failed)
    if (!brandData.colors || brandData.colors.length < 2) {
        let extractedColors: string[] = [];
        const logoUrl = brandData.logo || firecrawlMetadata.ogImage || firecrawlMetadata.icon;
        
        if (logoUrl && logoUrl.startsWith('http')) {
            try {
                console.log('🎨 Fallback: Extracting colors from logo with Sharp:', logoUrl);
                extractedColors = await extractColorsFromImage(logoUrl);
                
                if (extractedColors.length > 0) {
                    console.log('✅ Sharp colors extracted:', extractedColors);
                    const aiColors = Array.isArray(brandData.colors) ? brandData.colors : [];
                    brandData.colors = mergeColorPalettes(aiColors, extractedColors);
                }
            } catch (e) {
                console.warn("Sharp color extraction failed (expected for SVG):", (e as Error).message);
            }
        }
    }

    // Refine the main logo selection based on AI classification
    const aiIdentifiedLogo = brandData.analyzedImages?.find((img: any) => img.category === 'main_logo')?.url;
    if (aiIdentifiedLogo) {
        brandData.logo = aiIdentifiedLogo;
    } else if (!brandData.logo && firecrawlMetadata.ogImage) {
        brandData.logo = firecrawlMetadata.ogImage;
    } else if (!brandData.logo && firecrawlBranding?.images?.logo) {
        brandData.logo = firecrawlBranding.images.logo;
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
    
    // Helper to truncate strings that are too long (e.g. pricing tables)
    const cleanAndTruncate = (str: string, maxLength = 150) => {
        if (!str) return '';
        let clean = str.trim();
        // Check for pricing spam indicators
        if (clean.match(/(\d+€|\/mois|inclus|illimité)/i) && clean.length > 50) {
            // It's likely a pricing table row, discard or truncate heavily
            return ''; 
        }
        if (clean.length > maxLength) {
            return clean.substring(0, maxLength) + '...';
        }
        return clean;
    };

    // Build REAL contentNuggets from our extraction (not AI-generated)
    const realContentNuggets = {
        realStats: contentNuggets
            .filter(n => n.type === 'stat')
            .map(n => cleanAndTruncate(n.content))
            .filter(s => s.length > 5 && s.length < 150) // Filter out empty or huge strings
            .slice(0, 8),
        testimonials: contentNuggets
            .filter(n => n.type === 'testimonial')
            .map(n => ({
                quote: cleanAndTruncate(n.content, 250),
                author: cleanAndTruncate(n.source || 'Client', 50),
                company: cleanAndTruncate(n.context || '', 50)
            }))
            .filter(t => t.quote.length > 10)
            .slice(0, 5),
        achievements: contentNuggets
            .filter(n => n.type === 'achievement')
            .map(n => cleanAndTruncate(n.content))
            .filter(s => s.length > 5)
            .slice(0, 5),
        blogTopics: contentNuggets
            .filter(n => n.type === 'blog_topic')
            .map(n => cleanAndTruncate(n.content))
            .filter(s => s.length > 5)
            .slice(0, 5),
        // Keep track of extraction metadata
        _extractedCount: contentNuggets.length,
        _pagesScraped: deepCrawlContent.split('--- PAGE:').length - 1
    };

    // Helper functions for merging
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
        return merged.slice(0, 12);
    };

    // Merge: prioritize AI data (which acted as a filter), and only fallback to regex if AI missed things
    // OR if AI returned very few items.
    // The user specifically wants an "Intelligent Agent" to filter the scrap.
    // So we trust the AI's curation over the raw regex.
    
    const mergePrioritizingAI = (regex: string[], ai: string[]) => {
        // If AI returned a good list (>= 2 items), trust it completely to avoid re-introducing pricing garbage
        if (ai && ai.length >= 2) {
            return ai.slice(0, 8);
        }
        // Otherwise, mix them but prioritize AI
        const seen = new Set((ai || []).map(normalize));
        const merged = [...(ai || [])];
        
        for (const item of regex || []) {
            const norm = normalize(item);
            // Stricter length check for regex fallback
            if (norm.length > 15 && !seen.has(norm)) {
                merged.push(item);
                seen.add(norm);
            }
        }
        return merged.slice(0, 8);
    };

    const mergeTestimonialsPrioritizingAI = (regex: any[], ai: any[]) => {
        // If AI found verified testimonials, use them
        if (ai && ai.length >= 1) {
            return ai.slice(0, 6);
        }
        
        // Fallback to regex but be careful
        const seen = new Set((ai || []).map((t: any) => normalize(t.quote)));
        const merged = [...(ai || [])];
        
        for (const item of regex || []) {
            const norm = normalize(item.quote || '');
            // Only allow regex testimonials that look substantial
            if (norm.length > 40 && !seen.has(norm)) {
                merged.push(item);
                seen.add(norm);
            }
        }
        return merged.slice(0, 6);
    };

    const mergedContentNuggets = {
        realStats: mergePrioritizingAI(realContentNuggets.realStats, brandData.contentNuggets?.realStats),
        testimonials: mergeTestimonialsPrioritizingAI(realContentNuggets.testimonials, brandData.contentNuggets?.testimonials),
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

    // ═══════════════════════════════════════════════════════════════════════════
    // FIRECRAWL SEARCH ENRICHMENT - When we have sparse data, search the web
    // ═══════════════════════════════════════════════════════════════════════════
    const hasMinimalData = 
      (!brandData.industryInsights || brandData.industryInsights.length < 2) &&
      (mergedContentNuggets.realStats.length < 2) &&
      (!brandData.features || brandData.features.length < 3);

    if (hasMinimalData && brandData.industry) {
      console.log('⚠️ Sparse data detected, triggering Firecrawl Search enrichment...');
      
      try {
        const enrichment = await enrichWithFirecrawlSearch(
          brandData.industry,
          brandData.name || 'the company',
          brandData.targetAudience
        );

        // Convert pain points to industryInsights format (new pain point structure)
        if (enrichment.painPoints.length > 0) {
          const painPointInsights = enrichment.painPoints.map(pp => ({
            painPoint: pp.point,
            consequence: '',
            solution: '',
            type: 'pain_point' as const,
            source: pp.source,
            isEnriched: true
          }));

          brandData.industryInsights = [
            ...(brandData.industryInsights || []),
            ...painPointInsights
          ].slice(0, 6);
          
          console.log(`✅ Added ${painPointInsights.length} pain points from web search`);
        }

        // Add trends as insights too
        if (enrichment.trends.length > 0) {
          const trendInsights = enrichment.trends.map(t => ({
            painPoint: t.trend,
            consequence: '',
            solution: '',
            type: 'trend' as const,
            source: t.source,
            isEnriched: true
          }));

          brandData.industryInsights = [
            ...(brandData.industryInsights || []),
            ...trendInsights
          ].slice(0, 8);
          
          console.log(`✅ Added ${trendInsights.length} trends from web search`);
        }

        // Mark that we enriched from search
        (mergedContentNuggets as any)._meta.enrichedFromSearch = true;
        
      } catch (enrichError) {
        console.warn('Firecrawl enrichment failed:', enrichError);
        // Continue without enrichment
      }
    }

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