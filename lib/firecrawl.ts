/**
 * Firecrawl API Helper
 * Centralized scraping utilities with retry logic and consistent error handling
 */

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v2';

// Default options for all Firecrawl requests
const DEFAULT_SCRAPE_OPTIONS = {
  maxAge: 86400, // 1 day cache
  blockAds: true,
  skipTlsVerification: true,
};

interface FirecrawlScrapeOptions {
  formats?: ('markdown' | 'html' | 'screenshot')[];
  onlyMainContent?: boolean;
  removeBase64Images?: boolean;
  timeout?: number;
  retries?: number;
}

interface FirecrawlScrapeResult {
  success: boolean;
  markdown: string;
  html?: string;
  screenshot?: string;
  metadata: {
    title?: string;
    description?: string;
    ogImage?: string;
    icon?: string;
    logo?: string;
    image?: string;
    [key: string]: any;
  };
  error?: string;
}

interface FirecrawlMapOptions {
  search?: string;
  limit?: number;
  includeSubdomains?: boolean;
  timeout?: number;
}

interface FirecrawlExtractOptions {
  prompt: string;
  schema: Record<string, any>;
  enableWebSearch?: boolean;
  timeout?: number;
  pollTimeout?: number; // Max time to wait for async job
}

interface FirecrawlSearchOptions {
  query: string;
  limit?: number;
  scrapeOptions?: {
    formats?: string[];
  };
  timeout?: number;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable (network errors, 5xx, timeouts)
 */
function isRetryableError(error: any, status?: number): boolean {
  // Network errors
  if (error?.name === 'AbortError') return true;
  if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') return true;
  
  // Server errors (5xx)
  if (status && status >= 500 && status < 600) return true;
  
  // Rate limiting (429) - worth retrying after delay
  if (status === 429) return true;
  
  return false;
}

/**
 * Core scrape function with retry logic
 */
export async function firecrawlScrape(
  url: string,
  options: FirecrawlScrapeOptions = {}
): Promise<FirecrawlScrapeResult> {
  const {
    formats = ['markdown'],
    onlyMainContent = false,
    removeBase64Images = true,
    timeout = 30000,
    retries = 1,
  } = options;

  if (!FIRECRAWL_API_KEY) {
    console.warn('⚠️ FIRECRAWL_API_KEY not set');
    return {
      success: false,
      markdown: '',
      metadata: {},
      error: 'FIRECRAWL_API_KEY not configured',
    };
  }

  let lastError: any = null;
  let lastStatus: number | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      const delay = attempt * 2000; // 2s, 4s, etc.
      console.log(`🔄 Retry ${attempt}/${retries} for ${url} (waiting ${delay}ms)...`);
      await sleep(delay);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        },
        body: JSON.stringify({
          url,
          formats,
          onlyMainContent,
          removeBase64Images,
          ...DEFAULT_SCRAPE_OPTIONS,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      lastStatus = response.status;

      if (!response.ok) {
        const errorText = await response.text();
        lastError = new Error(`HTTP ${response.status}: ${errorText.slice(0, 200)}`);
        
        if (isRetryableError(null, response.status)) {
          console.warn(`⚠️ Firecrawl scrape failed (${response.status}), will retry...`);
          continue;
        }
        
        // Non-retryable error (4xx except 429)
        return {
          success: false,
          markdown: '',
          metadata: {},
          error: `HTTP ${response.status}`,
        };
      }

      const data = await response.json();

      if (!data.success) {
        console.warn('⚠️ Firecrawl returned success:false');
        return {
          success: false,
          markdown: '',
          metadata: {},
          error: 'Firecrawl returned success:false',
        };
      }

      console.log(`✅ Firecrawl scrape success: ${url.slice(0, 50)}... (${data.data?.markdown?.length || 0} chars)`);

      return {
        success: true,
        markdown: data.data?.markdown || '',
        html: data.data?.html,
        screenshot: data.data?.screenshot,
        metadata: {
          ...(data.data?.metadata || {}),
          screenshot: data.data?.screenshot,
        },
      };

    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;

      if (isRetryableError(error)) {
        console.warn(`⚠️ Firecrawl scrape error (${error.name || error.message}), will retry...`);
        continue;
      }

      // Non-retryable error
      console.error('❌ Firecrawl scrape failed:', error.message || error);
      return {
        success: false,
        markdown: '',
        metadata: {},
        error: error.message || 'Unknown error',
      };
    }
  }

  // All retries exhausted
  console.error(`❌ Firecrawl scrape failed after ${retries + 1} attempts:`, lastError?.message || lastError);
  return {
    success: false,
    markdown: '',
    metadata: {},
    error: lastError?.message || 'Max retries exceeded',
  };
}

/**
 * Map website structure to find internal pages
 */
export async function firecrawlMap(
  url: string,
  options: FirecrawlMapOptions = {}
): Promise<string[]> {
  const {
    search = 'about story mission team blog press careers values history',
    limit = 50,
    includeSubdomains = false,
    timeout = 45000,
  } = options;

  if (!FIRECRAWL_API_KEY) {
    console.warn('⚠️ FIRECRAWL_API_KEY not set, skipping map');
    return [];
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    console.log(`🗺️ Mapping website: ${url}`);

    const response = await fetch(`${FIRECRAWL_BASE_URL}/map`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        search,
        sitemap: 'include',
        includeSubdomains,
        limit,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('⚠️ Firecrawl map failed:', response.status);
      return [];
    }

    const data = await response.json();

    if (data.success && Array.isArray(data.links)) {
      console.log(`✅ Map found ${data.links.length} pages`);
      return data.links;
    }

    return [];
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.warn('⚠️ Firecrawl map error:', error.message || error);
    return [];
  }
}

