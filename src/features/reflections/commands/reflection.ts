import { ChannelType, PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../../shared/types/command";
import db from "../../../shared/lib/db";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";

export const reflectionCommand: Command = {
  category: "Configuration",
  data: new SlashCommandBuilder()
    .setName("reflection")
    .setDescription("Gérer les Salles de Réflexion (Salons Vocaux Dynamiques)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub
        .setName("setup")
        .setDescription("Configurer le salon générateur de Salles de Réflexion")
        .addChannelOption(opt =>
          opt
            .setName("channel")
            .setDescription("Le salon vocal qui servira de déclencheur")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildVoice)
        )
        .addChannelOption(opt =>
          opt
            .setName("category")
            .setDescription("La catégorie où les nouveaux salons seront créés")
            .setRequired(false)
            .addChannelTypes(ChannelType.GuildCategory)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const channel = interaction.options.getChannel("channel", true);
    const category = interaction.options.getChannel("category");

    db.prepare(
      `INSERT INTO reflection_configs (guild_id, generator_channel_id, category_id)
       VALUES (?, ?, ?)
       ON CONFLICT(guild_id) DO UPDATE SET 
        generator_channel_id = excluded.generator_channel_id,
        category_id = excluded.category_id`
    ).run(guildId, channel.id, category?.id || null);

    const embed = new KagamiEmbedBuilder("success")
      .setTitle("✨ Salles de Réflexion Configurer")
      .setDescription(`Désormais, quand un utilisateur rejoindra ${channel}, un salon privé sera créé pour lui.`);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
