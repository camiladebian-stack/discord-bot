import dotenv from 'dotenv';
import { z } from 'zod';
import { BotConfig } from '../types';

dotenv.config();

const configSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
  CLIENT_ID: z.string().min(1, 'CLIENT_ID is required'),
  DEV_GUILD_ID: z.string().optional().default(''),
  BOT_NAME: z.string().default('MyBot'),
  BOT_ACTIVITY: z.string().default('/help | v1.0.0'),
  BOT_ACTIVITY_TYPE: z
    .enum(['PLAYING', 'WATCHING', 'LISTENING', 'COMPETING'])
    .default('PLAYING'),
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'debug'])
    .default('info'),
  LOG_FILE: z.string().default('logs/combined.log'),
  LOG_ERROR_FILE: z.string().default('logs/error.log'),
  DB_PATH: z.string().default('data/bot.db'),
  COOLDOWN_DEFAULT: z.coerce.number().positive().default(3),
  COOLDOWN_MODERATION: z.coerce.number().positive().default(5),
  RATE_LIMIT_MAX: z.coerce.number().positive().default(10),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(60000),
  ANTI_SPAM_THRESHOLD: z.coerce.number().positive().default(5),
  ANTI_SPAM_WINDOW_MS: z.coerce.number().positive().default(10000),
  GROQ_API_KEY: z.string().optional().default(''),
  AI_MAX_TOKENS: z.coerce.number().positive().default(1024),
  HEALTH_PORT: z.coerce.number().positive().default(8080),
  OWNER_ID: z.string().optional().default(''),
});

export function loadConfig(): BotConfig {
  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues
      .filter((i) => i.code === 'invalid_type')
      .map((i) => i.path.join('.'));
    if (missing.length > 0) {
      console.error(`Missing required environment variables: ${missing.join(', ')}`);
      process.exit(1);
    }
    console.error('Configuration error:', result.error.format());
    process.exit(1);
  }

  const env = result.data;

  return {
    token: env.DISCORD_TOKEN,
    clientId: env.CLIENT_ID,
    devGuildId: env.DEV_GUILD_ID || undefined,
    name: env.BOT_NAME,
    activity: env.BOT_ACTIVITY,
    activityType: env.BOT_ACTIVITY_TYPE,
    logLevel: env.LOG_LEVEL,
    logFile: env.LOG_FILE,
    logErrorFile: env.LOG_ERROR_FILE,
    dbPath: env.DB_PATH,
    cooldownDefault: env.COOLDOWN_DEFAULT,
    cooldownModeration: env.COOLDOWN_MODERATION,
    rateLimitMax: env.RATE_LIMIT_MAX,
    rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
    antiSpamThreshold: env.ANTI_SPAM_THRESHOLD,
    antiSpamWindowMs: env.ANTI_SPAM_WINDOW_MS,
    groqApiKey: env.GROQ_API_KEY || undefined,
    aiMaxTokens: env.AI_MAX_TOKENS,
    healthPort: env.HEALTH_PORT,
    ownerId: env.OWNER_ID || undefined,
  };
}

export const config = loadConfig();