/**
 * Extract structured data with optional web search enrichment
 * Includes polling for async jobs (up to pollTimeout)
 */
export async function firecrawlExtract<T = Record<string, any>>(
  urls: string[],
  options: FirecrawlExtractOptions
): Promise<{ success: boolean; data: T | null; error?: string }> {
  const {
    prompt,
    schema,
    enableWebSearch = true,
    timeout = 30000,
    pollTimeout = 15000, // Max 15s to wait for async job
  } = options;

  if (!FIRECRAWL_API_KEY) {
    console.warn('⚠️ FIRECRAWL_API_KEY not set, skipping extract');
    return { success: false, data: null, error: 'API key not configured' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    console.log(`🔥 Firecrawl Extract for ${urls.length} URL(s)...`);

    const response = await fetch(`${FIRECRAWL_BASE_URL}/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        urls,
        prompt,
        schema,
        enableWebSearch,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('⚠️ Firecrawl Extract API error:', errorText.slice(0, 200));
      return { success: false, data: null, error: `HTTP ${response.status}` };
    }

    const data = await response.json();

    // Handle async job - poll for completion
    if (data.jobId || data.id) {
      const jobId = data.jobId || data.id;
      console.log(`🔄 Firecrawl Extract job started: ${jobId}, polling for up to ${pollTimeout}ms...`);
      
      const pollResult = await pollExtractJob<T>(jobId, pollTimeout);
      return pollResult;
    }

    // Immediate result
    if (data.success && data.data) {
      console.log(`✅ Firecrawl Extract success (immediate)`);
      return { success: true, data: data.data as T };
    }

    return { success: false, data: null, error: 'No data returned' };
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('❌ Firecrawl Extract error:', error.message || error);
    return { success: false, data: null, error: error.message || 'Unknown error' };
  }
}

/**
 * Poll for async Extract job completion
 */
async function pollExtractJob<T>(
  jobId: string,
  maxWaitMs: number
): Promise<{ success: boolean; data: T | null; error?: string }> {
  const startTime = Date.now();
  const pollInterval = 2000; // Check every 2s

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const response = await fetch(`${FIRECRAWL_BASE_URL}/extract/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        },
      });

      if (!response.ok) {
        console.warn(`⚠️ Poll failed: ${response.status}`);
        await sleep(pollInterval);
        continue;
      }

      const data = await response.json();

      if (data.status === 'completed' && data.data) {
        console.log(`✅ Firecrawl Extract job completed after ${Date.now() - startTime}ms`);
        return { success: true, data: data.data as T };
      }

      if (data.status === 'failed') {
        console.warn('❌ Firecrawl Extract job failed');
        return { success: false, data: null, error: 'Job failed' };
      }

      // Still processing
      console.log(`⏳ Extract job ${jobId} still processing...`);
      await sleep(pollInterval);

    } catch (error: any) {
      console.warn('⚠️ Poll error:', error.message);
      await sleep(pollInterval);
    }
  }

  console.log(`⏰ Extract job ${jobId} timed out after ${maxWaitMs}ms (continuing without results)`);
  return { success: false, data: null, error: 'Polling timeout' };
}

/**
 * Search the web via Firecrawl
 */
export async function firecrawlSearch(
  options: FirecrawlSearchOptions
): Promise<{ success: boolean; results: any[]; error?: string }> {
  const {
    query,
    limit = 5,
    scrapeOptions = { formats: ['markdown'] },
    timeout = 30000,
  } = options;

  if (!FIRECRAWL_API_KEY) {
    console.warn('⚠️ FIRECRAWL_API_KEY not set, skipping search');
    return { success: false, results: [], error: 'API key not configured' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    console.log(`🔍 Firecrawl Search: "${query.slice(0, 50)}..."`);

    const response = await fetch(`${FIRECRAWL_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        limit,
        scrapeOptions,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('⚠️ Firecrawl Search failed:', errorText.slice(0, 200));
      return { success: false, results: [], error: `HTTP ${response.status}` };
    }

    const data = await response.json();

    if (data.success && Array.isArray(data.data)) {
      console.log(`✅ Firecrawl Search returned ${data.data.length} results`);
      return { success: true, results: data.data };
    }

    return { success: false, results: [], error: 'No results' };
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.warn('⚠️ Firecrawl Search error:', error.message || error);
    return { success: false, results: [], error: error.message || 'Unknown error' };
  }
}

/**
 * Batch scrape multiple URLs in parallel with controlled concurrency
 */
export async function firecrawlBatchScrape(
  urls: string[],
  options: FirecrawlScrapeOptions & { concurrency?: number } = {}
): Promise<Map<string, FirecrawlScrapeResult>> {
  const { concurrency = 5, ...scrapeOptions } = options;
  const results = new Map<string, FirecrawlScrapeResult>();

  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(url => firecrawlScrape(url, scrapeOptions))
    );

    batch.forEach((url, idx) => {
      results.set(url, batchResults[idx]);
    });
  }

  const successCount = Array.from(results.values()).filter(r => r.success).length;
  console.log(`📦 Batch scrape completed: ${successCount}/${urls.length} successful`);

  return results;
}
