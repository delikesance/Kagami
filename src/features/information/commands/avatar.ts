import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../../shared/types/command";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";
import { t } from "../../../shared/lib/i18n";

export const avatarCommand: Command = {
  category: "Information",
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Replies with target's avatar")
    .addUserOption((option) => option.setName("target").setDescription("Target you want the avatar from").setRequired(false)),

  async execute(interaction, locale) {
    const target = interaction.options.getUser("target") || interaction.user
    const user = await target.fetch(true)

    const avatarURL = user.avatarURL({ size: 2048 }) || user.defaultAvatarURL

    await interaction.reply({
      embeds: [new KagamiEmbedBuilder()
        .setTitle(t("commands.avatar.title", locale, { user: target.username }))
        .setImage(avatarURL)
      ]
    })
  }
}
