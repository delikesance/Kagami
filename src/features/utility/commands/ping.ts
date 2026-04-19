import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../../shared/types/command";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";

export const pingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with pong"),

  async execute(interaction) {
    const sent = await interaction.reply({
      content: "Pinging...",
      withResponse: true,
    })

    const apiLatency = interaction.client.ws.ping
    const botLatency = sent.interaction.createdTimestamp - interaction.createdTimestamp

    await interaction.editReply({
      content: "",
      embeds: [new KagamiEmbedBuilder()
        .setTitle("Pong ! 🏓")
        .addFields([
          { name: "Api Latency", value: "> " + apiLatency + " ms", inline: true },
          { name: "Bot Lantecy", value: "> " + botLatency + " ms", inline: true }
        ])]
    })
  }
}
