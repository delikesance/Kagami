import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/command";
import { KagamiEmbedBuilder } from "../lib/embed";

export const clearCommand: Command = {
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

  async execute(interaction) {
    const amount = interaction.options.getInteger("amount", true);

    if (!interaction.channel || !("bulkDelete" in interaction.channel)) {
      return interaction.reply({
        embeds: [KagamiEmbedBuilder.error("This command can only be used in text channels.")],
        flags: MessageFlags.Ephemeral
      });
    }

    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);

      await interaction.reply({
        embeds: [new KagamiEmbedBuilder()
          .setTitle("Messages Cleared")
          .setDescription(`Successfully deleted **${deleted.size}** messages.`)
        ],
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      console.error("[ERROR] Failed to clear messages:", error);
      await interaction.reply({
        embeds: [KagamiEmbedBuilder.error("Failed to delete messages. They might be older than 14 days.")],
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
