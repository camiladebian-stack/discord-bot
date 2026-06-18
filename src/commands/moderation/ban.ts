import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { BotCommand } from '../../types';

export const banCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption((opt) =>
      opt.setName('target').setDescription('User to ban').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('reason').setDescription('Reason for ban').setRequired(false)
    )
    .addIntegerOption((opt) =>
      opt
        .setName('days')
        .setDescription('Delete messages from last N days')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(7)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),
  category: 'moderation',
  cooldown: 5,

  async execute(interaction) {
    const target = interaction.options.getUser('target', true);
    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    const days = interaction.options.getInteger('days') ?? 0;

    if (target.id === interaction.user.id) {
      await interaction.reply({ content: 'You cannot ban yourself.', ephemeral: true });
      return;
    }

    if (!interaction.guild) {
      await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
      return;
    }

    const member = interaction.guild.members.cache.get(target.id);
    if (member && !member.bannable) {
      await interaction.reply({ content: 'I cannot ban that member. Check my permissions and role hierarchy.', ephemeral: true });
      return;
    }

    const modMember = interaction.guild.members.cache.get(interaction.user.id);
    if (member && modMember && member.roles.highest.position >= modMember.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) {
      await interaction.reply({ content: 'You cannot ban someone with equal or higher role.', ephemeral: true });
      return;
    }

    await interaction.guild.members.ban(target, {
      reason,
      deleteMessageSeconds: days * 86400,
    });

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('User Banned')
      .addFields(
        { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
        { name: 'Moderator', value: interaction.user.tag, inline: true },
        { name: 'Reason', value: reason },
        { name: 'Messages Deleted', value: days > 0 ? `Last ${days} day(s)` : 'None', inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
