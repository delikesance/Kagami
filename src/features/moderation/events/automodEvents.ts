import { Events, Message, PartialMessage } from "discord.js";
import type { Event } from "../../../shared/types/event";
import db from "../../../shared/lib/db";
import { LogEvent, createLogEmbed, sendLog, getGuildLanguage } from "../../logging/lib/logger";
import { t } from "../../../shared/lib/i18n";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";
import washyourmouthoutwithsoap from "washyourmouthoutwithsoap";

async function checkMessage(message: Message | PartialMessage) {
  if (message.partial) await message.fetch();
  if (!message.guildId || !message.content || message.author?.bot) return;

  const guildId = message.guildId;
  const content = message.content.toLowerCase();

  // 1. Fetch Automod Config
  const configQuery = db.query("SELECT use_default_filter, exempt_roles, exempt_channels FROM automod_configs WHERE guild_id = ?");
  const config = configQuery.get(guildId) as { use_default_filter: number, exempt_roles: string, exempt_channels: string } | null;

  const useDefault = config?.use_default_filter ?? 1;
  const exemptRoles = config?.exempt_roles ? JSON.parse(config.exempt_roles) as string[] : [];
  const exemptChannels = config?.exempt_channels ? JSON.parse(config.exempt_channels) as string[] : [];

  if (exemptChannels.includes(message.channelId)) return;
  if (message.member && message.member.roles.cache.some(role => exemptRoles.includes(role.id))) return;

  // 2. Fetch Custom Blacklist
  const blacklistQuery = db.query("SELECT word FROM automod_blacklists WHERE guild_id = ?");
  const customBlacklist = blacklistQuery.all(guildId) as { word: string }[];
  
  let isBadWord = false;

  for (const item of customBlacklist) {
    if (content.includes(item.word)) {
      isBadWord = true;
      break;
    }
  }

  if (!isBadWord && useDefault === 1) {
    if (washyourmouthoutwithsoap.check("en", content) || washyourmouthoutwithsoap.check("fr", content)) {
        isBadWord = true;
    }
  }

  if (isBadWord) {
    try {
      await message.delete();
      
      const guildLng = getGuildLanguage(guildId);

      // Fetch User Language Preference with better fallbacks
      const userConfigQuery = db.query("SELECT locale FROM user_configs WHERE user_id = ?");
      const userConfig = userConfigQuery.get(message.author!.id) as { locale: string } | null;
      
      // Chain: Stored User Locale -> Server Discord Locale -> Bot Config Log Locale -> English
      const userLng = userConfig?.locale || message.guild?.preferredLocale || guildLng || "en";
      
      try {
        await message.author?.send({
          embeds: [new KagamiEmbedBuilder("error")
            .setTitle(t("commands.automod.dm_warning_title", userLng))
            .setDescription(t("commands.automod.dm_warning_desc", userLng, { guild: message.guild?.name || "Server" }))
          ]
        });
      } catch (e) {
        // DM failed
      }

      const logEmbed = createLogEmbed(
        t("logs.automod_delete", { lng: guildLng }),
        t("logs.automod_delete_desc", {
          lng: guildLng,
          user: message.author?.toString() || "Unknown",
          tag: message.author?.tag || "Unknown",
          channel: message.channel.toString(),
          content: message.content
        }),
        0xe74c3c
      );
      await sendLog(guildId, LogEvent.AUTOMOD_DELETE, logEmbed, message.client);

    } catch (e) {
      console.error("[AUTOMOD] Failed to delete or log message:", e);
    }
  }
}

export const automodMessageCreateEvent: Event<Events.MessageCreate> = {
  name: Events.MessageCreate,
  async execute(message) {
    await checkMessage(message);
  }
};

export const automodMessageUpdateEvent: Event<Events.MessageUpdate> = {
  name: Events.MessageUpdate,
  async execute(oldMessage, newMessage) {
    await checkMessage(newMessage);
  }
};
