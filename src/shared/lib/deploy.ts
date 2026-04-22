import { REST, Routes } from "discord.js";
import { env } from "./env";
import type { Command } from "../types/command";

export async function deployCommands(commands: Command[], clientId: string, guildIds: string[]) {
  const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);
  const commandData = commands.map(c => c.data.toJSON());

  for (const guildId of guildIds) {
    try {
      console.log(`[DEPLOY] Refreshing commands for guild: ${guildId}`);

      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commandData },
      );
    } catch (error) {
      console.error(`[DEPLOY] Failed to deploy commands for guild ${guildId}:`, error);
    }
  }
}
