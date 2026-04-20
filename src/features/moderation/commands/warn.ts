import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../../shared/types/command";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";
import db from "../../../shared/lib/db";
import { LogEvent, createLogEmbed, sendLog, getGuildLanguage } from "../../logging/lib/logger";
import { t } from "../../../shared/lib/i18n";

export const warnCommand: Command = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warns a user in the server")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("The user to warn")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Reason for the warning")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, locale) {
    const user = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") || t("common.no_reason", locale);

    if (user.bot) {
      await interaction.reply({
        embeds: [KagamiEmbedBuilder.error(t("common.bot_user_error", locale))],
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    try {
      // Insert into DB
      db.query(`
        INSERT INTO warnings (guild_id, user_id, reason, moderator_id, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        interaction.guildId!,
        user.id,
        reason,
        interaction.user.id,
        Date.now()
      );

      // Log the warning (uses guild language)
      const lng = getGuildLanguage(interaction.guildId!);
      const logEmbed = createLogEmbed(
        t("logs.user_warned", lng),
        t("logs.user_warned_desc", lng, {
          user: user.toString(),
          tag: user.tag,
          moderator: interaction.user.toString(),
          modtag: interaction.user.tag,
          reason
        }),
        0xf1c40f // Yellow
      );
      await sendLog(interaction.guildId!, LogEvent.MEMBER_WARN, logEmbed, interaction.client);

      // Notify the user (optional, best effort)
      try {
        await user.send({
          embeds: [new KagamiEmbedBuilder("warning")
            .setTitle(t("commands.warn.dm_title", locale))
            .setDescription(t("commands.warn.dm_description", locale, {
              guild: interaction.guild?.name || "Server",
              reason
            }))
          ]
        });
      } catch (e) {
        // User might have DMs closed
      }

      await interaction.reply({
        embeds: [new KagamiEmbedBuilder()
          .setTitle(t("common.success", locale))
          .setDescription(t("commands.warn.success", locale, { user: user.toString(), reason }))
        ],
        flags: MessageFlags.Ephemeral
      });

    } catch (error) {
      console.error("[ERROR] Failed to warn user:", error);
      await interaction.reply({
        embeds: [KagamiEmbedBuilder.error(t("commands.warn.error", locale))],
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
