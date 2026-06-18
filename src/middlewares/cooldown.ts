import { Collection } from 'discord.js';
import { Middleware, MiddlewareContext, MiddlewareResult } from '../types';

const cooldowns = new Collection<string, Collection<string, number>>();

export function createCooldownMiddleware(defaultCooldown: number): Middleware {
  return (ctx: MiddlewareContext): MiddlewareResult => {
    if (!cooldowns.has(ctx.commandName)) {
      cooldowns.set(ctx.commandName, new Collection());
    }

    const timestamps = cooldowns.get(ctx.commandName)!;
    const now = Date.now();
    const cooldownAmount = (timestamps.get(ctx.userId) ?? 0);

    if (cooldownAmount && now < cooldownAmount) {
      const remaining = Math.ceil((cooldownAmount - now) / 1000);
      return {
        allowed: false,
        reason: `Command on cooldown. Try again in ${remaining} second${remaining !== 1 ? 's' : ''}.`,
        retryAfter: remaining,
      };
    }

    timestamps.set(ctx.userId, now + defaultCooldown * 1000);
    return { allowed: true };
  };
}
