import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../../shared/types/command";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";
import { t } from "../../../shared/lib/i18n";

export const clearCommand: Command = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Deletes a specified number of messages")
    .addIntegerOption(option => 
      option.setName("amount")
        .setDescription("Amount of messages to delete (1-100)")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction, locale) {
    const amount = interaction.options.getInteger("amount", true);

    if (!interaction.channel || !("bulkDelete" in interaction.channel)) {
      await interaction.reply({
        embeds: [KagamiEmbedBuilder.error(t("commands.clear.channel_error", locale))],
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);

      await interaction.reply({
        embeds: [new KagamiEmbedBuilder()
          .setTitle(t("common.success", locale))
          .setDescription(t("commands.clear.success", locale, { amount: deleted.size }))
        ],
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      console.error("[ERROR] Failed to clear messages:", error);
      await interaction.reply({
        embeds: [KagamiEmbedBuilder.error(t("commands.clear.delete_error", locale))],
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
