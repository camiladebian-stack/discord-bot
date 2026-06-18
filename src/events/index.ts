import { Client } from 'discord.js';
import { createModuleLogger } from '../services/logger';
import { readyEvent } from './ready';
import { interactionCreateEvent } from './interactionCreate';
import { guildCreateEvent } from './guildCreate';

const log = createModuleLogger('EventLoader');

interface EventDefinition {
  name: string;
  once: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (...args: any[]) => void | Promise<void>;
}

export function registerEvents(client: Client): void {
  const events: EventDefinition[] = [
    { name: 'ready', once: true, execute: readyEvent },
    { name: 'interactionCreate', once: false, execute: interactionCreateEvent },
    { name: 'guildCreate', once: false, execute: guildCreateEvent },
  ];

  for (const event of events) {
    if (event.once) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client.once(event.name as any, (...args: any[]) => {
        try {
          event.execute(...args);
        } catch (err) {
          log.error(`Error in once event ${event.name}: ${err instanceof Error ? err.message : String(err)}`);
        }
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client.on(event.name as any, (...args: any[]) => {
        try {
          event.execute(...args);
        } catch (err) {
          log.error(`Error in event ${event.name}: ${err instanceof Error ? err.message : String(err)}`);
        }
      });
    }
  }

  log.info(`Registered ${events.length} event handlers`);
}
