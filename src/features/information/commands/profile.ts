import { SlashCommandBuilder, time, TimestampStyles } from "discord.js";
import type { Command } from "../../../shared/types/command";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";
import { t } from "../../../shared/lib/i18n";

export const profileCommand: Command = {
  category: "Information",
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Display user profile information")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to display profile for")
        .setRequired(false)
    ),

  async execute(interaction, locale) {
    const target = interaction.options.getUser("target") || interaction.user;
    const member = await interaction.guild?.members.fetch(target.id);

    const embed = new KagamiEmbedBuilder()
      .setTitle(t("commands.profile.title", locale, { user: target.username }))
      .setThumbnail(target.displayAvatarURL({ size: 1024 }))
      .addFields(
        { name: t("commands.profile.id", locale), value: target.id, inline: true },
        {
          name: t("commands.profile.created_at", locale),
          value: time(target.createdAt, TimestampStyles.RelativeTime),
          inline: true,
        }
      );

    if (member) {
      embed.addFields({
        name: t("commands.profile.joined_at", locale),
        value: member.joinedAt
          ? time(member.joinedAt, TimestampStyles.RelativeTime)
          : "Unknown",
        inline: true,
      });

      const roles = member.roles.cache
        .filter((role) => role.name !== "@everyone")
        .sort((a, b) => b.position - a.position)
        .map((role) => role.toString());

      embed.addFields({
        name: t("commands.profile.roles", locale, { count: roles.length }),
        value: roles.length > 0 ? roles.join(", ") : t("commands.profile.no_roles", locale),
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
