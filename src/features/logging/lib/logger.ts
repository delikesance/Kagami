import { type SendableChannels, type Client, EmbedBuilder, ChannelType } from "discord.js";
import db from "../../../shared/lib/db";
import { embedConfig, KagamiEmbedBuilder } from "../../../shared/lib/embed";
import { t } from "../../../shared/lib/i18n";

export enum LogEvent {
  MESSAGE_DELETE = "messageDelete",
  MESSAGE_UPDATE = "messageUpdate",
  MEMBER_JOIN = "memberJoin",
  MEMBER_LEAVE = "memberLeave",
  MEMBER_UPDATE = "memberUpdate",
  ROLE_CREATE = "roleCreate",
  ROLE_DELETE = "roleDelete",
  ROLE_UPDATE = "roleUpdate",
  CHANNEL_CREATE = "channelCreate",
  CHANNEL_DELETE = "channelDelete",
  CHANNEL_UPDATE = "channelUpdate",
  GUILD_BAN_ADD = "guildBanAdd",
  GUILD_BAN_REMOVE = "guildBanRemove",
  MEMBER_WARN = "memberWarn",
  MEMBER_UNWARN = "memberUnwarn",
  AUTOMOD_DELETE = "automodDelete",
}

export function getGuildLanguage(guildId: string): string {
  const query = db.query("SELECT language FROM guild_configs WHERE guild_id = ?");
  const config = query.get(guildId) as { language: string } | null;
  return config?.language || "en";
}

export async function sendLog(guildId: string, event: LogEvent, embed: EmbedBuilder, client: Client) {
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
  return new KagamiEmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color);
}

export function getChannelTypeName(type: ChannelType, lng: string): string {
  const types: Record<number, string> = {
    [ChannelType.GuildText]: lng === 'fr' ? 'Texte' : 'Text',
    [ChannelType.GuildVoice]: lng === 'fr' ? 'Vocal' : 'Voice',
    [ChannelType.GuildCategory]: lng === 'fr' ? 'Catégorie' : 'Category',
    [ChannelType.GuildAnnouncement]: lng === 'fr' ? 'Annonce' : 'Announcement',
    [ChannelType.AnnouncementThread]: lng === 'fr' ? 'Fil d\'annonce' : 'Announcement Thread',
    [ChannelType.PublicThread]: lng === 'fr' ? 'Fil public' : 'Public Thread',
    [ChannelType.PrivateThread]: lng === 'fr' ? 'Fil privé' : 'Private Thread',
    [ChannelType.GuildStageVoice]: lng === 'fr' ? 'Scène' : 'Stage',
    [ChannelType.GuildForum]: 'Forum',
  };

  return types[type] || `Unknown (${type})`;
}
