import { EmbedBuilder, type SendableChannels, type TextChannel } from "discord.js";
import db from "../../../shared/lib/db";
import { embedConfig } from "../../../shared/lib/embed";

export enum LogEvent {
  MESSAGE_DELETE = "messageDelete",
  MESSAGE_UPDATE = "messageUpdate",
  MEMBER_JOIN = "memberJoin",
  MEMBER_LEAVE = "memberLeave",
}

export async function sendLog(guildId: string, event: LogEvent, embed: EmbedBuilder, client: any) {
  const query = db.query("SELECT log_channel_id, log_events FROM guild_configs WHERE guild_id = ?");
  const config = query.get(guildId) as { log_channel_id: string | null; log_events: string } | null;

  if (!config || !config.log_channel_id) return;

  const enabledEvents = JSON.parse(config.log_events) as string[];
  if (!enabledEvents.includes(event)) return;

  try {
    const channel = await client.channels.fetch(config.log_channel_id);
    if (channel && channel.isSendable()) {
      await (channel as SendableChannels).send({ embeds: [embed] });
    }
  } catch (error) {
    console.error(`[ERROR] Failed to send log for guild ${guildId}:`, error);
  }
}

export function createLogEmbed(title: string, description: string, color: number = embedConfig.colors.info) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();
}
