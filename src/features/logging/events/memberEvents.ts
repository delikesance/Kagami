import { Events } from "discord.js";
import type { Event } from "../../../shared/types/event";
import { LogEvent, createLogEmbed, sendLog, getGuildLanguage } from "../lib/logger";
import { t } from "../../../shared/lib/i18n";

export const memberRemoveEvent: Event<Events.GuildMemberRemove> = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    const lng = getGuildLanguage(member.guild.id);
    const embed = createLogEmbed(
      t("logs.member_left", { lng }),
      t("logs.member_left_desc", { lng, tag: member.user.tag }),
      0xe74c3c // Red
    ).setThumbnail(member.user.displayAvatarURL());

    await sendLog(member.guild.id, LogEvent.MEMBER_LEAVE, embed, member.client);
  }
}

export const memberUpdateEvent: Event<Events.GuildMemberUpdate> = {
  name: Events.GuildMemberUpdate,
  async execute(oldMember, newMember) {
    const lng = getGuildLanguage(newMember.guild.id);

    if (oldMember.nickname !== newMember.nickname) {
      const embed = createLogEmbed(
        t("logs.nickname_updated", { lng }),
        t("logs.nickname_updated_desc", {
          lng,
          member: newMember.toString(),
          tag: newMember.user.tag,
          old: oldMember.nickname || "*None*",
          new: newMember.nickname || "*None*"
        }),
        0x3498db // Blue
      );
      await sendLog(newMember.guild.id, LogEvent.MEMBER_UPDATE, embed, newMember.client);
    }

    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    if (oldRoles.size !== newRoles.size) {
      const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
      const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));

      if (addedRoles.size > 0 || removedRoles.size > 0) {
        let description = t("logs.roles_updated_desc", {
          lng,
          member: newMember.toString(),
          tag: newMember.user.tag
        });

        if (addedRoles.size > 0) {
          description += t("logs.added_roles", {
            lng,
            roles: addedRoles.map(r => r.name).join(", ")
          });
        }
        if (removedRoles.size > 0) {
          description += t("logs.removed_roles", {
            lng,
            roles: removedRoles.map(r => r.name).join(", ")
          });
        }

        const embed = createLogEmbed(
          t("logs.roles_updated", { lng }),
          description,
          0x3498db // Blue
        );
        await sendLog(newMember.guild.id, LogEvent.MEMBER_UPDATE, embed, newMember.client);
      }
    }
  }
}

export const banAddEvent: Event<Events.GuildBanAdd> = {
  name: Events.GuildBanAdd,
  async execute(ban) {
    const lng = getGuildLanguage(ban.guild.id);
    const embed = createLogEmbed(
      t("logs.member_banned", { lng }),
      t("logs.member_banned_desc", {
        lng,
        user: ban.user.tag,
        id: ban.user.id,
        reason: ban.reason || t("common.no_reason", { lng })
      }),
      0xe74c3c // Red
    );
    await sendLog(ban.guild.id, LogEvent.GUILD_BAN_ADD, embed, ban.client);
  }
}

export const banRemoveEvent: Event<Events.GuildBanRemove> = {
  name: Events.GuildBanRemove,
  async execute(ban) {
    const lng = getGuildLanguage(ban.guild.id);
    const embed = createLogEmbed(
      t("logs.member_unbanned", { lng }),
      t("logs.member_unbanned_desc", { lng, user: ban.user.tag, id: ban.user.id }),
      0x2ecc71 // Green
    );
    await sendLog(ban.guild.id, LogEvent.GUILD_BAN_REMOVE, embed, ban.client);
  }
}
