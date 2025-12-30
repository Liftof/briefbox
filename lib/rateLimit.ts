/**
 * Rate limiter with Upstash Redis (production) + in-memory fallback (dev)
 *
 * Setup Upstash:
 * 1. Create account at upstash.com
 * 2. Create a Redis database
 * 3. Add to Vercel env vars:
 *    - UPSTASH_REDIS_REST_URL
 *    - UPSTASH_REDIS_REST_TOKEN
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ============================================
// CONFIGURATION
// ============================================

export interface RateLimitConfig {
  /** Maximum number of requests */
  max: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

// Preset configurations - GENEROUS for paid users
export const RATE_LIMITS = {
  generate: { max: 50, windowMs: 60 * 1000 },
  analyze: { max: 20, windowMs: 60 * 1000 },
  api: { max: 100, windowMs: 60 * 1000 },
  stripe: { max: 10, windowMs: 60 * 1000 },
} as const;

// Stricter limits for FREE users
export const FREE_USER_RATE_LIMITS = {
  generate: { max: 2, windowMs: 60 * 60 * 1000 }, // 2 per hour
  analyze: { max: 1, windowMs: 60 * 60 * 1000 },  // 1 per hour
} as const;

// IP-based limits for FREE users (prevents multi-account abuse)
export const FREE_USER_IP_LIMITS = {
  generate: { max: 5, windowMs: 60 * 60 * 1000 },
  analyze: { max: 2, windowMs: 60 * 60 * 1000 },
} as const;

// Global rate limits (safety limits)
export const GLOBAL_RATE_LIMITS = {
  generate: { max: 1000, windowMs: 60 * 1000 },
  analyze: { max: 200, windowMs: 60 * 1000 },
} as const;

// ============================================
// UPSTASH REDIS SETUP
// ============================================

const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

// Create Redis client only if credentials are available
const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Create rate limiters for each preset using sliding window algorithm
const createUpstashLimiter = (config: RateLimitConfig) => {
  if (!redis) return null;

  // Convert windowMs to seconds for Upstash
  const windowSeconds = Math.ceil(config.windowMs / 1000);

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.max, `${windowSeconds} s`),
    analytics: true, // Optional: track analytics in Upstash dashboard
    prefix: 'palette_ratelimit',
  });
};

// Pre-create limiters for each config
const upstashLimiters = {
  // Paid user limits
  generate: createUpstashLimiter(RATE_LIMITS.generate),
  analyze: createUpstashLimiter(RATE_LIMITS.analyze),
  api: createUpstashLimiter(RATE_LIMITS.api),
  stripe: createUpstashLimiter(RATE_LIMITS.stripe),

  // Free user limits
  freeGenerate: createUpstashLimiter(FREE_USER_RATE_LIMITS.generate),
  freeAnalyze: createUpstashLimiter(FREE_USER_RATE_LIMITS.analyze),

  // IP limits
  ipGenerate: createUpstashLimiter(FREE_USER_IP_LIMITS.generate),
  ipAnalyze: createUpstashLimiter(FREE_USER_IP_LIMITS.analyze),

  // Global limits
  globalGenerate: createUpstashLimiter(GLOBAL_RATE_LIMITS.generate),
  globalAnalyze: createUpstashLimiter(GLOBAL_RATE_LIMITS.analyze),
};

// ============================================
// IN-MEMORY FALLBACK (dev only)
// ============================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      if (entry.resetAt < now) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

function memoryRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(identifier);

  if (!entry || entry.resetAt < now) {
    memoryStore.set(identifier, { count: 1, resetAt: now + config.windowMs });
    return { success: true, remaining: config.max - 1, reset: now + config.windowMs };
  }

  if (entry.count >= config.max) {
    return { success: false, remaining: 0, reset: entry.resetAt };
  }

  entry.count++;
  memoryStore.set(identifier, entry);
  return { success: true, remaining: config.max - entry.count, reset: entry.resetAt };
}

// ============================================
// MAIN RATE LIMIT FUNCTION
// ============================================

/**
 * Check rate limit using Upstash Redis (prod) or in-memory (dev)
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig,
  limiterKey?: keyof typeof upstashLimiters
): Promise<RateLimitResult> {
  // Try Upstash first
  if (redis && limiterKey && upstashLimiters[limiterKey]) {
    try {
      const result = await upstashLimiters[limiterKey]!.limit(identifier);
      return {
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (error) {
      console.warn('⚠️ Upstash rate limit failed, falling back to memory:', error);
      // Fall through to memory fallback
    }
  }

  // Fallback to in-memory (dev or if Upstash fails)
  return memoryRateLimit(identifier, config);
}

/**
 * Synchronous rate limit (for backwards compatibility)
 * Uses in-memory only - prefer async version for production
 */
export function rateLimitSync(
  identifier: string,
  config: RateLimitConfig = { max: 10, windowMs: 60 * 1000 }
): RateLimitResult {
  if (!hasUpstash) {
    return memoryRateLimit(identifier, config);
  }
  // If Upstash is configured, log warning and use memory
  console.warn('⚠️ rateLimitSync called but Upstash is configured. Use async rateLimit() instead.');
  return memoryRateLimit(identifier, config);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Rate limit by user ID
 */
export async function rateLimitByUser(
  userId: string,
  preset: keyof typeof RATE_LIMITS,
  userPlan?: 'free' | 'pro' | 'premium'
): Promise<RateLimitResult> {
  if (userPlan === 'free' && (preset === 'generate' || preset === 'analyze')) {
    const limiterKey = preset === 'generate' ? 'freeGenerate' : 'freeAnalyze';
    return rateLimit(
      `${preset}:free:user:${userId}`,
      FREE_USER_RATE_LIMITS[preset],
      limiterKey
    );
  }

  return rateLimit(`${preset}:${userId}`, RATE_LIMITS[preset], preset);
}

/**
 * IP-based rate limit for FREE users
 */
export async function rateLimitByIP(
  ip: string,
  preset: 'generate' | 'analyze'
): Promise<RateLimitResult> {
  const limiterKey = preset === 'generate' ? 'ipGenerate' : 'ipAnalyze';
  return rateLimit(
    `${preset}:free:ip:${ip}`,
    FREE_USER_IP_LIMITS[preset],
    limiterKey
  );
}

/**
 * Global rate limit (across all users)
 */
export async function rateLimitGlobal(
  preset: keyof typeof GLOBAL_RATE_LIMITS
): Promise<RateLimitResult> {
  const limiterKey = preset === 'generate' ? 'globalGenerate' : 'globalAnalyze';
  return rateLimit(`global:${preset}`, GLOBAL_RATE_LIMITS[preset], limiterKey);
}

/**
 * Check if Upstash is configured
 */
export function isUpstashConfigured(): boolean {
  return hasUpstash;
}
