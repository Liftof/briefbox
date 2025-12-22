/**
 * Simple in-memory rate limiter
 * For production, use Upstash Redis: @upstash/ratelimit
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (resets on server restart)
// For production, use Redis
const store = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

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

/**
 * Check rate limit for a given identifier
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { max: 10, windowMs: 60 * 1000 }
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  
  const entry = store.get(key);
  
  if (!entry || entry.resetAt < now) {
    // Create new window
    store.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.max - 1,
      reset: now + config.windowMs,
    };
  }
  
  if (entry.count >= config.max) {
    return {
      success: false,
      remaining: 0,
      reset: entry.resetAt,
    };
  }
  
  // Increment count
  entry.count++;
  store.set(key, entry);
  
  return {
    success: true,
    remaining: config.max - entry.count,
    reset: entry.resetAt,
  };
}

// Preset configurations
export const RATE_LIMITS = {
  // Generation: 10 per minute per user (for paid users)
  generate: { max: 10, windowMs: 60 * 1000 },

  // Brand analysis: 5 per minute per user (expensive operation)
  analyze: { max: 5, windowMs: 60 * 1000 },

  // API calls: 60 per minute per user
  api: { max: 60, windowMs: 60 * 1000 },

  // Stripe operations: 10 per minute per user
  stripe: { max: 10, windowMs: 60 * 1000 },
} as const;

// Stricter limits for FREE users (to prevent abuse)
export const FREE_USER_RATE_LIMITS = {
  // Free users: 2 generations per hour (very restrictive)
  generate: { max: 2, windowMs: 60 * 60 * 1000 }, // 1 hour window

  // Free users: 1 brand analysis per hour (scraping is expensive)
  analyze: { max: 1, windowMs: 60 * 60 * 1000 },
} as const;

// Global rate limits (across all users)
// NOTE: These are safety limits to prevent total server overload
// In production with Upstash Redis, you can use more sophisticated strategies
export const GLOBAL_RATE_LIMITS = {
  // Total generations: 1000 per minute (allows ~100 concurrent users @ 10 each)
  // Adjust based on your Google AI quota and server capacity
  generate: { max: 1000, windowMs: 60 * 1000 },

  // Total brand analysis: 200 per minute (allows ~40 concurrent users @ 5 each)
  // This is more expensive (scraping + LLM), so more conservative
  analyze: { max: 200, windowMs: 60 * 1000 },
} as const;

/**
 * Rate limit by user ID with preset
 * @param userId - User ID
 * @param preset - Rate limit preset
 * @param userPlan - User's plan (free, pro, premium) - uses stricter limits for free users
 */
export function rateLimitByUser(
  userId: string,
  preset: keyof typeof RATE_LIMITS,
  userPlan?: 'free' | 'pro' | 'premium'
): RateLimitResult {
  // Use stricter limits for free users on expensive operations
  if (userPlan === 'free' && (preset === 'generate' || preset === 'analyze')) {
    return rateLimit(
      `${preset}:free:${userId}`,
      FREE_USER_RATE_LIMITS[preset as keyof typeof FREE_USER_RATE_LIMITS]
    );
  }

  return rateLimit(`${preset}:${userId}`, RATE_LIMITS[preset]);
}

/**
 * Global rate limit (across all users) for expensive operations
 */
export function rateLimitGlobal(
  preset: keyof typeof GLOBAL_RATE_LIMITS
): RateLimitResult {
  return rateLimit(`global:${preset}`, GLOBAL_RATE_LIMITS[preset]);
}
