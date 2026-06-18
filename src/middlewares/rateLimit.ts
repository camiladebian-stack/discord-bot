import { Collection } from 'discord.js';
import { Middleware, MiddlewareContext, MiddlewareResult, RateLimitEntry } from '../types';

const rateLimitMap = new Collection<string, RateLimitEntry>();

export function createRateLimitMiddleware(maxRequests: number, windowMs: number): Middleware {
  return (ctx: MiddlewareContext): MiddlewareResult => {
    const now = Date.now();
    const entry = rateLimitMap.get(ctx.userId);

    if (!entry || now - entry.windowStart > windowMs) {
      rateLimitMap.set(ctx.userId, {
        userId: ctx.userId,
        count: 1,
        windowStart: now,
      });
      return { allowed: true };
    }

    if (entry.count >= maxRequests) {
      const resetIn = Math.ceil((windowMs - (now - entry.windowStart)) / 1000);
      return {
        allowed: false,
        reason: `Rate limited. Reset in ${resetIn} second${resetIn !== 1 ? 's' : ''}.`,
        retryAfter: resetIn,
      };
    }

    entry.count++;
    return { allowed: true };
  };
}
