import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, Guild, ChannelType } from 'discord.js';
import { BotCommand } from '../../types';

export const serverCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('Display detailed server information')
    .addSubcommand((sub) =>
      sub.setName('info').setDescription('Server overview')
    )
    .addSubcommand((sub) =>
      sub.setName('roles').setDescription('List server roles')
    )
    .addSubcommand((sub) =>
      sub.setName('channels').setDescription('List server channels')
    ),
  category: 'utility',

  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'info':
        await handleInfo(interaction, guild);
        break;
      case 'roles':
        await handleRoles(interaction, guild);
        break;
      case 'channels':
        await handleChannels(interaction, guild);
        break;
    }
  },
};

async function handleInfo(
  interaction: ChatInputCommandInteraction,
  guild: Guild
) {
  const channels = guild.channels.cache;
  const textChannels = channels.filter((c) => c.isTextBased()).size;
  const voiceChannels = channels.filter((c) => c.isVoiceBased()).size;
  const categories = channels.filter((c) => c.type === ChannelType.GuildCategory).size;

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(guild.name)
    .setThumbnail(guild.iconURL({ size: 4096 }))
    .addFields(
      { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
      { name: 'Members', value: guild.memberCount.toString(), inline: true },
      { name: 'Boosts', value: `${guild.premiumSubscriptionCount ?? 0} (Level ${guild.premiumTier})`, inline: true },
      { name: 'Text Channels', value: textChannels.toString(), inline: true },
      { name: 'Voice Channels', value: voiceChannels.toString(), inline: true },
      { name: 'Categories', value: categories.toString(), inline: true },
      { name: 'Roles', value: guild.roles.cache.size.toString(), inline: true },
      { name: 'Emojis', value: guild.emojis.cache.size.toString(), inline: true },
      { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
    );

  await interaction.reply({ embeds: [embed] });
}

async function handleRoles(
  interaction: ChatInputCommandInteraction,
  guild: Guild
) {
  const roles = guild.roles.cache
    .filter((r) => r.id !== guild.id)
    .sort((a, b) => b.position - a.position)
    .map((r) => r.toString())
    .join(', ') || 'None';

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`${guild.name} - Roles`)
    .setDescription(roles.length > 1024 ? roles.slice(0, 1021) + '...' : roles)
    .setFooter({ text: `${guild.roles.cache.size - 1} roles` });

  await interaction.reply({ embeds: [embed] });
}

async function handleChannels(
  interaction: ChatInputCommandInteraction,
  guild: Guild
) {
  const categories = guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory);
  const lines: string[] = [];

  for (const [, category] of categories) {
    lines.push(`**${category.name}**`);
    const children = guild.channels.cache.filter(
      (c) => c.parentId === category.id
    );
    for (const [, child] of children) {
      const prefix = child.isTextBased()
        ? '#'
        : child.isVoiceBased()
          ? '🔊'
          : '•';
      lines.push(`  ${prefix} ${child.name}`);
    }
  }

  const channelsWithoutCategory = guild.channels.cache.filter(
    (c) => !c.parentId && c.type !== ChannelType.GuildCategory
  );
  if (channelsWithoutCategory.size > 0) {
    lines.push('**Uncategorized**');
    for (const [, ch] of channelsWithoutCategory) {
      const prefix = ch.isTextBased() ? '#' : ch.isVoiceBased() ? '🔊' : '•';
      lines.push(`  ${prefix} ${ch.name}`);
    }
  }

  const desc = lines.join('\n') || 'No channels found';

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`${guild.name} - Channels`)
    .setDescription(desc.length > 4096 ? desc.slice(0, 4093) + '...' : desc);

  await interaction.reply({ embeds: [embed] });
}
