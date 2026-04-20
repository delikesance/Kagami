import { 
  Events, 
  AttachmentBuilder, 
  MessageFlags 
} from "discord.js";
import type { Event } from "../../../shared/types/event";
import db from "../../../shared/lib/db";
import { generateCaptchaImage, generateCaptchaText } from "../lib/captcha";
import { t } from "../../../shared/lib/i18n";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";

export const verificationInteractionEvent: Event<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    const guildId = interaction.guildId;
    if (!guildId) return;

    // Get User Locale
    const userConfigQuery = db.query("SELECT locale FROM user_configs WHERE user_id = ?");
    const userConfig = userConfigQuery.get(interaction.user.id) as { locale: string } | null;
    const locale = userConfig?.locale || interaction.locale || "en";

    // Handle Button Click (Start Verification)
    if (interaction.isButton() && interaction.customId === "verify_start") {
      const captchaText = generateCaptchaText();
      const captchaImage = await generateCaptchaImage(captchaText);
      const attachment = new AttachmentBuilder(captchaImage, { name: "captcha.png" });

      // Store pending answer
      db.prepare(`
        INSERT INTO pending_verifications (guild_id, user_id, answer, timestamp)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(guild_id, user_id) DO UPDATE SET answer = excluded.answer, timestamp = excluded.timestamp
      `).run(guildId, interaction.user.id, captchaText, Date.now());

      const embed = new KagamiEmbedBuilder()
        .setTitle(t("commands.verification.captcha_modal_title", locale))
        .setDescription(locale.startsWith("fr") 
            ? "Veuillez taper le code ci-dessous directement dans ce salon." 
            : "Please type the code below directly in this channel.")
        .setImage("attachment://captcha.png");

      await interaction.reply({
        embeds: [embed],
        files: [attachment],
        flags: MessageFlags.Ephemeral
      });
    }
  }
}
