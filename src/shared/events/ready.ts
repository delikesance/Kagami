import { Events } from "discord.js";
import type { Event } from "../types/event";
import { registerUser } from "../../features/gacha/lib/gacha";

export const readyEvent: Event<Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`[OK] Logged in as ${client.user.tag}`);
    
    // Sync members from all guilds
    console.log("[GACHA] Syncing members from all guilds...");
    let totalSynced = 0;
    
    for (const guild of client.guilds.cache.values()) {
      try {
        const members = await guild.members.fetch();
        members.forEach(member => {
          if (!member.user.bot) {
            registerUser(member.user);
            totalSynced++;
          }
        });
      } catch (error) {
        console.error(`[GACHA] Failed to sync members for guild ${guild.name}:`, error);
      }
    }
    
    console.log(`[GACHA] Sync complete. Registered ${totalSynced} users across ${client.guilds.cache.size} guilds.`);
  }
}
