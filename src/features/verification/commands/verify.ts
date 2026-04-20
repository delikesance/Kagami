import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType, 
  MessageFlags, 
  PermissionFlagsBits, 
  SlashCommandBuilder 
} from "discord.js";
import type { Command } from "../../../shared/types/command";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";
import db from "../../../shared/lib/db";
import { t } from "../../../shared/lib/i18n";

export const verifyCommand: Command = {
  category: "Configuration",
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Configure the server verification system")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub => 
      sub.setName("setup")
        .setDescription("Automatically setup roles and verification channel")
    ),

  async execute(interaction, locale) {
    const subcommand = interaction.options.getSubcommand();
    const guild = interaction.guild!;

    if (subcommand === "setup") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      try {
        // 0. Cleanup existing setup
        const existingConfig = db.query("SELECT role_id, channel_id FROM verification_configs WHERE guild_id = ?").get(guild.id) as { role_id: string, channel_id: string } | null;
        
        if (existingConfig) {
          if (existingConfig.role_id) {
            try {
              const role = await guild.roles.fetch(existingConfig.role_id);
              if (role) await role.delete();
            } catch (e) {}
          }
          if (existingConfig.channel_id) {
            try {
              const channel = await guild.channels.fetch(existingConfig.channel_id);
              if (channel) await channel.delete();
            } catch (e) {}
          }
        }

        // 1. Create Role
        const roleName = t("commands.verification.role_name", locale);
        const verifiedRole = await guild.roles.create({
          name: roleName,
          reason: "Kagami Verification System Setup",
          color: "#2ecc71"
        });

        // 2. Create Channel (Allow SendMessages for unverified)
        const channelName = t("commands.verification.channel_name", locale);
        const verifyChannel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: guild.id, // @everyone
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
              deny: [PermissionFlagsBits.ReadMessageHistory] // Optional: prevent seeing other attempts
            },
            {
              id: verifiedRole.id,
              deny: [PermissionFlagsBits.ViewChannel] 
            }
          ]
        });

        // 3. NUCLEAR SETUP: Configure all other channels
        const channels = await guild.channels.fetch();
        for (const [_, channel] of channels) {
            if (!channel || channel.id === verifyChannel.id) continue;
            try {
                await channel.permissionOverwrites.edit(guild.id, { ViewChannel: false });
                await channel.permissionOverwrites.edit(verifiedRole.id, { ViewChannel: true });
            } catch (e) {}
        }

        db.prepare(`
          INSERT INTO verification_configs (guild_id, role_id, channel_id, enabled)
          VALUES (?, ?, ?, 1)
          ON CONFLICT(guild_id) DO UPDATE SET role_id = excluded.role_id, channel_id = excluded.channel_id, enabled = 1
        `).run(guild.id, verifiedRole.id, verifyChannel.id);

        const embed = new KagamiEmbedBuilder()
          .setTitle(t("commands.verification.verify_embed_title", locale))
          .setDescription(t("commands.verification.verify_embed_desc", locale, { guild: guild.name }));

        const button = new ButtonBuilder()
          .setCustomId("verify_start")
          .setLabel(t("commands.verification.verify_button_label", locale))
          .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

        await verifyChannel.send({ embeds: [embed], components: [row] });

        await interaction.editReply({
          embeds: [new KagamiEmbedBuilder("success")
            .setDescription(t("commands.verification.setup_success", locale, { role: verifiedRole.name, channel: verifyChannel.name }))]
        });

      } catch (error) {
        console.error("[VERIFICATION] Setup error:", error);
        await interaction.editReply({
          embeds: [KagamiEmbedBuilder.error("An error occurred during nuclear setup.")]
        });
      }
    }
  }
};
