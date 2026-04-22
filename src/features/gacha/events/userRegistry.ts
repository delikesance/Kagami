import { Events, type Message } from "discord.js";
import type { Event } from "../../../shared/types/event";
import { registerUser } from "../lib/gacha";

export const userRegistryEvent: Event<Events.MessageCreate> = {
  name: Events.MessageCreate,
  async execute(message: Message) {
    if (message.author.bot) return;
    registerUser(message.author);
  }
};
