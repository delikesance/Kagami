import { ChannelType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../../shared/types/command";
import db from "../../../shared/lib/db";
import { LogEvent } from "../lib/logger";

export const configCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configure the bot settings")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName("logs-channel")
        .setDescription("Set the channel for logs")
        .addChannelOption(option =>
          option
            .setName("channel")
            .setDescription("The channel to send logs to")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("logs-toggle")
        .setDescription("Toggle a specific log event type")
        .addStringOption(option =>
          option
            .setName("event")
            .setDescription("The event type to toggle")
            .setRequired(true)
            .addChoices(
              { name: "Message Delete", value: LogEvent.MESSAGE_DELETE },
              { name: "Message Update", value: LogEvent.MESSAGE_UPDATE },
              { name: "Member Join", value: LogEvent.MEMBER_JOIN },
              { name: "Member Leave", value: LogEvent.MEMBER_LEAVE }
            )
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (subcommand === "logs-channel") {
      const channel = interaction.options.getChannel("channel", true);

      db.run(
        `INSERT INTO guild_configs (guild_id, log_channel_id)
         VALUES (?, ?)
         ON CONFLICT(guild_id) DO UPDATE SET log_channel_id = excluded.log_channel_id`,
        [guildId, channel.id]
      );

      await interaction.reply({
        content: `Log channel has been set to ${channel}.`,
        flags: MessageFlags.Ephemeral
      });
    } else if (subcommand === "logs-toggle") {
      const event = interaction.options.getString("event", true) as LogEvent;

      const query = db.query("SELECT log_events FROM guild_configs WHERE guild_id = ?");
      const result = query.get(guildId) as { log_events: string } | null;

      let enabledEvents: string[] = result ? JSON.parse(result.log_events) : [];

      if (enabledEvents.includes(event)) {
        enabledEvents = enabledEvents.filter(e => e !== event);
      } else {
        enabledEvents.push(event);
      }

      db.run(
        `INSERT INTO guild_configs (guild_id, log_events)
         VALUES (?, ?)
         ON CONFLICT(guild_id) DO UPDATE SET log_events = excluded.log_events`,
        [guildId, JSON.stringify(enabledEvents)]
      );

      const isEnabled = enabledEvents.includes(event);
      await interaction.reply({
        content: `Log event \`${event}\` is now **${isEnabled ? "enabled" : "disabled"}**.`,
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
