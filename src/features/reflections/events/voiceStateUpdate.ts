import { Events, type VoiceState, ChannelType } from "discord.js";
import type { Event } from "../../../shared/types/event";
import db from "../../../shared/lib/db";

export const reflectionVoiceEvent: Event<Events.VoiceStateUpdate> = {
  name: Events.VoiceStateUpdate,
  async execute(oldState: VoiceState, newState: VoiceState) {
    const guildId = newState.guild.id;

    // 1. Check for Channel Creation
    const config = db.query("SELECT generator_channel_id, category_id FROM reflection_configs WHERE guild_id = ?")
      .get(guildId) as { generator_channel_id: string, category_id: string | null } | undefined;

    console.log(`[REFLECTION DEBUG] Voice update in ${newState.guild.name}. Joined: ${newState.channelId}. Config generator: ${config?.generator_channel_id}`);

    if (config && newState.channelId === config.generator_channel_id) {
      console.log(`[REFLECTION] User ${newState.member?.user.tag} joined generator channel.`);
      const member = newState.member;
      if (!member) return;

      const parentId = config.category_id || newState.channel?.parentId;

      try {
        const newChannel = await newState.guild.channels.create({
          name: `Reflet de ${member.displayName}`,
          type: ChannelType.GuildVoice,
          parent: parentId || undefined,
          permissionOverwrites: [
            {
              id: member.id,
              allow: ["ManageChannels", "MoveMembers", "MuteMembers", "DeafenMembers"],
            },
            {
              id: newState.guild.roles.everyone.id,
              allow: ["Connect"], // Ensure others can join by default, or change to deny for private
            }
          ],
        });

        console.log(`[REFLECTION] Created channel ${newChannel.name}. Moving member...`);
        await member.voice.setChannel(newChannel);

        db.query("INSERT INTO active_reflections (channel_id, guild_id, owner_id) VALUES (?, ?, ?)")
          .run(newChannel.id, guildId, member.id);
      } catch (error) {
        console.error("[REFLECTION] Failed to create or move member:", error);
      }
    }

    // 2. Check for Channel Deletion
    if (oldState.channelId) {
      const activeReflection = db.query("SELECT channel_id FROM active_reflections WHERE channel_id = ?")
        .get(oldState.channelId);

      if (activeReflection) {
        const channel = oldState.channel;
        if (channel && channel.members.size === 0) {
          await channel.delete().catch(() => {});
          db.query("DELETE FROM active_reflections WHERE channel_id = ?").run(oldState.channelId);
        }
      }
    }
  }
};
