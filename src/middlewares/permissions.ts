import { Middleware, MiddlewareContext, MiddlewareResult } from '../types';

export function createPermissionMiddleware(ownerId?: string): Middleware {
  return (ctx: MiddlewareContext): MiddlewareResult => {
    if (ownerId && ctx.userId === ownerId) {
      return { allowed: true };
    }
    return { allowed: true };
  };
}
