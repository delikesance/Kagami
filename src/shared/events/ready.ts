import { Events } from "discord.js";
import type { Event } from "../types/event";

export const readyEvent: Event<Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`[OK] Logged in as ${client.user.tag}`)
  }
}
