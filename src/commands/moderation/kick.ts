import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { BotCommand } from '../../types';

export const kickCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption((opt) =>
      opt.setName('target').setDescription('Member to kick').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('reason').setDescription('Reason for kick').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false),
  category: 'moderation',
  cooldown: 5,

  async execute(interaction) {
    const target = interaction.options.getUser('target', true);
    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    const member = interaction.guild?.members.cache.get(target.id);

    if (!member) {
      await interaction.reply({ content: 'That user is not in this server.', ephemeral: true });
      return;
    }

    if (!member.kickable) {
      await interaction.reply({ content: 'I cannot kick that member. Check my permissions and role hierarchy.', ephemeral: true });
      return;
    }

    if (interaction.member) {
      const modMember = interaction.guild?.members.cache.get(interaction.user.id);
      if (modMember && member.roles.highest.position >= modMember.roles.highest.position && interaction.guild?.ownerId !== interaction.user.id) {
        await interaction.reply({ content: 'You cannot kick someone with equal or higher role.', ephemeral: true });
        return;
      }
    }

    await member.kick(reason);

    const embed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setTitle('Member Kicked')
      .addFields(
        { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
        { name: 'Moderator', value: interaction.user.tag, inline: true },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
