import { REST, Routes } from "discord.js";
import { env } from "./env";
import type { Command } from "../types/command";

export async function deployCommands(commands: Command[]) {
  const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);
  const commandData = commands.map(c => c.data.toJSON());

  try {
    console.log(`[DEPLOY] Started refreshing ${commandData.length} application command(s).`);

    const data = await rest.put(
      Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID),
      { body: commandData },
    );

    console.log(
      `[DEPLOY] Successfully reloaded ${Array.isArray(data) ? data.length : commandData.length} application command(s).`
    );
  } catch (error) {
    console.error("[DEPLOY] Failed to deploy commands:", error);
    throw error;
  }
}
