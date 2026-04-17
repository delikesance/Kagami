import { ChannelType, GuildMember, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../../types/command";
import db from "../../../lib/db";

export const welcomingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("welcoming")
    .setDescription("Configure the welcoming feature")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(input => 
      input.setName("configure")
        .setDescription("Configure the welcoming channel")
        .addChannelOption(option => 
          option.setName("channel")
            .setDescription("The channel to send welcome messages to")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(input => input.setName("test").setDescription("test the welcoming feature")),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand()
    if (!interaction.member || !(interaction.member instanceof GuildMember) || !interaction.guildId) return

    if (subcommand === "configure") {
      const channel = interaction.options.getChannel("channel", true);

      db.prepare(
        "INSERT INTO guild_configs (guild_id, welcome_channel_id) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET welcome_channel_id = ?"
      ).run(interaction.guildId, channel.id, channel.id);

      await interaction.reply({
        content: `Successfully set welcoming channel to ${channel}`,
        flags: MessageFlags.Ephemeral
      });
    }

    if (subcommand === "test") {
      interaction.client.emit('guildMemberAdd', interaction.member)
      interaction.reply("Tested!")
    }
  }
}

