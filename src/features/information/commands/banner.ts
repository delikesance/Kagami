import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../../shared/types/command";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";

export const bannerCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("banner")
    .setDescription("Replies with target's banner")
    .addUserOption((option) => option.setName("target").setDescription("Target you want the banner from").setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser("target") || interaction.user
    const user = await target.fetch(true)

    const bannerURL = user.bannerURL({ size: 2048 })

    if (!bannerURL) {
      interaction.reply({ content: `${target.username} does not have a banner`, flags: ["Ephemeral"] })
      return
    }

    interaction.reply({
      embeds: [new KagamiEmbedBuilder()
        .setTitle(`Banner of ${target.username}`)
        .setImage(bannerURL)
      ]
    })
  }
}
