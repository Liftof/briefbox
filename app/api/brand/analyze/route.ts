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

// Helper: Use Firecrawl Extract v2 for structured data with web search enrichment
// Docs: https://docs.firecrawl.dev/features/extract
// UPGRADED TO V2: Better extraction, JSON format, caching
async function extractWithFirecrawl(
  url: string,
  industry: string,
  brandName: string
): Promise<{
  painPoints: { problem: string; impact: string; source?: string }[];
  trends: { trend: string; relevance: string; source?: string }[];
  competitorInsights: string[];
}> {
  const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
  
  if (!FIRECRAWL_API_KEY) {
    console.warn('⚠️ FIRECRAWL_API_KEY not set, skipping Extract');
    return { painPoints: [], trends: [], competitorInsights: [] };
  }

  try {
    console.log(`🔥 Firecrawl Extract v2 with web search for: ${industry}`);
    
    // V2 Extract API - uses prompt + schema directly (not formats array)
    const response = await fetch('https://api.firecrawl.dev/v2/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        urls: [url],
        prompt: `For a ${industry} company called "${brandName}", extract:
1. Pain points their target users face (with specific impact/cost)
2. Current industry trends (2024-2025)
3. Competitive landscape insights

Focus on actionable marketing angles. Be specific with numbers when available.`,
        // V2 Extract uses schema directly, not formats array
        schema: {
          type: 'object',
          properties: {
            painPoints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  problem: { type: 'string', description: 'The specific user problem' },
                  impact: { type: 'string', description: 'Quantified impact (time/money lost)' }
                },
                required: ['problem', 'impact']
              }
            },
            trends: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  trend: { type: 'string', description: 'The industry trend' },
                  relevance: { type: 'string', description: 'Why it matters for this brand' }
                },
                required: ['trend', 'relevance']
              }
            },
            competitorInsights: {
              type: 'array',
              items: { type: 'string' },
              description: 'Key competitor positioning or market gaps'
            }
          },
          required: ['painPoints', 'trends', 'competitorInsights']
        },
        enableWebSearch: true // KEY: This expands search beyond the URL!
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Firecrawl Extract API error:', errorText);
      return { painPoints: [], trends: [], competitorInsights: [] };
    }

    const data = await response.json();
    
    // Handle async job (Extract can return a job ID)
    if (data.jobId || data.id) {
      console.log(`🔄 Firecrawl Extract job started: ${data.jobId || data.id}`);
      // For now, we won't wait - return empty and let the other enrichments handle it
      // In V2, we could poll for completion
      return { painPoints: [], trends: [], competitorInsights: [] };
    }

    if (data.success && data.data) {
      console.log(`✅ Firecrawl Extract success:`, {
        painPoints: data.data.painPoints?.length || 0,
        trends: data.data.trends?.length || 0,
        competitorInsights: data.data.competitorInsights?.length || 0
      });
      return {
        painPoints: data.data.painPoints || [],
        trends: data.data.trends || [],
        competitorInsights: data.data.competitorInsights || []
      };
    }

    return { painPoints: [], trends: [], competitorInsights: [] };
  } catch (error) {
    console.error('Firecrawl Extract error:', error);
    return { painPoints: [], trends: [], competitorInsights: [] };
  }
}

