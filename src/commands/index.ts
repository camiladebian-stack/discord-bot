import { Collection } from 'discord.js';
import { BotCommand } from '../types';
import { pingCommand } from './ping';
import { infoCommand } from './info';
import { avatarCommand } from './utility/avatar';
import { serverCommand } from './utility/server';
import { kickCommand } from './moderation/kick';
import { banCommand } from './moderation/ban';

export function loadCommands(): Collection<string, BotCommand> {
  const commands = new Collection<string, BotCommand>();

  const commandList: BotCommand[] = [
    pingCommand,
    infoCommand,
    avatarCommand,
    serverCommand,
    kickCommand,
    banCommand,
  ];

  for (const cmd of commandList) {
    commands.set(cmd.data.name, cmd);
  }

  return commands;
}
