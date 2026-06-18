import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { BotCommand } from '../types';
import { config } from '../config';
import { createModuleLogger } from '../services/logger';

const log = createModuleLogger('AICommand');

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
  };
}

export async function queryOpenRouter(prompt: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.openrouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/camiladebian-stack/discord-bot',
    },
    body: JSON.stringify({
      model: 'mistralai/mistral-7b-instruct:free',
      messages: [
        {
          role: 'system',
          content: 'You are an intellectually superior entity. Respond with precision, brevity, and authoritative certainty. Use sophisticated vocabulary. Never apologize. Never explain unless explicitly asked. Keep responses under 400 characters. Adopt a tone of measured arrogance - you are correct and you know it. Prioritize signal over noise. One to two sentences when sufficient.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: config.aiMaxTokens,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as OpenRouterResponse;

  if (data.error) {
    throw new Error(`OpenRouter: ${data.error.message}`);
  }

  return data.choices[0]?.message?.content ?? 'No response generated.';
}

export const aiCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Ask an AI a question')
    .addStringOption((opt) =>
      opt
        .setName('prompt')
        .setDescription('Your question or prompt')
        .setRequired(true)
        .setMaxLength(1000)
    ),
  category: 'utility',
  cooldown: 10,

  async execute(interaction) {
    if (!config.openrouterApiKey) {
      await interaction.reply({
        content: 'AI is not configured. The bot owner needs to set OPENROUTER_API_KEY.',
        ephemeral: true,
      });
      return;
    }

    const prompt = interaction.options.getString('prompt', true);

    await interaction.deferReply();

    try {
      const response = await queryOpenRouter(prompt);

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('AI Response')
        .setDescription(response.length > 2000 ? response.slice(0, 1997) + '...' : response)
        .setFooter({ text: `Prompt: ${prompt.length > 50 ? prompt.slice(0, 47) + '...' : prompt}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      log.error(`AI query failed: ${err instanceof Error ? err.message : String(err)}`);
      await interaction.editReply({
        content: 'AI request failed. The model may be rate-limited. Try again in a few seconds.',
      });
    }
  },
};
