import {
  ActionRowBuilder,
  ChannelType,
  ComponentType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  type ChatInputCommandInteraction
} from "discord.js";
import type { Command } from "../../../shared/types/command";
import db from "../../../shared/lib/db";
import { LogEvent } from "../lib/logger";
import { t } from "../../../shared/lib/i18n";

const logEventLabels: Record<LogEvent, string> = {
  [LogEvent.MESSAGE_DELETE]: "Message Delete",
  [LogEvent.MESSAGE_UPDATE]: "Message Update",
  [LogEvent.MEMBER_JOIN]: "Member Join",
  [LogEvent.MEMBER_LEAVE]: "Member Leave",
  [LogEvent.MEMBER_UPDATE]: "Member Update",
  [LogEvent.ROLE_CREATE]: "Role Create",
  [LogEvent.ROLE_DELETE]: "Role Delete",
  [LogEvent.ROLE_UPDATE]: "Role Update",
  [LogEvent.CHANNEL_CREATE]: "Channel Create",
  [LogEvent.CHANNEL_DELETE]: "Channel Delete",
  [LogEvent.CHANNEL_UPDATE]: "Channel Update",
  [LogEvent.GUILD_BAN_ADD]: "Member Ban",
  [LogEvent.GUILD_BAN_REMOVE]: "Member Unban",
  [LogEvent.MEMBER_WARN]: "Member Warn",
  [LogEvent.MEMBER_UNWARN]: "Member Unwarn",
  [LogEvent.AUTOMOD_DELETE]: "Auto-Mod Delete",
};

export const logsCommand: Command = {
  category: "Configuration",
  data: new SlashCommandBuilder()
    .setName("logs")
    .setDescription("Configure the logging feature")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName("configure")
        .setDescription("Configure logging settings")
        .addChannelOption(option =>
          option
            .setName("channel")
            .setDescription("The channel to send logs to")
            .addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption(option =>
          option
            .setName("language")
            .setDescription("The language for logs (en/fr)")
            .addChoices(
              { name: "English", value: "en" },
              { name: "Français", value: "fr" }
            )
        )
    ),
  async execute(interaction: ChatInputCommandInteraction, locale: string) {
    const guildId = interaction.guildId!;
    const channel = interaction.options.getChannel("channel");
    const language = interaction.options.getString("language");

    const responses: string[] = [];

    if (channel) {
      db.prepare(
        `INSERT INTO guild_configs (guild_id, log_channel_id)
         VALUES (?, ?)
         ON CONFLICT(guild_id) DO UPDATE SET log_channel_id = excluded.log_channel_id`
      ).run(guildId, channel.id);
      responses.push(t("commands.logs.channel_set", locale, { channel: channel.toString() }));
    }

    if (language) {
      db.prepare(
        `INSERT INTO guild_configs (guild_id, language)
         VALUES (?, ?)
         ON CONFLICT(guild_id) DO UPDATE SET language = excluded.language`
      ).run(guildId, language);
      responses.push(t("commands.logs.lang_set", locale, { lang: language === 'fr' ? 'Français' : 'English' }));
    }

    // If any options were provided, just send the confirmation and don't show the menu
    if (responses.length > 0) {
      await interaction.reply({
        content: responses.join("\n"),
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const query = db.query("SELECT log_events FROM guild_configs WHERE guild_id = ?");
    const result = query.get(guildId) as { log_events: string } | null;
    const enabledEvents: string[] = result ? JSON.parse(result.log_events) : [];

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("logs_event_select")
      .setPlaceholder(t("commands.logs.select_events", locale))
      .setMinValues(0)
      .setMaxValues(Object.keys(LogEvent).length)
      .addOptions(
        Object.entries(LogEvent).map(([_, value]) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(logEventLabels[value as LogEvent] || value)
            .setValue(value)
            .setDefault(enabledEvents.includes(value))
        )
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const response = await interaction.reply({
      content: t("commands.logs.select_events", locale),
      components: [row],
      flags: MessageFlags.Ephemeral
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60000
    });

    collector.on("collect", async i => {
      const selectedEvents = i.values;

      db.prepare(
        `INSERT INTO guild_configs (guild_id, log_events)
         VALUES (?, ?)
         ON CONFLICT(guild_id) DO UPDATE SET log_events = excluded.log_events`
      ).run(guildId, JSON.stringify(selectedEvents));

      await i.reply({
        content: t("commands.logs.updated", locale, {
          events: selectedEvents.length > 0 
            ? selectedEvents.map(e => `\`${e}\``).join(", ") 
            : t("commands.logs.none", locale)
        }),
        flags: MessageFlags.Ephemeral
      });
    });

    collector.on("end", () => {
      interaction.editReply({ components: [] }).catch(() => { });
    });
  }
};
