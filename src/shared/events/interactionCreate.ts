import { Events, MessageFlags } from "discord.js";
import type { Event } from "../types/event";
import type { Bot } from "../../index";
import db from "../lib/db";

export const interactionCreateEvent: Event<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return

    // Track/Update user locale
    db.prepare(`
      INSERT INTO user_configs (user_id, locale)
      VALUES (?, ?)
      ON CONFLICT(user_id) DO UPDATE SET locale = excluded.locale
    `).run(interaction.user.id, interaction.locale);

    const bot = interaction.client as Bot;
    const command = bot.commands.get(interaction.commandName)

    if (!command) {
      if (interaction.replied || interaction.deferred) return

      await interaction.reply({
        content: "This command is not available right now.",
        flags: MessageFlags.Ephemeral
      })

      return
    }

    try {
      await command.execute(interaction, interaction.locale)
    } catch (error) {
      console.error(`[ERROR] Error executing command ${interaction.commandName}:`, error)
      const content = "There was an error while executing this command!"
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content, flags: MessageFlags.Ephemeral })
      } else {
        await interaction.reply({ content, flags: MessageFlags.Ephemeral })
      }
    }
  }
}
