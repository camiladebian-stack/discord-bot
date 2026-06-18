import {
  ChatInputCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Collection,
} from 'discord.js';

export interface BotCommand {
  data: { toJSON: () => RESTPostAPIChatInputApplicationCommandsJSONBody; name: string };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  cooldown?: number;
  category?: string;
  permissions?: PermissionRequirement[];
}

export interface PermissionRequirement {
  type: 'user' | 'role' | 'permission';
  id?: string;
  permission?: bigint;
}

export interface CooldownEntry {
  userId: string;
  commandName: string;
  expiresAt: number;
}

export interface RateLimitEntry {
  userId: string;
  count: number;
  windowStart: number;
}

export interface AntiSpamEntry {
  userId: string;
  messages: number[];
  flagged: boolean;
}

export interface BotConfig {
  token: string;
  clientId: string;
  devGuildId: string | undefined;
  name: string;
  activity: string;
  activityType: 'PLAYING' | 'WATCHING' | 'LISTENING' | 'COMPETING';
  logLevel: string;
  logFile: string;
  logErrorFile: string;
  dbPath: string;
  cooldownDefault: number;
  cooldownModeration: number;
  rateLimitMax: number;
  rateLimitWindowMs: number;
  antiSpamThreshold: number;
  antiSpamWindowMs: number;
  openrouterApiKey: string | undefined;
  aiProvider: string | undefined;
  aiMaxTokens: number;
  healthPort: number;
  ownerId: string | undefined;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  guildCount: number;
  userCount: number;
  commandCount: number;
  memoryUsage: number;
  cpuUsage: number;
  databaseStatus: string;
  timestamp: string;
}

export interface MiddlewareContext {
  commandName: string;
  userId: string;
  guildId: string | undefined;
  memberPermissions: bigint | undefined | null;
}

export interface MiddlewareResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
}

export type Middleware = (
  ctx: MiddlewareContext
) => MiddlewareResult | Promise<MiddlewareResult>;

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, BotCommand>;
    cooldowns: Collection<string, Collection<string, number>>;
  }
}
