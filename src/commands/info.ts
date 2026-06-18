import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { BotCommand } from '../types';

export const infoCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Display bot information and statistics')
    .addSubcommand((sub) =>
      sub.setName('bot').setDescription('Bot statistics')
    )
    .addSubcommand((sub) =>
      sub
        .setName('user')
        .setDescription('User information')
        .addUserOption((opt) =>
          opt.setName('target').setDescription('Target user').setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('guild')
        .setDescription('Guild information')
    ),
  category: 'utility',

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'bot':
        await handleBotInfo(interaction);
        break;
      case 'user':
        await handleUserInfo(interaction);
        break;
      case 'guild':
        await handleGuildInfo(interaction);
        break;
    }
  },
};

async function handleBotInfo(interaction: Parameters<typeof infoCommand.execute>[0]) {
  const client = interaction.client;
  const guildCount = client.guilds.cache.size;
  let userCount = 0;
  for (const guild of client.guilds.cache.values()) {
    userCount += guild.memberCount;
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(client.user?.username ?? 'Bot')
    .setThumbnail(client.user?.displayAvatarURL() ?? null)
    .addFields(
      { name: 'Servers', value: guildCount.toString(), inline: true },
      { name: 'Users', value: userCount.toLocaleString(), inline: true },
      { name: 'Commands', value: client.commands.size.toString(), inline: true },
      { name: 'Uptime', value: formatDuration(client.uptime ?? 0), inline: true },
      { name: 'Ping', value: `${client.ws.ping}ms`, inline: true },
      { name: 'Library', value: 'discord.js v14', inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleUserInfo(interaction: Parameters<typeof infoCommand.execute>[0]) {
  const target = interaction.options.getUser('target') ?? interaction.user;
  const member = interaction.guild?.members.cache.get(target.id);

  const embed = new EmbedBuilder()
    .setColor(target.accentColor ?? 0x5865F2)
    .setTitle(target.displayName)
    .setThumbnail(target.displayAvatarURL({ size: 4096 }))
    .addFields(
      { name: 'Username', value: target.tag, inline: true },
      { name: 'ID', value: target.id, inline: true },
      { name: 'Created', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true }
    );

  if (member) {
    embed.addFields(
      { name: 'Joined', value: `<t:${Math.floor((member.joinedAt?.getTime() ?? 0) / 1000)}:R>`, inline: true },
      { name: 'Roles', value: member.roles.cache.filter((r) => r.id !== interaction.guild?.id).size.toString(), inline: true }
    );
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleGuildInfo(interaction: Parameters<typeof infoCommand.execute>[0]) {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(guild.name)
    .setThumbnail(guild.iconURL({ size: 4096 }))
    .addFields(
      { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
      { name: 'Members', value: guild.memberCount.toString(), inline: true },
      { name: 'Channels', value: guild.channels.cache.size.toString(), inline: true },
      { name: 'Roles', value: guild.roles.cache.size.toString(), inline: true },
      { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
      { name: 'Boost Level', value: guild.premiumTier.toString(), inline: true }
    );

  await interaction.reply({ embeds: [embed] });
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h ${m % 60}m ${s % 60}s`;
}
