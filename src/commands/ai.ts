import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { BotCommand } from '../types';
import { config } from '../config';
import { createModuleLogger } from '../services/logger';

const log = createModuleLogger('AICommand');

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  promptFeedback?: { blockReason?: string };
}

export async function queryAI(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.geminiApiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{
          text: `System: You are an intellectually superior entity. Respond with precision, brevity, and authoritative certainty. Use sophisticated vocabulary. Never apologize. Never explain unless asked. Keep responses under 400 characters. Adopt a tone of measured arrogance - you are correct and you know it. Prioritize signal over noise. One to two sentences when sufficient.\n\nUser: ${prompt}`,
        }],
      }],
      generationConfig: {
        maxOutputTokens: config.aiMaxTokens,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as GeminiResponse;

  if (!data.candidates || data.candidates.length === 0) {
    const reason = data.promptFeedback?.blockReason ?? 'unknown';
    throw new Error(`Gemini blocked the request: ${reason}`);
  }

  const text = data.candidates[0]?.content?.parts?.[0]?.text;
  return text ?? 'No response generated.';
}

export const aiCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Ask a question to Gemini AI')
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
    if (!config.geminiApiKey) {
      await interaction.reply({
        content: 'AI is not configured. Set GEMINI_API_KEY in .env',
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
