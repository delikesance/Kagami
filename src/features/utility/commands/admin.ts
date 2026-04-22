import { SlashCommandBuilder, type ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import type { Command } from "../../../shared/types/command";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";
import db from "../../../shared/lib/db";
import { addShards, getEconomy } from "../../gacha/lib/gacha";

const LEAD_DEV_ID = "1494544143081279532";

export const adminCommand: Command = {
  category: "Admin",
  data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Primary administration and developer commands")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName("give-shards")
        .setDescription("Developer: Give shards to a user")
        .addUserOption(opt => opt.setName("user").setDescription("The recipient").setRequired(true))
        .addIntegerOption(opt => opt.setName("amount").setDescription("Amount of shards").setRequired(true).setMinValue(1))
    )
    .addSubcommand(sub =>
      sub.setName("add-dev")
        .setDescription("Lead Developer: Add a new developer")
        .addUserOption(opt => opt.setName("user").setDescription("The user to add").setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName("remove-dev")
        .setDescription("Lead Developer: Remove a developer")
        .addUserOption(opt => opt.setName("user").setDescription("The user to remove").setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    // Developer check logic
    const isDev = db.prepare("SELECT user_id FROM developers WHERE user_id = ?").get(interaction.user.id);
    
    if (subcommand === "give-shards") {
      if (!isDev) {
        return interaction.reply({ content: "You do not have permission to use this developer command.", ephemeral: true });
      }

      const target = interaction.options.getUser("user", true);
      const amount = interaction.options.getInteger("amount", true);

      addShards(target.id, amount);
      const econ = getEconomy(target.id);

      const embed = new KagamiEmbedBuilder("success")
        .setTitle("Shards Granted")
        .setDescription(`Successfully gave **${amount} shards** to ${target}.\nThey now have **${econ.shards} shards**.`);

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === "add-dev") {
      if (interaction.user.id !== LEAD_DEV_ID) {
        return interaction.reply({ content: "Only the Lead Developer can add new developers.", ephemeral: true });
      }

      const target = interaction.options.getUser("user", true);
      db.prepare("INSERT OR IGNORE INTO developers (user_id) VALUES (?)").run(target.id);

      return interaction.reply({ 
        content: `**${target.username}** has been added to the developer list.`, 
        ephemeral: true 
      });
    }

    if (subcommand === "remove-dev") {
      if (interaction.user.id !== LEAD_DEV_ID) {
        return interaction.reply({ content: "Only the Lead Developer can remove developers.", ephemeral: true });
      }

      const target = interaction.options.getUser("user", true);

      if (target.id === LEAD_DEV_ID) {
        return interaction.reply({ content: "The Lead Developer cannot be removed.", ephemeral: true });
      }

      db.prepare("DELETE FROM developers WHERE user_id = ?").run(target.id);

      return interaction.reply({ 
        content: `**${target.username}** has been removed from the developer list.`, 
        ephemeral: true 
      });
    }
  }
};
