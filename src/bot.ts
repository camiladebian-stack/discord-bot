import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { config } from './config';
import { loadCommands } from './commands';
import { registerEvents } from './events';
import { startHealthServer, resetStartTime } from './services/health';
import { createModuleLogger } from './services/logger';
import { BotCommand } from './types';
import { close } from './services/database';

const log = createModuleLogger('Bot');

async function main(): Promise<void> {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessageReactions,
    ],
  });

  client.commands = new Collection<string, BotCommand>();

  const commands = loadCommands();
  client.commands = commands;

  log.info(`Loaded ${commands.size} commands`);
  log.info(`Starting bot: ${config.name}`);
  log.info(`Environment: ${process.env.NODE_ENV ?? 'development'}`);

  registerEvents(client);
  startHealthServer();
  resetStartTime();

  process.on('SIGINT', () => handleShutdown(client, 'SIGINT'));
  process.on('SIGTERM', () => handleShutdown(client, 'SIGTERM'));
  process.on('uncaughtException', (err) => {
    log.error(`Uncaught exception: ${err.message}`, { stack: err.stack });
  });
  process.on('unhandledRejection', (reason) => {
    log.error(`Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
  });

  await client.login(config.token);
}

async function handleShutdown(client: Client, signal: string): Promise<void> {
  log.info(`Received ${signal}. Starting graceful shutdown...`);

  client.once('rateLimit', (info) => {
    log.warn('Rate limited during shutdown', { timeout: info.timeout });
  });

  try {
    close();
    log.info('Database connection closed');
  } catch (err) {
    log.error(`Database close error: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    client.user?.setPresence({
      activities: [{ name: 'Shutting down...' }],
      status: 'dnd',
    });
  } catch {
    // Non-critical
  }

  setTimeout(() => {
    client.destroy();
    log.info('Client destroyed. Goodbye.');
    process.exit(0);
  }, 2000);
}

main().catch((err) => {
  log.error(`Fatal startup error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
