import type { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder } from "discord.js";

export type SlashCommandData =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder

export type CommandCategory = "Utility" | "Information" | "Moderation" | "Configuration";

export type Command = {
  category: CommandCategory;
  data: SlashCommandData;
  execute: (interaction: ChatInputCommandInteraction, locale: string) => Promise<void>;
}
