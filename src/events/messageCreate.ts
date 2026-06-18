import { Message, EmbedBuilder } from 'discord.js';
import { queryOpenRouter } from '../commands/ai';
import { config } from '../config';
import { createModuleLogger } from '../services/logger';

const log = createModuleLogger('MessageEvent');

const PREFIX = '!';

export const messageCreateEvent = async (message: Message): Promise<void> => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = args[0]?.toLowerCase();

  if (command === 'ai') {
    if (!config.openrouterApiKey) {
      await message.reply('AI is not configured. The bot owner needs to set OPENROUTER_API_KEY.');
      return;
    }

    const prompt = args.slice(1).join(' ');
    if (!prompt) {
      await message.reply('Provide a prompt. Usage: `!ai <question>`');
      return;
    }

    if (prompt.length > 1000) {
      await message.reply('Prompt too long. Maximum 1000 characters.');
      return;
    }

    const statusMsg = await message.reply('Thinking...');

    try {
      const response = await queryOpenRouter(prompt);

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('AI Response')
        .setDescription(response.length > 2000 ? response.slice(0, 1997) + '...' : response)
        .setFooter({ text: `Prompt: ${prompt.length > 50 ? prompt.slice(0, 47) + '...' : prompt}` })
        .setTimestamp();

      await statusMsg.edit({ content: null, embeds: [embed] });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      log.error(`!ai error: ${errMsg}`);
      await statusMsg.edit({
        content: `AI request failed. ${errMsg.length > 100 ? errMsg.slice(0, 97) + '...' : errMsg}`,
      });
    }
  }
};
