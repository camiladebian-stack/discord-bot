import { Collection } from 'discord.js';
import { Middleware, MiddlewareContext, MiddlewareResult, AntiSpamEntry } from '../types';

const spamTracker = new Collection<string, AntiSpamEntry>();

export function createAntiSpamMiddleware(threshold: number, windowMs: number): Middleware {
  return (ctx: MiddlewareContext): MiddlewareResult => {
    const now = Date.now();
    const entry = spamTracker.get(ctx.userId) ?? { userId: ctx.userId, messages: [], flagged: false };

    entry.messages.push(now);
    const recentMessages = entry.messages.filter((t) => now - t < windowMs);
    entry.messages = recentMessages;

    if (recentMessages.length >= threshold) {
      entry.flagged = true;
      spamTracker.set(ctx.userId, entry);
      return {
        allowed: false,
        reason: 'You are sending commands too fast. Please slow down.',
        retryAfter: Math.ceil(windowMs / 1000),
      };
    }

    if (entry.flagged && recentMessages.length === 0) {
      entry.flagged = false;
    }

    spamTracker.set(ctx.userId, entry);
    return { allowed: true };
  };
}
