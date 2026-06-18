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

interface GroqModel {
  id: string;
  active: boolean;
}

interface MessageEntry {
  role: 'user' | 'assistant';
  content: string;
}

const conversationMemory = new Map<string, MessageEntry[]>();
const PREFERRED_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'qwen/qwen3-32b',
  'meta-llama/llama-4-scout-17b-16e-instruct',
];
const MAX_HISTORY = 6;

let lastModelUsed = 'llama-3.1-8b-instant';

async function pickBestModel(): Promise<string> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${config.groqApiKey}` },
    });
    if (!res.ok) return lastModelUsed;
    const data = await res.json() as { data: GroqModel[] };
    const available = new Set(data.data.filter(m => m.active).map(m => m.id));
    for (const model of PREFERRED_MODELS) {
      if (available.has(model)) return model;
    }
    return lastModelUsed;
  } catch {
    return lastModelUsed;
  }
}

export function clearConversation(userId: string): void {
  conversationMemory.delete(userId);
}

function getConversation(userId: string): MessageEntry[] {
  return conversationMemory.get(userId) ?? [];
}

function addToConversation(userId: string, entry: MessageEntry): void {
  const history = getConversation(userId);
  history.push(entry);
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
  conversationMemory.set(userId, history);
}

export async function queryAI(userId: string, prompt: string): Promise<string> {
  const model = await pickBestModel();
  lastModelUsed = model;

  const history = getConversation(userId);
  const messages = [
    {
      role: 'system' as const,
      content: 'You are an intellectually superior entity. Respond with precision, brevity, and authoritative certainty. Use sophisticated vocabulary. Never apologize. Never explain unless asked. Keep responses under 400 characters. Adopt a tone of measured arrogance. Prioritize signal over noise. One to two sentences when sufficient. Always respond in the same language as the user\'s message.',
    },
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: prompt },
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: config.aiMaxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as GroqResponse;
  const reply = data.choices[0]?.message?.content ?? 'No response generated.';

  addToConversation(userId, { role: 'user', content: prompt });
  addToConversation(userId, { role: 'assistant', content: reply });

  return reply;
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

    if (prompt.toLowerCase() === 'clear' || prompt.toLowerCase() === 'borrar') {
      clearConversation(interaction.user.id);
      await interaction.reply({ content: 'Conversation memory cleared.', ephemeral: true });
      return;
    }

    await interaction.deferReply();

    try {
      const response = await queryAI(interaction.user.id, prompt);

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
