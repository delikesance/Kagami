import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../../shared/types/command";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";
import db from "../../../shared/lib/db";
import { t } from "../../../shared/lib/i18n";

export const warningsCommand: Command = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("Shows warnings for a user")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("The user to check warnings for")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, locale) {
    const user = interaction.options.getUser("user", true);

    try {
      const query = db.query(`
        SELECT id, reason, moderator_id, timestamp
        FROM warnings
        WHERE guild_id = ? AND user_id = ?
        ORDER BY timestamp DESC
      `);
      const results = query.all(interaction.guildId!, user.id) as Array<{
        id: number;
        reason: string;
        moderator_id: string;
        timestamp: number;
      }>;

      if (results.length === 0) {
        await interaction.reply({
          embeds: [new KagamiEmbedBuilder()
            .setTitle(t("commands.warnings.title", locale, { user: user.tag }))
            .setDescription(t("commands.warnings.no_warnings", locale, { user: user.toString() }))
          ],
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      const embed = new KagamiEmbedBuilder()
        .setTitle(t("commands.warnings.title", locale, { user: user.tag }))
        .setDescription(t("commands.warnings.count", locale, { user: user.toString(), count: results.length }))
        .setThumbnail(user.displayAvatarURL());

      results.forEach((warn) => {
        const date = new Date(warn.timestamp).toLocaleDateString(locale);
        embed.addFields({
          name: t("commands.warnings.field_title", locale, { id: warn.id, date }),
          value: t("commands.warnings.field_value", locale, { reason: warn.reason, moderator: warn.moderator_id })
        });
      });

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
      });

    } catch (error) {
      console.error("[ERROR] Failed to fetch warnings:", error);
      await interaction.reply({
        embeds: [KagamiEmbedBuilder.error(t("commands.warnings.error", locale))],
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
