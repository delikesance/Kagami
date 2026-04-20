import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../../shared/types/command";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";
import { t } from "../../../shared/lib/i18n";

export const bannerCommand: Command = {
  category: "Information",
  data: new SlashCommandBuilder()
    .setName("banner")
    .setDescription("Replies with target's banner")
    .addUserOption((option) => option.setName("target").setDescription("Target you want the banner from").setRequired(false)),

  async execute(interaction, locale) {
    const target = interaction.options.getUser("target") || interaction.user
    const user = await target.fetch(true)

    const bannerURL = user.bannerURL({ size: 2048 })

    if (!bannerURL) {
      await interaction.reply({ 
        content: t("commands.banner.no_banner", locale, { user: target.username }), 
        flags: MessageFlags.Ephemeral 
      })
      return
    }

    await interaction.reply({
      embeds: [new KagamiEmbedBuilder()
        .setTitle(t("commands.banner.title", locale, { user: target.username }))
        .setImage(bannerURL)
      ]
    })
  }
}