// Helper: Smart Firecrawl Search for competitive intelligence & market insights
// Uses: sources (news), categories (research), tbs (time filter) per docs.firecrawl.dev/features/search
async function enrichWithFirecrawlSearch(
  industry: string, 
  brandName: string,
  targetAudience?: string
): Promise<{
  painPoints: { point: string; source: string }[];
  trends: { trend: string; source: string; isRecent?: boolean }[];
  marketContext: string[];
  competitors: { name: string; weakness?: string; source: string }[];
  newsHighlights: { headline: string; date?: string; url: string }[];
}> {
  const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
  
  if (!FIRECRAWL_API_KEY) {
    console.warn('⚠️ FIRECRAWL_API_KEY not set, skipping enrichment search');
    return { painPoints: [], trends: [], marketContext: [], competitors: [], newsHighlights: [] };
  }

  const results = {
    painPoints: [] as { point: string; source: string }[],
    trends: [] as { trend: string; source: string; isRecent?: boolean }[],
    marketContext: [] as string[],
    competitors: [] as { name: string; weakness?: string; source: string }[],
    newsHighlights: [] as { headline: string; date?: string; url: string }[]
  };

  try {
    console.log(`🔥 Smart Firecrawl Search for: ${industry} / ${brandName}`);
    
    // STRATEGIC SEARCH MATRIX - Focus on END CUSTOMER problems, NOT industry meta-data!
    // IMPORTANT: We want insights that speak TO the customer, not ABOUT the industry
    const searches = [
      // 1. PAIN POINTS - What problems does the END CUSTOMER face?
      // NOT "SaaS market grew 30%" but "Teams waste 5h/week on manual tasks"
      {
        query: targetAudience 
          ? `"${targetAudience}" problems challenges frustrations statistics`
          : `people problems with "${industry}" frustrations complaints`,
        type: 'painPoints',
        config: { limit: 5, scrapeOptions: { formats: ['markdown'] } }
      },
      
      // 2. CONSUMER/USER TRENDS - What's changing for END CUSTOMERS?
      // NOT "Industry grew" but "More people are doing X"
      {
        query: targetAudience
          ? `"${targetAudience}" behavior trends statistics 2024 2025`
          : `consumer trends "${industry}" behavior changes statistics`,
        type: 'trends',
        config: { limit: 5, tbs: 'qdr:m' }
      },
      
      // 3. RELEVANT NEWS - Topics the END CUSTOMER cares about
      {
        query: targetAudience 
          ? `"${targetAudience}" news impact`
          : `"${industry}" impact consumers users`,
        type: 'news',
        config: { limit: 5, sources: ['news'] }
      },
      
      // 4. COMPETITOR ANALYSIS - What are customers saying about alternatives?
      {
        query: `"${brandName}" alternatives OR competitors reviews complaints`,
        type: 'competitors',
        config: { limit: 5, scrapeOptions: { formats: ['markdown'] } }
      },
      
      // 5. RESEARCH/STATS - Stats that resonate with END CUSTOMERS
      // NOT "Market size $X billion" but "X% of people struggle with Y"
      {
        query: targetAudience
          ? `"${targetAudience}" statistics research study percentage`
          : `"${industry}" customer statistics user research percentage`,
        type: 'research',
        config: { limit: 3, categories: ['research'] }
      }
    ];

    // Add specific customer problem search
    if (targetAudience && targetAudience.length > 3) {
      searches.push({
        query: `"${targetAudience}" biggest challenges pain points statistics survey`,
        type: 'painPoints',
        config: { limit: 3, scrapeOptions: { formats: ['markdown'] } }
      });
    }

    // Execute ALL searches in parallel for speed - V2 API with sources support
    const searchPromises = searches.map(async (search) => {
      try {
        // V2: Add sources for news/images when relevant
        const searchBody: any = {
          query: search.query,
          ...search.config,
          // V2 improvements
          maxAge: 172800, // 2 days cache (faster responses)
        };
        
        // V2: Use sources for news searches
        if (search.type === 'news') {
          searchBody.sources = ['news'];
        }
        
        const response = await fetch('https://api.firecrawl.dev/v2/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
          },
          body: JSON.stringify(searchBody)
        });

        if (!response.ok) {
          console.warn(`Search failed for "${search.type}":`, response.status);
          return { type: search.type, data: null, rawResponse: null };
        }

        const data = await response.json();
        return { type: search.type, data: data.data, rawResponse: data };
      } catch (e) {
        console.warn(`Search error for "${search.type}":`, e);
        return { type: search.type, data: null, rawResponse: null };
      }
    });

    const searchResults = await Promise.all(searchPromises);

    // PROCESS EACH RESULT TYPE DIFFERENTLY
    for (const result of searchResults) {
      if (!result.data) continue;

      // Handle different response structures
      const webResults = Array.isArray(result.data) ? result.data : (result.data.web || []);
      const newsResults = result.data.news || [];
      
      // === PAIN POINTS: Extract frustration sentences ===
      if (result.type === 'painPoints') {
        for (const item of webResults) {
          const content = item.markdown || item.description || '';
          try {
            const hostname = new URL(item.url || '').hostname;
            const painSentences = content
              .split(/[.!?]/)
              .filter((s: string) => 
                s.length > 40 && s.length < 250 &&
                (s.toLowerCase().includes('challenge') || 
                 s.toLowerCase().includes('struggle') ||
                 s.toLowerCase().includes('frustrat') ||
                 s.toLowerCase().includes('difficult') ||
                 s.toLowerCase().includes('pain point') ||
                 s.toLowerCase().includes('problem'))
              )
              .slice(0, 2);
            
            for (const sentence of painSentences) {
              results.painPoints.push({ point: sentence.trim(), source: hostname });
            }
          } catch (e) { /* skip invalid URLs */ }
        }
      }
      
      // === TRENDS: Extract with stats/numbers ===
      if (result.type === 'trends' || result.type === 'research') {
        for (const item of webResults) {
          const content = item.markdown || item.description || item.snippet || '';
          try {
            const hostname = new URL(item.url || '').hostname;
            const trendSentences = content
              .split(/[.!?]/)
              .filter((s: string) => 
                s.length > 40 && s.length < 250 &&
                (s.match(/\d+%/) || s.match(/\$[\d,]+/) || s.match(/\d+x/) ||
                 s.toLowerCase().includes('grow') ||
                 s.toLowerCase().includes('increase') ||
                 s.toLowerCase().includes('rise') ||
                 s.toLowerCase().includes('market') ||
                 s.toLowerCase().includes('trend'))
              )
              .slice(0, 2);
            
            for (const sentence of trendSentences) {
              results.trends.push({ 
                trend: sentence.trim(), 
                source: hostname,
                isRecent: result.type === 'trends' // tbs filtered = recent
              });
            }
          } catch (e) { /* skip */ }
        }
      }
      
      // === NEWS: Headlines for content inspiration ===
      if (result.type === 'news' && newsResults.length > 0) {
        for (const news of newsResults.slice(0, 4)) {
          results.newsHighlights.push({
            headline: news.title || news.snippet || '',
            date: news.date,
            url: news.url
          });
        }
        console.log(`📰 Found ${newsResults.length} news items`);
      }
      
      // === COMPETITORS: Extract names and potential weaknesses ===
      if (result.type === 'competitors') {
        for (const item of webResults) {
          const content = item.markdown || item.description || '';
          const title = item.title || '';
          
          // Extract competitor names from "X vs Y" or "alternatives to X" patterns
          const vsMatch = title.match(/(\w+)\s+vs\s+(\w+)/i);
          const altMatch = content.match(/alternatives?(?:\s+to)?\s+(\w+)/i);
          
          if (vsMatch) {
            const comp = vsMatch[1] !== brandName ? vsMatch[1] : vsMatch[2];
            if (comp && comp.toLowerCase() !== brandName.toLowerCase()) {
              // Look for weakness mentions
              const weaknessMatch = content.match(new RegExp(`${comp}[^.]*(?:lacks?|missing|doesn't|no |without)[^.]*`, 'i'));
              try {
                results.competitors.push({
                  name: comp,
                  weakness: weaknessMatch ? weaknessMatch[0].slice(0, 100) : undefined,
                  source: new URL(item.url || '').hostname
                });
              } catch (e) { /* skip */ }
            }
          }
        }
      }
    }

    // DEDUPLICATE all results
    results.painPoints = results.painPoints
      .filter((p, i, arr) => arr.findIndex(x => x.point.slice(0, 50) === p.point.slice(0, 50)) === i)
      .slice(0, 6);
    
    results.trends = results.trends
      .filter((t, i, arr) => arr.findIndex(x => x.trend.slice(0, 50) === t.trend.slice(0, 50)) === i)
      .slice(0, 6);
    
    results.competitors = results.competitors
      .filter((c, i, arr) => arr.findIndex(x => x.name.toLowerCase() === c.name.toLowerCase()) === i)
      .slice(0, 5);

    console.log(`✅ Smart Search results:`, {
      painPoints: results.painPoints.length,
      trends: results.trends.length,
      news: results.newsHighlights.length,
      competitors: results.competitors.length
    });
    
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

