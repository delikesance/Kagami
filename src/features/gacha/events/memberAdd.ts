import { Events, type GuildMember } from "discord.js";
import type { Event } from "../../../shared/types/event";
import { registerUser } from "../lib/gacha";

export const gachaMemberAddEvent: Event<Events.GuildMemberAdd> = {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    if (member.user.bot) return;
    registerUser(member.user);
  }
};
