import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import type { Command } from "../../../shared/types/command";
import { getTopUsers } from "../lib/xp";
import { generateLeaderboardImage } from "../lib/canvas";

export const leaderboardCommand: Command = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Afficher le classement des membres les plus actifs du serveur"),

  async execute(interaction) {
    if (!interaction.guild) return;

    await interaction.deferReply();

    const topData = getTopUsers(interaction.guild.id, 5);
    
    // Resolve usernames
    const topUsers = await Promise.all(
      topData.map(async (data) => {
        const user = await interaction.client.users.fetch(data.user_id).catch(() => null);
        return {
          username: user?.username || "Unknown",
          level: data.level,
          xp: Math.floor(data.xp),
        };
      })
    );

    const buffer = await generateLeaderboardImage(interaction.guild.name, topUsers);
    const attachment = new AttachmentBuilder(buffer, { name: "leaderboard.png" });

    await interaction.editReply({ files: [attachment] });
  },
};
