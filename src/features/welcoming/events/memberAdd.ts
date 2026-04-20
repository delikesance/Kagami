import { Events, type SendableChannels } from "discord.js";
import type { Event } from "../../../shared/types/event";
import db from "../../../shared/lib/db";
import { sendWelcomeMessage } from "../events/guildMemberAdd"; // reusing existing function
import { LogEvent, createLogEmbed, sendLog, getGuildLanguage } from "../../logging/lib/logger";
import { t } from "../../../shared/lib/i18n";

export const guildMemberAddEvent: Event<Events.GuildMemberAdd> = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    // Welcoming
    const welcomeQuery = db.query("SELECT welcome_channel_id FROM guild_configs WHERE guild_id = ?");
    const welcomeResult = welcomeQuery.get(member.guild.id) as { welcome_channel_id: string } | null;

    if (welcomeResult?.welcome_channel_id) {
      try {
        const channel = await member.guild.channels.fetch(welcomeResult.welcome_channel_id);
        if (channel && channel.isSendable()) {
          await sendWelcomeMessage(member, channel as SendableChannels);
        }
      } catch (error) {
        console.error(`[ERROR] Failed to fetch welcome channel for guild ${member.guild.id}:`, error);
      }
    }

    // Logging
    const lng = getGuildLanguage(member.guild.id);
    const embed = createLogEmbed(
      t("logs.member_joined", { lng }),
      t("logs.member_joined_desc", { lng, member: member.toString(), tag: member.user.tag }),
      0x2ecc71 // Green
    ).setThumbnail(member.user.displayAvatarURL());

    await sendLog(member.guild.id, LogEvent.MEMBER_JOIN, embed, member.client);
  }
}
