import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../../shared/types/command";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";

export const avatarCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Replies with target's avatar")
    .addUserOption((option) => option.setName("target").setDescription("Target you want the avatar from").setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser("target") || interaction.user
    const user = await target.fetch(true)

    const avatarURL = user.avatarURL({ size: 2048 })

    interaction.reply({
      embeds: [new KagamiEmbedBuilder()
        .setTitle(`Avatar of ${target.username}`)
        .setImage(avatarURL)
      ]
    })
  }
}
