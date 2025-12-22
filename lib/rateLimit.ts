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
  // Generation: 10 per minute per user
  generate: { max: 10, windowMs: 60 * 1000 },

  // Brand analysis: 5 per minute per user (expensive operation)
  analyze: { max: 5, windowMs: 60 * 1000 },

  // API calls: 60 per minute per user
  api: { max: 60, windowMs: 60 * 1000 },

  // Stripe operations: 10 per minute per user
  stripe: { max: 10, windowMs: 60 * 1000 },
} as const;

// Global rate limits (across all users)
export const GLOBAL_RATE_LIMITS = {
  // Total generations: 200 per minute (20 concurrent users @ 10 each)
  generate: { max: 200, windowMs: 60 * 1000 },

  // Total brand analysis: 50 per minute (10 concurrent users @ 5 each)
  analyze: { max: 50, windowMs: 60 * 1000 },
} as const;

/**
 * Rate limit by user ID with preset
 */
export function rateLimitByUser(
  userId: string,
  preset: keyof typeof RATE_LIMITS
): RateLimitResult {
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