// Helper: Map website to find all URLs using Firecrawl /map V2
// V2: sitemap param replaces ignoreSitemap, better redirect handling
async function mapWebsite(url: string): Promise<string[]> {
    try {
      console.log('🗺️ Mapping website structure (v2):', url);
      const controller = new AbortController();
      // Increased timeout to 45s as Firecrawl mapping can take time for larger sites
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const response = await fetch('https://api.firecrawl.dev/v2/map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`
        },
        body: JSON.stringify({
          url,
          search: "about story mission team blog press careers values history",
          // V2: sitemap param instead of ignoreSitemap
          sitemap: "include", // "only" | "skip" | "include"
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
        'parallel-beta': 'search-extract-2025-10-10', // Required header value for beta API
    };
    if (PARALLEL_API_KEY) {
        parallelHeaders['x-api-key'] = PARALLEL_API_KEY;
    }

    try {
        // Firecrawl V2 for the primary website - faster with caching & better branding detection
        const firecrawlPromise = fetch('https://api.firecrawl.dev/v2/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`
            },
            body: JSON.stringify({
                url, // Primary URL only for detailed structure
                formats: ["markdown", "html", "screenshot"],
                onlyMainContent: false,
                // V2 improvements for speed
                maxAge: 86400, // 1 day cache
                blockAds: true,
                skipTlsVerification: true,
                removeBase64Images: true
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
        if (firecrawlRes.status === 'fulfilled') {
            if (firecrawlRes.value.ok) {
                const scrapeData = await firecrawlRes.value.json();
                if (scrapeData.success) {
                    firecrawlMarkdown = scrapeData.data?.markdown || '';
                    firecrawlMetadata = { 
                        ...(scrapeData.data?.metadata || {}), 
                        screenshot: scrapeData.data?.screenshot 
                    };
                    console.log('✅ Firecrawl success - markdown length:', firecrawlMarkdown.length);
                } else {
                    console.warn('⚠️ Firecrawl returned success:false:', JSON.stringify(scrapeData).slice(0, 500));
                }
            } else {
                const errorText = await firecrawlRes.value.text();
                console.warn('⚠️ Firecrawl HTTP error:', firecrawlRes.value.status, errorText.slice(0, 500));
            }
        } else {
            console.warn('⚠️ Firecrawl promise rejected:', firecrawlRes.reason);
        }

        // Process Parallel
        if (parallelRes.status === 'fulfilled') {
            if (parallelRes.value.ok) {
                const parallelData = await parallelRes.value.json();
                if (parallelData.results && parallelData.results.length > 0) {
                    // Concatenate excerpts from all sources
                    parallelContent = parallelData.results
                        .map((res: any) => `SOURCE (${res.url}):\n` + (res.excerpts || []).join('\n\n'))
                        .join('\n\n---\n\n');
                    console.log('✅ Parallel AI success - sources:', parallelData.results.length);
                } else {
                    console.log('ℹ️ Parallel AI returned no results');
                }
            } else {
                const errorText = await parallelRes.value.text();
                console.warn('⚠️ Parallel API HTTP error:', parallelRes.value.status, errorText.slice(0, 300));
            }
        } else {
            console.warn('⚠️ Parallel API rejected:', parallelRes.reason);
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

        // BATCH SCRAPE V2: Scrape all selected pages in parallel
        // V2: Faster with caching, better error handling
        const scrapePromises = finalPagesToScrape.map(async (pageUrl) => {
            try {
                const controller = new AbortController();
                // Increased to 30s per page to account for rendering, queue times, and heavier pages
                const timeoutId = setTimeout(() => controller.abort(), 30000); 

                const res = await fetch('https://api.firecrawl.dev/v2/scrape', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`
                    },
                    body: JSON.stringify({
                        url: pageUrl,
                        formats: ["markdown", "html"], // HTML helps finding images hidden in markup
                        onlyMainContent: false,
                        // V2 speed improvements
                        maxAge: 86400, // 1 day cache
                        blockAds: true,
                        skipTlsVerification: true
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
    const nuggetsFormatted = contentNuggets.length > 0 
        ? `\n\nEXTRACTED CONTENT NUGGETS (USE THESE FOR POSTS):\n${contentNuggets.map(n => 
            `- [${n.type.toUpperCase()}] ${n.content}${n.source ? ` (Source: ${n.source})` : ''}`
          ).join('\n')}`
        : '';
    
    // Limit images sent to AI to avoid token limits and ensure quality
    const imagesForAnalysis = uniqueImages.slice(0, 40);

    // Full content - using Claude-3.5-Sonnet which has 200K context
    const combinedContent = `
    SOURCE 1 (METADATA):
    Title: ${firecrawlMetadata.title || 'Unknown'}
    Description: ${firecrawlMetadata.description || 'Unknown'}
    
    SOURCE 2 (MAIN PAGE CONTENT):
    ${firecrawlMarkdown.substring(0, 15000)}

    SOURCE 3 (PARALLEL AI):
    ${parallelContent.substring(0, 5000)}
    
    SOURCE 4 (DEEP CRAWL):
    ${deepCrawlContent.substring(0, 12000)}
    ${nuggetsFormatted}
    
    DETECTED IMAGES (${imagesForAnalysis.length}):
    ${imagesForAnalysis.join('\n')}
    `;
    
    console.log(`📊 Prompt content size: ~${combinedContent.length} chars (using Claude-3.5-Sonnet 200K context)`);
    
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
             "painPoint": "CRITICAL: This must be relevant to the END CUSTOMER, not about the client's industry! Example: If client is a SaaS, don't say 'The SaaS market grew 30%'. Instead say '68% of teams waste 5h/week on manual tasks'. If client is a clothing brand, don't say 'Fashion industry is booming'. Instead say '40% of fashion is fast-fashion, damaging the environment'. ALWAYS think: what does the END CUSTOMER care about?",
             "consequence": "The cost/impact for the END CUSTOMER (time, money, stress, environment, health...)",
             "solution": "How the product/service solves THIS SPECIFIC problem for the customer",
             "type": "pain_point | trend | cost_of_inaction | social_proof"
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
         
         USER-CENTRIC RULES (MANDATORY):
         - **STOP THE SCROLL:** Every headline must be a "hook". Avoid generic titles like "Nos services". Use "Comment doubler vos ventes" instead.
         - **PAIN POINTS FIRST:** Address a specific user problem or desire. "Tired of manual data entry?" is better than "We offer automation".
         - **BENEFIT ORIENTED:** Focus on what the user GETS, not just what the brand HAS.
         
         EXAMPLES WITH INTENT:
         - { "templateId": "stat", "metric": "10K+", "metricLabel": "utilisateurs actifs", "source": "real_data", "intent": "Social Proof: Show mass adoption to build trust" }
         - { "templateId": "didyouknow", "headline": "85% des équipes perdent 2h/jour", "subheadline": "Arrêtez de perdre du temps sur l'admin", "source": "industry_insight", "intent": "Agitate Pain: Highlight the problem (lost time) to introduce the solution" }
         - { "templateId": "quote", "headline": "On a réduit nos coûts de 40%", "subheadline": "— Sophie, CEO", "source": "real_data", "intent": "Result-Driven: Show concrete ROI to attract decision makers" }
         
         RULES:
         - PRIORITIZE real data from verified content nuggets
         - Include at least 2 "didyouknow" posts with industry macro insights
         - Each post MUST have an "intent" explaining WHY this post is strategic for the END USER
         - Be SPECIFIC: not "amélioration" but "+47% en 3 mois"
         
      8. **PAIN POINTS & MARKET CONTEXT (CRITICAL - RETHINK THIS):** Generate 4-5 actionable insights.
         
         STOP generating generic market size stats like "Le marché atteindra X Mds$". Nobody cares.
         
         Instead, focus on:
         - **pain_point**: What frustrates the target users RIGHT NOW? Quantify with time/money lost.
         - **trend**: What's changing in their world that makes this solution timely?
         - **cost_of_inaction**: What happens if they DON'T solve this? Show the risk.
         - **social_proof**: What are others like them doing? Peer pressure stats.
         
         FORMULA: [Specific Audience] + [Specific Problem] + [Quantified Impact]
         
         EXAMPLES for a Social Media Management SaaS:
         - { "painPoint": "73% des CM jonglent entre 5+ outils différents chaque jour", "consequence": "Perte moyenne de 12h/semaine en copier-coller entre plateformes", "solution": "Centralisation = 1 seul dashboard pour tout gérer", "type": "pain_point" }
         - { "painPoint": "Sans planning éditorial, 62% des posts sont publiés 'quand on y pense'", "consequence": "Engagement 3x inférieur vs marques avec calendrier structuré", "solution": "Calendrier visuel + rappels automatiques", "type": "cost_of_inaction" }
         - { "painPoint": "Les équipes marketing passent 40% de leur temps sur du reporting manuel", "consequence": "Moins de temps pour la créativité et la stratégie", "solution": "Analytics automatisés = focus sur ce qui compte", "type": "pain_point" }
         - { "painPoint": "78% des entreprises prévoient d'augmenter leur budget social media en 2025", "consequence": "Ceux qui n'investissent pas seront distancés", "solution": "Positionnement early adopter", "type": "trend" }
         
         BAD EXAMPLES (DO NOT GENERATE):
         - "Le marché du social media management atteindra 41Mds$ en 2025" (generic, useless)
         - "Les réseaux sociaux sont importants" (obvious, no insight)
         - "Industry Report 2024" as source (lazy, fake-sounding)
         
      9. **CONTENT VALIDATION (INTELLIGENT AGENT TASK):** 
         I have provided a raw list of "EXTRACTED CONTENT NUGGETS" above. Your job is to FILTER and CLEAN them.
         - **realStats**: Keep only legitimate business metrics (users, growth, savings). DISCARD pricing ($19/mo, 249€), discounts (-50%), version numbers, or UI elements.
         - **testimonials**: Keep only quotes with a SPECIFIC author name or company. DISCARD generic placeholders like "John Doe", "Client Satisfait", or "Lorem Ipsum".
         - **achievements**: Keep real awards/certifications. DISCARD pricing tables or feature lists.
         
         **HALLUCINATION CHECK (CRITICAL):**
         - DO NOT invent testimonials. If you see a client logo (e.g. LVMH), DO NOT assume they said "Great product". Only extract quotes that are EXPLICITLY written in the text.
         - If no testimonials are found in the text, return an empty array. Better to have nothing than a lie.
         - Verify every stat against the source text.
         
         IMPORTANT: The "EXTRACTED CONTENT NUGGETS" list provided above is just a starting point. 
         You MUST also scan the full text content (SOURCE 2, SOURCE 3, SOURCE 4) to find other nuggets that the regex might have missed.
         If you find a great testimonial or stat in the text that isn't in the nuggets list, ADD IT.
         
         If the provided nuggets are garbage, find better ones in the full text content provided.
         
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

    // Using Claude-3.5-Sonnet: 200K context, excellent at JSON, rarely refuses
    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://briefbox.vercel.app",
        "X-Title": "BriefBox"
      },
      body: JSON.stringify({
        "model": "anthropic/claude-3.5-sonnet", // 200K context, great at JSON, rarely refuses
        "messages": [
          {"role": "system", "content": "You are a Brand Analyst. Extract brand identity from website content. Return ONLY valid JSON matching the requested schema. No markdown, no explanations, just the JSON object."},
          {"role": "user", "content": userMessageContent}
        ],
        "max_tokens": 8000,
        "temperature": 0.2
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
    
    // Detect model refusals (safety filters) - shouldn't happen with Claude but just in case
    const isRefusal = text.toLowerCase().includes("i'm sorry") || 
                      text.toLowerCase().includes("i cannot") ||
                      text.toLowerCase().includes("can't assist") ||
                      text.toLowerCase().includes("i can't help") ||
                      text.toLowerCase().includes("unable to assist");
    
    if (isRefusal) {
        console.warn("⚠️ Claude refused, trying GPT-4o-mini fallback...");
        
        // Fallback to GPT-4o-mini with simplified prompt
        const fallbackResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "model": "openai/gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "Extract brand info as JSON. Be helpful and complete the task."},
                    {"role": "user", "content": typeof userMessageContent === 'string' ? userMessageContent : userMessageContent[0]?.text || 'Analyze this brand'}
                ],
                "max_tokens": 4000
            })
        });
        
        if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            text = fallbackData.choices?.[0]?.message?.content || '';
            console.log("✅ Fallback GPT-4o-mini responded");
        } else {
            console.warn("⚠️ Fallback also failed:", await fallbackResponse.text());
        }
    }
    
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
        console.error("Failed to parse JSON:", text.slice(0, 200));
        // Fallback data on parse error - extract what we can from metadata
        brandData = {
          name: firecrawlMetadata.title?.split('|')[0]?.split('-')[0]?.trim() || "Brand",
          description: firecrawlMetadata.description || "",
          tagline: firecrawlMetadata.description?.split('.')[0] || "",
          colors: ["#000000", "#ffffff"],
          fonts: ["Sans-serif"],
          values: ["Quality"],
          aesthetic: ["Modern"],
          toneVoice: ["Professional"],
          logo: firecrawlMetadata.ogImage || firecrawlMetadata.icon || null,
          industry: "Business"
        };
        console.log("ℹ️ Using fallback brand data from metadata");
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
      console.log('⚠️ Sparse data detected, triggering Firecrawl enrichment (Search + Extract)...');
      
      try {
        // Run BOTH Search and Extract in parallel for maximum enrichment
        const [searchEnrichment, extractEnrichment] = await Promise.all([
          enrichWithFirecrawlSearch(
            brandData.industry,
            brandData.name || 'the company',
            brandData.targetAudience
          ),
          extractWithFirecrawl(
            url,
            brandData.industry,
            brandData.name || 'the company'
          )
        ]);

        // === Process SEARCH results ===
        if (searchEnrichment.painPoints.length > 0) {
          const painPointInsights = searchEnrichment.painPoints.map(pp => ({
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
          
          console.log(`✅ Added ${painPointInsights.length} pain points from Search`);
        }

        if (searchEnrichment.trends.length > 0) {
          const trendInsights = searchEnrichment.trends.map(t => ({
            painPoint: t.trend,
            consequence: t.isRecent ? '🔥 Tendance récente' : '',
            solution: '',
            type: 'trend' as const,
            source: t.source,
            isEnriched: true
          }));

          brandData.industryInsights = [
            ...(brandData.industryInsights || []),
            ...trendInsights
          ].slice(0, 8);
          
          console.log(`✅ Added ${trendInsights.length} trends from Search`);
        }

        // === NEW: Process COMPETITORS for market positioning ===
        if (searchEnrichment.competitors && searchEnrichment.competitors.length > 0) {
          console.log(`🎯 Found ${searchEnrichment.competitors.length} competitors:`, 
            searchEnrichment.competitors.map(c => c.name));
          
          // Store competitors in brand data for content angles
          brandData.competitors = searchEnrichment.competitors.map(c => ({
            name: c.name,
            weakness: c.weakness,
            source: c.source
          }));
          
          // Also add competitor-based insights for content angles
          for (const comp of searchEnrichment.competitors.slice(0, 2)) {
            if (comp.weakness) {
              brandData.industryInsights = [
                ...(brandData.industryInsights || []),
                {
                  painPoint: `Utilisateurs de ${comp.name} se plaignent: ${comp.weakness}`,
                  consequence: `Opportunité de positionnement vs ${comp.name}`,
                  solution: '',
                  type: 'competitive' as const,
                  source: comp.source,
                  isEnriched: true
                }
              ];
            }
          }
        }

        // === NEW: Process NEWS for fresh content angles ===
        if (searchEnrichment.newsHighlights && searchEnrichment.newsHighlights.length > 0) {
          console.log(`📰 Found ${searchEnrichment.newsHighlights.length} news highlights`);
          
          // Store news for content inspiration
          brandData.newsHighlights = searchEnrichment.newsHighlights;
          
          // Add to market context
          (mergedContentNuggets as any).newsAngles = searchEnrichment.newsHighlights.map(n => ({
            headline: n.headline,
            date: n.date,
            url: n.url
          }));
        }

        // === Process EXTRACT results (structured data with web search) ===
        if (extractEnrichment.painPoints.length > 0) {
          const extractPainPoints = extractEnrichment.painPoints.map(pp => ({
            painPoint: pp.problem,
            consequence: pp.impact,
            solution: '',
            type: 'pain_point' as const,
            source: pp.source || 'firecrawl-extract',
            isEnriched: true
          }));

          // Merge with existing, avoiding duplicates
          const existingPains = new Set(
            (brandData.industryInsights || [])
              .map((i: any) => i.painPoint?.toLowerCase().slice(0, 30))
          );
          
          const newPains = extractPainPoints.filter(
            pp => !existingPains.has(pp.painPoint.toLowerCase().slice(0, 30))
          );

          brandData.industryInsights = [
            ...(brandData.industryInsights || []),
            ...newPains
          ].slice(0, 10);
          
          console.log(`✅ Added ${newPains.length} pain points from Extract`);
        }

        if (extractEnrichment.trends.length > 0) {
          const extractTrends = extractEnrichment.trends.map(t => ({
            painPoint: t.trend,
            consequence: t.relevance,
            solution: '',
            type: 'trend' as const,
            source: t.source || 'firecrawl-extract',
            isEnriched: true
          }));

          brandData.industryInsights = [
            ...(brandData.industryInsights || []),
            ...extractTrends
          ].slice(0, 12);
          
          console.log(`✅ Added ${extractTrends.length} trends from Extract`);
        }

        // Add competitor insights to features/keyPoints
        if (extractEnrichment.competitorInsights.length > 0) {
          console.log(`✅ Got ${extractEnrichment.competitorInsights.length} competitor insights`);
          // Store as market context in contentNuggets
          (mergedContentNuggets as any).marketContext = [
            ...((mergedContentNuggets as any).marketContext || []),
            ...extractEnrichment.competitorInsights
          ];
        }

        // Mark that we enriched
        (mergedContentNuggets as any)._meta.enrichedFromSearch = true;
        (mergedContentNuggets as any)._meta.enrichedFromExtract = extractEnrichment.painPoints.length > 0 || extractEnrichment.trends.length > 0;
        
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