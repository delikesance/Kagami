import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../../shared/types/command";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";
import db from "../../../shared/lib/db";
import { LogEvent, createLogEmbed, sendLog, getGuildLanguage } from "../../logging/lib/logger";
import { t } from "../../../shared/lib/i18n";

export const delwarnCommand: Command = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("delwarn")
    .setDescription("Removes a specific warning by its ID")
    .addIntegerOption(option =>
      option.setName("id")
        .setDescription("The ID of the warning to remove")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, locale) {
    const id = interaction.options.getInteger("id", true);

    try {
      // Find the warning first to check if it exists and to get details for logging
      const warning = db.query("SELECT * FROM warnings WHERE id = ? AND guild_id = ?").get(id, interaction.guildId!) as { user_id: string, reason: string } | null;

      if (!warning) {
        await interaction.reply({
          embeds: [KagamiEmbedBuilder.error(t("commands.delwarn.not_found", locale, { id }))],
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      db.query("DELETE FROM warnings WHERE id = ? AND guild_id = ?").run(id, interaction.guildId!);

      // Log deletion (uses guild language)
      const lng = getGuildLanguage(interaction.guildId!);
      const logEmbed = createLogEmbed(
        t("logs.warning_removed", lng),
        t("logs.warning_removed_desc", lng, {
          moderator: interaction.user.toString(),
          tag: interaction.user.tag,
          id,
          user: warning.user_id,
          reason: warning.reason
        }),
        0x3498db // Blue
      );
      await sendLog(interaction.guildId!, LogEvent.MEMBER_UNWARN, logEmbed, interaction.client);

      await interaction.reply({
        embeds: [new KagamiEmbedBuilder()
          .setTitle(t("common.success", locale))
          .setDescription(t("commands.delwarn.success", locale, { id }))
        ],
        flags: MessageFlags.Ephemeral
      });

    } catch (error) {
      console.error("[ERROR] Failed to delete warning:", error);
      await interaction.reply({
        embeds: [KagamiEmbedBuilder.error(t("commands.delwarn.error", locale))],
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
