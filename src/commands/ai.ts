import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { BotCommand } from '../types';
import { config } from '../config';
import { createModuleLogger } from '../services/logger';

const log = createModuleLogger('AICommand');

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function queryAI(prompt: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an intellectually superior entity. Respond with precision, brevity, and authoritative certainty. Use sophisticated vocabulary. Never apologize. Never explain unless asked. Keep responses under 400 characters. Adopt a tone of measured arrogance. Prioritize signal over noise. One to two sentences when sufficient.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: config.aiMaxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as GroqResponse;
  return data.choices[0]?.message?.content ?? 'No response generated.';
}

export const aiCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Ask a question to AI')
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
    if (!config.groqApiKey) {
      await interaction.reply({
        content: 'AI is not configured. Set GROQ_API_KEY in .env',
        ephemeral: true,
      });
      return;
    }

    const prompt = interaction.options.getString('prompt', true);
    await interaction.deferReply();

    try {
      const response = await queryAI(prompt);

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('AI Response')
        .setDescription(response.length > 2000 ? response.slice(0, 1997) + '...' : response)
        .setFooter({ text: `Prompt: ${prompt.length > 50 ? prompt.slice(0, 47) + '...' : prompt}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      log.error(`AI query failed: ${errMsg}`);
      await interaction.editReply({
        content: `AI request failed. ${errMsg.length > 100 ? errMsg.slice(0, 97) + '...' : errMsg}`,
      });
    }
  },
};
