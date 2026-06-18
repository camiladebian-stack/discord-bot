import { Middleware, MiddlewareContext, MiddlewareResult } from '../types';

export class MiddlewarePipeline {
  private middlewares: Middleware[] = [];

  public use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  public async run(ctx: MiddlewareContext): Promise<MiddlewareResult> {
    for (const middleware of this.middlewares) {
      const result = await middleware(ctx);
      if (!result.allowed) {
        return result;
      }
    }
    return { allowed: true };
  }

  public clear(): void {
    this.middlewares = [];
  }
}
