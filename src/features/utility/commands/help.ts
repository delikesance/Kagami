import {
  ActionRowBuilder,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from "discord.js";
import type { Command, CommandCategory } from "../../../shared/types/command";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";
import { t } from "../../../shared/lib/i18n";
import type { Bot } from "../../../index";

export const helpCommand: Command = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shows the help menu"),

  async execute(interaction, locale) {
    const bot = interaction.client as Bot;
    const categories: CommandCategory[] = ["Utility", "Information", "Moderation", "Configuration"];

    const embed = new KagamiEmbedBuilder()
      .setTitle(t("commands.help.title", locale, { category: "Kagami" }))
      .setDescription(t("commands.help.description", locale));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("help_category_select")
      .setPlaceholder(t("commands.help.placeholder", locale))
      .addOptions(
        categories.map(cat => 
          new StringSelectMenuOptionBuilder()
            .setLabel(t(`commands.help.categories.${cat}`, locale))
            .setDescription(t(`commands.help.category_descriptions.${cat}`, locale))
            .setValue(cat)
        )
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const response = await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60000
    });

    collector.on("collect", async i => {
      const category = i.values[0] as CommandCategory;
      const commandsInCategory = bot.commands.filter(cmd => cmd.category === category);

      const categoryEmbed = new KagamiEmbedBuilder()
        .setTitle(t("commands.help.title", locale, { category: t(`commands.help.categories.${category}`, locale) }))
        .setDescription(t(`commands.help.category_descriptions.${category}`, locale))
        .addFields(
          commandsInCategory.map(cmd => ({
            name: `/${cmd.data.name}`,
            value: cmd.data.description || "No description",
            inline: true
          }))
        );

      await i.update({
        embeds: [categoryEmbed],
        components: [row]
      });
    });

    collector.on("end", () => {
      interaction.editReply({ components: [] }).catch(() => { });
    });
  }
};
