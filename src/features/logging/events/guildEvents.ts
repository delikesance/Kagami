import { Events } from "discord.js";
import type { Event } from "../../../shared/types/event";
import { LogEvent, createLogEmbed, sendLog, getGuildLanguage } from "../lib/logger";
import { t } from "../../../shared/lib/i18n";

export const roleCreateEvent: Event<Events.GuildRoleCreate> = {
  name: Events.GuildRoleCreate,
  async execute(role) {
    const lng = getGuildLanguage(role.guild.id);
    const embed = createLogEmbed(
      t("logs.role_created", { lng }),
      t("logs.role_created_desc", { lng, role: role.name, id: role.id }),
      0x2ecc71 // Green
    );
    await sendLog(role.guild.id, LogEvent.ROLE_CREATE, embed, role.client);
  }
}

export const roleDeleteEvent: Event<Events.GuildRoleDelete> = {
  name: Events.GuildRoleDelete,
  async execute(role) {
    const lng = getGuildLanguage(role.guild.id);
    const embed = createLogEmbed(
      t("logs.role_deleted", { lng }),
      t("logs.role_deleted_desc", { lng, role: role.name, id: role.id }),
      0xe74c3c // Red
    );
    await sendLog(role.guild.id, LogEvent.ROLE_DELETE, embed, role.client);
  }
}

export const roleUpdateEvent: Event<Events.GuildRoleUpdate> = {
  name: Events.GuildRoleUpdate,
  async execute(oldRole, newRole) {
    if (oldRole.name !== newRole.name) {
      const lng = getGuildLanguage(newRole.guild.id);
      const embed = createLogEmbed(
        t("logs.role_updated_name", { lng }),
        t("logs.role_updated_name_desc", {
          lng,
          role: newRole.toString(),
          id: newRole.id,
          old: oldRole.name,
          new: newRole.name
        }),
        0x3498db // Blue
      );
      await sendLog(newRole.guild.id, LogEvent.ROLE_UPDATE, embed, newRole.client);
    }
  }
}

export const channelCreateEvent: Event<Events.ChannelCreate> = {
  name: Events.ChannelCreate,
  async execute(channel) {
    if (!("guild" in channel)) return;
    const lng = getGuildLanguage(channel.guild.id);
    const embed = createLogEmbed(
      t("logs.channel_created", { lng }),
      t("logs.channel_created_desc", {
        lng,
        channel: channel.toString(),
        id: channel.id,
        type: channel.type.toString()
      }),
      0x2ecc71 // Green
    );
    await sendLog(channel.guild.id, LogEvent.CHANNEL_CREATE, embed, channel.client);
  }
}

export const channelDeleteEvent: Event<Events.ChannelDelete> = {
  name: Events.ChannelDelete,
  async execute(channel) {
    if (!("guild" in channel)) return;
    const lng = getGuildLanguage(channel.guild.id);
    const embed = createLogEmbed(
      t("logs.channel_deleted", { lng }),
      t("logs.channel_deleted_desc", {
        lng,
        channel: "name" in channel ? channel.name : channel.id,
        id: channel.id,
        type: channel.type.toString()
      }),
      0xe74c3c // Red
    );
    await sendLog(channel.guild.id, LogEvent.CHANNEL_DELETE, embed, channel.client);
  }
}

export const channelUpdateEvent: Event<Events.ChannelUpdate> = {
  name: Events.ChannelUpdate,
  async execute(oldChannel, newChannel) {
    if (!("guild" in newChannel) || !("guild" in oldChannel)) return;

    if ("name" in oldChannel && "name" in newChannel && oldChannel.name !== newChannel.name) {
      const lng = getGuildLanguage(newChannel.guild.id);
      const embed = createLogEmbed(
        t("logs.channel_updated_name", { lng }),
        t("logs.channel_updated_name_desc", {
          lng,
          channel: newChannel.toString(),
          id: newChannel.id,
          old: oldChannel.name,
          new: newChannel.name
        }),
        0x3498db // Blue
      );
      await sendLog(newChannel.guild.id, LogEvent.CHANNEL_UPDATE, embed, newChannel.client);
    }
  }
}
