import { REST, Routes } from 'discord.js';
import { config } from '../config';
import { loadCommands } from '../commands';
import { createModuleLogger } from '../services/logger';

const log = createModuleLogger('Register');

async function registerCommands(): Promise<void> {
  const commands = loadCommands();
  const commandData = commands.map((cmd) => cmd.data.toJSON());

  const rest = new REST({ version: '10' }).setToken(config.token);

  try {
    if (config.devGuildId) {
      log.info(`Registering ${commandData.length} commands in dev guild ${config.devGuildId}`);
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.devGuildId),
        { body: commandData }
      );
      log.info('Dev guild commands registered successfully');
    } else {
      log.info(`Registering ${commandData.length} global commands`);
      await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commandData }
      );
      log.info('Global commands registered successfully');
    }
  } catch (err) {
    log.error(`Failed to register commands: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

registerCommands();
