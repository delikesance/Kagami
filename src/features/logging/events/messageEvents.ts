import { Events } from "discord.js";
import type { Event } from "../../../shared/types/event";
import { LogEvent, createLogEmbed, sendLog, getGuildLanguage } from "../lib/logger";
import { t } from "../../../shared/lib/i18n";

export const messageDeleteEvent: Event<Events.MessageDelete> = {
  name: Events.MessageDelete,
  async execute(message) {
    if (message.partial || !message.guildId || message.author?.bot) return;

    const lng = getGuildLanguage(message.guildId);
    const embed = createLogEmbed(
      t("logs.message_deleted", { lng }),
      t("logs.message_deleted_desc", {
        lng,
        author: message.author.toString(),
        tag: message.author.tag,
        channel: message.channel.toString(),
        content: message.content || t("logs.no_content", { lng })
      }),
      0xe74c3c // Red
    );

    await sendLog(message.guildId, LogEvent.MESSAGE_DELETE, embed, message.client);
  }
}

export const messageUpdateEvent: Event<Events.MessageUpdate> = {
  name: Events.MessageUpdate,
  async execute(oldMessage, newMessage) {
    if (oldMessage.partial || newMessage.partial || !oldMessage.guildId || oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const lng = getGuildLanguage(oldMessage.guildId);
    const embed = createLogEmbed(
      t("logs.message_updated", { lng }),
      t("logs.message_updated_desc", {
        lng,
        author: oldMessage.author.toString(),
        tag: oldMessage.author.tag,
        channel: oldMessage.channel.toString(),
        url: newMessage.url
      }),
      0x3498db // Blue
    )
      .addFields(
        { name: t("logs.old_content", { lng }), value: oldMessage.content || t("logs.no_content", { lng }) },
        { name: t("logs.new_content", { lng }), value: newMessage.content || t("logs.no_content", { lng }) }
      );

    await sendLog(oldMessage.guildId, LogEvent.MESSAGE_UPDATE, embed, oldMessage.client);
  }
}
