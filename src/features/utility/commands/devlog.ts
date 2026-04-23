import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../../shared/types/command";
import db from "../../../shared/lib/db";
import { readdirSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

export const devlogCommand: Command = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("devlog")
    .setDescription("Developer: Send unpublished devlogs to the current channel"),

  async execute(interaction: ChatInputCommandInteraction) {
    // Check if user is a developer
    const isDev = db.prepare("SELECT user_id FROM developers WHERE user_id = ?").get(interaction.user.id);
    
    if (!isDev) {
      return interaction.reply({ content: "You do not have permission to use this developer command.", ephemeral: true });
    }

    const devlogsDir = join(process.cwd(), "devlogs");
    
    // Ensure devlogs directory exists
    if (!existsSync(devlogsDir)) {
      mkdirSync(devlogsDir);
    }

    // Get all markdown files in devlogs/ directory
    const files = readdirSync(devlogsDir).filter(file => file.endsWith('.md'));
    
    if (files.length === 0) {
      return interaction.reply({ content: "No devlog files found in the `devlogs/` directory.", ephemeral: true });
    }

    // Find unpublished devlogs
    const unpublishedFiles = [];
    for (const file of files) {
      const isPublished = db.prepare("SELECT filename FROM published_devlogs WHERE filename = ?").get(file);
      if (!isPublished) {
        unpublishedFiles.push(file);
      }
    }

    if (unpublishedFiles.length === 0) {
      return interaction.reply({ content: "All devlogs have already been published.", ephemeral: true });
    }

    // Acknowledge the interaction first to prevent timeout
    await interaction.reply({ content: `Found ${unpublishedFiles.length} unpublished devlog(s). Sending...`, ephemeral: true });

    // Send each unpublished devlog
    for (const file of unpublishedFiles) {
      const filePath = join(devlogsDir, file);
      const content = readFileSync(filePath, "utf-8");
      
      // Chunk content if it exceeds 1900 characters
      const chunks = [];
      for (let i = 0; i < content.length; i += 1900) {
        chunks.push(content.substring(i, i + 1900));
      }

      await interaction.channel?.send(`📝 **New Devlog: ${file.replace('.md', '')}**`);
      
      for (const chunk of chunks) {
        await interaction.channel?.send(chunk);
      }

      // Mark as published in the database
      db.prepare("INSERT INTO published_devlogs (filename, published_at) VALUES (?, ?)").run(file, Date.now());
    }
  }
};
