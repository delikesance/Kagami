import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../../shared/types/command";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";
import db from "../../../shared/lib/db";
import { t } from "../../../shared/lib/i18n";

export const automodCommand: Command = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("automod")
    .setDescription("Configure auto-moderation settings")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName("toggle-default")
        .setDescription("Toggles the default profanity filter")
        .addBooleanOption(option =>
          option.setName("enabled")
            .setDescription("Enable or disable the default filter")
            .setRequired(true)
        )
    )
    .addSubcommandGroup(group =>
      group
        .setName("blacklist")
        .setDescription("Manage the custom server blacklist")
        .addSubcommand(subcommand =>
          subcommand
            .setName("add")
            .setDescription("Add a word to the blacklist")
            .addStringOption(option =>
              option.setName("word")
                .setDescription("The word to block")
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName("remove")
            .setDescription("Remove a word from the blacklist")
            .addStringOption(option =>
              option.setName("word")
                .setDescription("The word to unblock")
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName("list")
            .setDescription("List all blocked words")
        )
    ),

  async execute(interaction, locale) {
    const guildId = interaction.guildId!;
    const subcommand = interaction.options.getSubcommand();
    const group = interaction.options.getSubcommandGroup();

    if (subcommand === "toggle-default") {
      const enabled = interaction.options.getBoolean("enabled", true);
      
      db.prepare(`
        INSERT INTO automod_configs (guild_id, use_default_filter)
        VALUES (?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET use_default_filter = excluded.use_default_filter
      `).run(guildId, enabled ? 1 : 0);

      await interaction.reply({
        embeds: [new KagamiEmbedBuilder("success")
          .setDescription(enabled 
            ? t("commands.automod.default_filter_enabled", locale)
            : t("commands.automod.default_filter_disabled", locale))
        ],
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (group === "blacklist") {
      if (subcommand === "add") {
        const word = interaction.options.getString("word", true).toLowerCase();
        
        try {
          db.prepare("INSERT INTO automod_blacklists (guild_id, word) VALUES (?, ?)").run(guildId, word);
          await interaction.reply({
            embeds: [new KagamiEmbedBuilder("success")
              .setDescription(t("commands.automod.blacklist_added", locale, { word }))
            ],
            flags: MessageFlags.Ephemeral
          });
        } catch (e) {
          await interaction.reply({
            embeds: [KagamiEmbedBuilder.error(t("commands.automod.blacklist_already_exists", locale, { word }))],
            flags: MessageFlags.Ephemeral
          });
        }
      }

      if (subcommand === "remove") {
        const word = interaction.options.getString("word", true).toLowerCase();
        
        const result = db.prepare("DELETE FROM automod_blacklists WHERE guild_id = ? AND word = ?").run(guildId, word);
        
        if (result.changes > 0) {
          await interaction.reply({
            embeds: [new KagamiEmbedBuilder("success")
              .setDescription(t("commands.automod.blacklist_removed", locale, { word }))
            ],
            flags: MessageFlags.Ephemeral
          });
        } else {
          await interaction.reply({
            embeds: [KagamiEmbedBuilder.error(t("commands.automod.blacklist_not_found", locale, { word }))],
            flags: MessageFlags.Ephemeral
          });
        }
      }

      if (subcommand === "list") {
        const query = db.query("SELECT word FROM automod_blacklists WHERE guild_id = ?");
        const results = query.all(guildId) as { word: string }[];
        
        if (results.length === 0) {
          await interaction.reply({
            embeds: [new KagamiEmbedBuilder("info")
              .setDescription(t("commands.automod.blacklist_empty", locale))
            ],
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const wordsList = results.map(r => `• ${r.word}`).join("\n");
        await interaction.reply({
          embeds: [new KagamiEmbedBuilder("info")
            .setTitle(t("commands.automod.blacklist_list_title", locale))
            .setDescription(t("commands.automod.blacklist_list_desc", locale, { words: wordsList }))
          ],
          flags: MessageFlags.Ephemeral
        });
      }
    }
  }
};
