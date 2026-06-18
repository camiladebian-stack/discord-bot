import { Guild } from 'discord.js';
import { upsertGuildConfig } from '../services/database';
import { createModuleLogger } from '../services/logger';

const log = createModuleLogger('GuildCreateEvent');

export const guildCreateEvent = async (guild: Guild): Promise<void> => {
  try {
    upsertGuildConfig(guild.id, {
      guild_id: guild.id,
    });
    log.info(`Joined guild: ${guild.name} (${guild.id})`);
  } catch (err) {
    log.error(`Failed to initialize guild config: ${err instanceof Error ? err.message : String(err)}`);
  }
};
