import { Interaction } from 'discord.js';
import { createModuleLogger } from '../services/logger';
import { config } from '../config';
import { MiddlewarePipeline } from '../middlewares';
import { createCooldownMiddleware } from '../middlewares/cooldown';
import { createRateLimitMiddleware } from '../middlewares/rateLimit';
import { createAntiSpamMiddleware } from '../middlewares/antiSpam';
import { createPermissionMiddleware } from '../middlewares/permissions';
import { recordCommand } from '../services/health';
import { addXp } from '../services/database';
import { MiddlewareContext } from '../types';

const log = createModuleLogger('InteractionEvent');

const pipeline = new MiddlewarePipeline();
pipeline.use(createPermissionMiddleware(config.ownerId));
pipeline.use(createCooldownMiddleware(config.cooldownDefault));
pipeline.use(createRateLimitMiddleware(config.rateLimitMax, config.rateLimitWindowMs));
pipeline.use(createAntiSpamMiddleware(config.antiSpamThreshold, config.antiSpamWindowMs));

export const interactionCreateEvent = async (interaction: Interaction): Promise<void> => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) {
    await interaction.reply({ content: 'Command not found.', ephemeral: true });
    return;
  }

  const ctx: MiddlewareContext = {
    commandName: interaction.commandName,
    userId: interaction.user.id,
    guildId: interaction.guild?.id,
    memberPermissions: interaction.memberPermissions?.bitfield ?? undefined,
  };

  const result = await pipeline.run(ctx);

  if (!result.allowed) {
    await interaction.reply({
      content: result.reason ?? 'Command blocked.',
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction);
    recordCommand();

    if (interaction.guild) {
      try {
        addXp(interaction.user.id, interaction.guild.id, Math.floor(Math.random() * 10) + 5);
      } catch {
        // XP gain is non-critical
      }
    }
  } catch (err) {
    log.error(`Command error: ${interaction.commandName}`, {
      error: err instanceof Error ? err.message : String(err),
      userId: interaction.user.id,
    });

    const errorMessage = 'An error occurred while executing this command.';
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ content: errorMessage }).catch(() => {});
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => {});
    }
  }
};
