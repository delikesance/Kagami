import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../../shared/types/command";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";
import { t } from "../../../shared/lib/i18n";

export const pingCommand: Command = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with pong"),

  async execute(interaction, locale) {
    const sent = await interaction.reply({
      content: t("commands.ping.wait", locale),
      withResponse: true,
    })

    const apiLatency = interaction.client.ws.ping
    const botLatency = sent.interaction.createdTimestamp - interaction.createdTimestamp

    await interaction.editReply({
      content: "",
      embeds: [new KagamiEmbedBuilder()
        .setTitle(t("commands.ping.title", locale))
        .addFields([
          { name: t("commands.ping.api", locale), value: "> " + apiLatency + " ms", inline: true },
          { name: t("commands.ping.bot", locale), value: "> " + botLatency + " ms", inline: true }
        ])]
    })
  }
}
