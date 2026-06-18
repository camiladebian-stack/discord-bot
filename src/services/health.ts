import http from 'http';
import { Client } from 'discord.js';
import { config } from '../config';
import { createModuleLogger } from './logger';
import { HealthStatus } from '../types';

const log = createModuleLogger('Health');

let clientRef: Client | null = null;
let startTime = Date.now();
let lastCommandCount = 0;

export function setHealthClient(client: Client): void {
  clientRef = client;
}

export function recordCommand(): void {
  lastCommandCount++;
}

function getMemoryUsage(): number {
  const usage = process.memoryUsage();
  return Math.round(usage.heapUsed / 1024 / 1024);
}

function getCpuUsage(): number {
  const cpus = require('os').cpus();
  let totalIdle = 0;
  let totalTick = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += (cpu.times as Record<string, number>)[type];
    }
    totalIdle += cpu.times.idle;
  }
  return Math.round((1 - totalIdle / totalTick) * 100);
}

function getHealthStatus(): HealthStatus {
  const client = clientRef;
  const guildCount = client?.guilds.cache.size ?? 0;
  let userCount = 0;
  if (client) {
    for (const guild of client.guilds.cache.values()) {
      userCount += guild.memberCount;
    }
  }

  const commandCount = client?.commands.size ?? 0;
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const dbOk = true;

  const status: 'healthy' | 'degraded' | 'unhealthy' =
    !client?.isReady()
      ? 'unhealthy'
      : uptimeSeconds < 60
        ? 'degraded'
        : 'healthy';

  return {
    status,
    uptime: uptimeSeconds,
    guildCount,
    userCount,
    commandCount,
    memoryUsage: getMemoryUsage(),
    cpuUsage: getCpuUsage(),
    databaseStatus: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  };
}

export function startHealthServer(): void {
  const server = http.createServer((req, res) => {
    if (req.method !== 'GET') {
      res.writeHead(405);
      res.end();
      return;
    }

    if (req.url === '/health') {
      const status = getHealthStatus();
      const statusCode = status.status === 'healthy' ? 200 : status.status === 'degraded' ? 200 : 503;
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status));
      return;
    }

    if (req.url === '/metrics') {
      const status = getHealthStatus();
      const metrics = [
        `# HELP bot_uptime_seconds Bot uptime in seconds`,
        `# TYPE bot_uptime_seconds gauge`,
        `bot_uptime_seconds ${status.uptime}`,
        `# HELP bot_guild_count Number of guilds`,
        `# TYPE bot_guild_count gauge`,
        `bot_guild_count ${status.guildCount}`,
        `# HELP bot_user_count Total users across guilds`,
        `# TYPE bot_user_count gauge`,
        `bot_user_count ${status.userCount}`,
        `# HELP bot_memory_megabytes Memory usage in MB`,
        `# TYPE bot_memory_megabytes gauge`,
        `bot_memory_megabytes ${status.memoryUsage}`,
        `# HELP bot_commands_registered Number of registered commands`,
        `# TYPE bot_commands_registered gauge`,
        `bot_commands_registered ${status.commandCount}`,
      ].join('\n');
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(metrics);
      return;
    }

    res.writeHead(404);
    res.end();
  });

  server.listen(config.healthPort, () => {
    log.info(`Health server listening on port ${config.healthPort}`);
  });

  server.on('error', (err) => {
    log.error(`Health server failed: ${err.message}`);
  });
}

export function resetStartTime(): void {
  startTime = Date.now();
}
