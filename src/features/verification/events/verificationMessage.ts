import { Events } from "discord.js";
import type { Event } from "../../../shared/types/event";
import db from "../../../shared/lib/db";
import { t } from "../../../shared/lib/i18n";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";

export const verificationMessageEvent: Event<Events.MessageCreate> = {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.guildId || message.author.bot) return;

    const guildId = message.guildId;
    const userId = message.author.id;

    // 1. Check if this channel is a verification channel
    const configQuery = db.query("SELECT channel_id, role_id FROM verification_configs WHERE guild_id = ?");
    const config = configQuery.get(guildId) as { channel_id: string, role_id: string } | null;

    if (!config || message.channelId !== config.channel_id) return;

    // 2. Check if user has a pending verification
    const pendingQuery = db.query("SELECT answer, attempts FROM pending_verifications WHERE guild_id = ? AND user_id = ?");
    const pending = pendingQuery.get(guildId, userId) as { answer: string, attempts: number } | null;

    if (!pending) {
        if (message.deletable) await message.delete().catch(() => {});
        return;
    }

    // 3. Process the answer
    const input = message.content.trim().toUpperCase();
    
    // Always delete the user's message immediately
    if (message.deletable) await message.delete().catch(() => {});

    const userConfigQuery = db.query("SELECT locale FROM user_configs WHERE user_id = ?");
    const userConfig = userConfigQuery.get(userId) as { locale: string } | null;
    const locale = userConfig?.locale || "en";

    if (input === pending.answer) {
      // Success!
      try {
        const member = await message.guild?.members.fetch(userId);
        await member?.roles.add(config.role_id);
        
        // Cleanup
        db.prepare("DELETE FROM pending_verifications WHERE guild_id = ? AND user_id = ?").run(guildId, userId);

        const successMsg = await message.channel.send({
          content: `<@${userId}>`,
          embeds: [new KagamiEmbedBuilder("success")
            .setTitle(t("commands.verification.captcha_success_title", locale))
            .setDescription(t("commands.verification.captcha_success_desc", locale))],
        });
        setTimeout(() => successMsg.delete().catch(() => {}), 5000);

      } catch (e) {
        console.error("[VERIFICATION] Role assignment error:", e);
      }
    } else {
      // Wrong answer
      const newAttempts = pending.attempts + 1;
      
      if (newAttempts >= 3) {
        // KICK
        try {
          const member = await message.guild?.members.fetch(userId);
          if (member && member.kickable) {
            // Attempt to DM the reason
            try {
              await member.send({
                embeds: [new KagamiEmbedBuilder("error")
                  .setTitle(t("commands.verification.captcha_error_title", locale))
                  .setDescription(t("commands.verification.captcha_kick_desc", locale))]
              });
            } catch (e) {}

            await member.kick(t("commands.verification.captcha_kick_desc", locale));
            db.prepare("DELETE FROM pending_verifications WHERE guild_id = ? AND user_id = ?").run(guildId, userId);
          }
        } catch (e) {
          console.error("[VERIFICATION] Kick error:", e);
        }
      } else {
        // Update attempts
        db.prepare("UPDATE pending_verifications SET attempts = ? WHERE guild_id = ? AND user_id = ?")
          .run(newAttempts, guildId, userId);

        const errorMsg = await message.channel.send({
          content: `<@${userId}>`,
          embeds: [new KagamiEmbedBuilder("error")
            .setTitle(t("commands.verification.captcha_error_title", locale))
            .setDescription(`${t("commands.verification.captcha_error_desc", locale)} (${newAttempts}/3)`)]
        });
        setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      }
    }
  }
}
