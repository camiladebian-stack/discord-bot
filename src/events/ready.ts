import { Client, ActivityType } from 'discord.js';
import { config } from '../config';
import { createModuleLogger } from '../services/logger';
import { setHealthClient } from '../services/health';
import { initializeDatabase, getPendingReminders, markReminderExecuted } from '../services/database';

const log = createModuleLogger('ReadyEvent');

function startReminderChecker(client: Client): void {
  setInterval(() => {
    try {
      const reminders = getPendingReminders();
      for (const reminder of reminders) {
        const user = client.users.cache.get(reminder.userId);
        if (user) {
          user.send(`Reminder: ${reminder.message}`).catch(() => {});
        }
        if (reminder.channelId) {
          const channel = client.channels.cache.get(reminder.channelId);
          if (channel?.isTextBased()) {
            (channel as any).send(`<@${reminder.userId}> Reminder: ${reminder.message}`).catch(() => {});
          }
        }
        markReminderExecuted(reminder.id);
      }
    } catch (err) {
      log.error(`Reminder check error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, 30000);
}

export const readyEvent = async (client: Client): Promise<void> => {
  if (!client.user) return;

  setHealthClient(client);
  await initializeDatabase();

  const activityTypeMap: Record<string, ActivityType> = {
    PLAYING: ActivityType.Playing,
    WATCHING: ActivityType.Watching,
    LISTENING: ActivityType.Listening,
    COMPETING: ActivityType.Competing,
  };

  client.user.setPresence({
    activities: [{
      name: config.activity,
      type: activityTypeMap[config.activityType] ?? ActivityType.Playing,
    }],
    status: 'online',
  });

  log.info(`Logged in as ${client.user.tag}`);
  log.info(`Serving ${client.guilds.cache.size} guilds`);
  log.info(`Health server on port ${config.healthPort}`);

  startReminderChecker(client);
};
