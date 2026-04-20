import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import type { Command } from "../../../shared/types/command";
import { getUserLevel } from "../lib/xp";
import { generateRankCard } from "../lib/canvas";

export const rankCommand: Command = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Afficher votre niveau ou celui d'un autre utilisateur")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("L'utilisateur dont vous voulez voir le rang")
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("target") || interaction.user;
    
    if (!interaction.guild) return;

    await interaction.deferReply();

    const data = getUserLevel(interaction.guild.id, target.id);
    const buffer = await generateRankCard(target, data.xp, data.level);
    const attachment = new AttachmentBuilder(buffer, { name: `rank-${target.id}.png` });

    await interaction.editReply({ files: [attachment] });
  },
};
