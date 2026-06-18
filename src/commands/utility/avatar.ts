import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { BotCommand } from '../../types';

export const avatarCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Display a user\'s avatar')
    .addUserOption((opt) =>
      opt
        .setName('target')
        .setDescription('Target user')
        .setRequired(false)
    ),
  category: 'utility',

  async execute(interaction) {
    const target = interaction.options.getUser('target') ?? interaction.user;
    const avatarUrl = target.displayAvatarURL({ size: 4096, extension: 'png' });

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`${target.displayName}'s Avatar`)
      .setImage(avatarUrl)
      .setFooter({ text: `ID: ${target.id}` });

    await interaction.reply({ embeds: [embed] });
  },
};
