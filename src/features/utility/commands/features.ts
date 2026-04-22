import { SlashCommandBuilder, type ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import type { Command } from "../../../shared/types/command";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";

export const featuresCommand: Command = {
  category: "Admin",
  data: new SlashCommandBuilder()
    .setName("features")
    .setDescription("Display a detailed guide of all bot features")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt => 
      opt.setName("language")
         .setDescription("The language of the guide")
         .addChoices(
           { name: "English", value: "en" },
           { name: "Français", value: "fr" }
         )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const lang = interaction.options.getString("language") || "en";

    const content = {
      en: {
        header: "✨ **Kagami Feature Guide**",
        how: "How it works",
        start: "Quick Start",
        features: [
          {
            title: "🌸 Levels & XP",
            description: "Engage your community with a dynamic leveling system.",
            howItWorks: "Users earn random XP (15-25) every minute they send a message. Gaining levels rewards them with **Gacha Shards**.",
            tutorial: "Use `/rank` to see your level and `/leaderboard` to see the top members."
          },
          {
            title: "🃏 Gacha Collection",
            description: "A cross-server trading card game where you collect members.",
            howItWorks: "Spend Shards to `/gacha roll` cards. Rarity is based on global 'Loves' market share. You can now sell cards for shards or trade with others!",
            tutorial: "Get shards via levels. Use `/gacha like @user` for rarity. Sell to bot via `/gacha sell`, to players via `/gacha market-sell`, or use `/gacha trade`."
          },
          {
            title: "✨ Reflections (Dynamic VCs)",
            description: "Clean up your voice channels with temporary, user-owned rooms.",
            howItWorks: "When a user joins a designated 'generator' channel, a private voice room is created for them and they are moved automatically.",
            tutorial: "Use `/reflection setup` to define the generator channel and the category for new rooms."
          },
          {
            title: "🛡️ Moderation & Automod",
            description: "Keep your server safe with automated and manual tools.",
            howItWorks: "The bot can filter blacklisted words and track user warnings.",
            tutorial: "Configure filters with `/automod`. Use `/warn` and `/warnings` to manage user behavior."
          },
          {
            title: "✅ Verification",
            description: "Protect your server from raids with a captcha system.",
            howItWorks: "New members must complete a verification process before gaining access to the server.",
            tutorial: "Use `/verify setup` to enable the system and choose the role given upon completion."
          },
          {
            title: "📜 Logging",
            description: "Track everything happening in your guild.",
            howItWorks: "Kagami logs message edits/deletions, member joins/leaves, and role/channel updates.",
            tutorial: "Use `/logs setup` to choose a logging channel and select which events to track."
          },
          {
            title: "👋 Welcoming",
            description: "Greet newcomers with beautiful Gruvbox-styled images.",
            howItWorks: "Every time a member joins, the bot generates a custom welcome card with their avatar.",
            tutorial: "Use `/welcoming setup` to set the welcome channel."
          }
        ]
      },
      fr: {
        header: "✨ **Guide des Fonctionnalités de Kagami**",
        how: "Fonctionnement",
        start: "Démarrage Rapide",
        features: [
          {
            title: "🌸 Niveaux & XP",
            description: "Animez votre communauté avec un système de progression dynamique.",
            howItWorks: "Les utilisateurs gagnent de l'XP aléatoire (15-25) chaque minute. Monter de niveau offre des **Shards Gacha**.",
            tutorial: "Utilisez `/rank` pour voir votre niveau et `/leaderboard` pour le classement."
          },
          {
            title: "🃏 Collection Gacha",
            description: "Un jeu de cartes à collectionner cross-serveur représentant les membres.",
            howItWorks: "Dépensez des Shards pour `/gacha roll`. La rareté dépend des 'Loves' globaux. Vendez vos cartes au marché ou échangez-les avec vos amis !",
            tutorial: "Gagnez des shards via les niveaux. `/gacha market-sell` pour vendre aux joueurs, `/gacha trade` pour échanger, ou `/gacha sell` pour vendre au bot."
          },
          {
            title: "✨ Reflections (Salons Vocaux)",
            description: "Gérez vos salons vocaux avec des salles temporaires automatiques.",
            howItWorks: "Rejoindre un salon 'générateur' crée instantanément une salle privée pour l'utilisateur.",
            tutorial: "Configurez avec `/reflection setup` (salon générateur et catégorie)."
          },
          {
            title: "🛡️ Modération & Automod",
            description: "Protégez votre serveur avec des outils automatisés.",
            howItWorks: "Le bot filtre les mots interdits et suit les avertissements des utilisateurs.",
            tutorial: "Configurez les filtres avec `/automod`. Gérez les comportements avec `/warn`."
          },
          {
            title: "✅ Vérification",
            description: "Évitez les raids avec un système de captcha.",
            howItWorks: "Les nouveaux membres doivent se vérifier pour accéder au reste du serveur.",
            tutorial: "Utilisez `/verify setup` pour activer le système et choisir le rôle de membre."
          },
          {
            title: "📜 Logs",
            description: "Gardez une trace de tout ce qui se passe sur votre serveur.",
            howItWorks: "Kagami log les messages modifiés/supprimés, les arrivées/départs, et les changements de rôles/salons.",
            tutorial: "Utilisez `/logs setup` pour choisir le salon et les événements à suivre."
          },
          {
            title: "👋 Bienvenue",
            description: "Accueillez les nouveaux avec des cartes graphiques stylées.",
            howItWorks: "Une image personnalisée avec l'avatar du membre est générée à chaque arrivée.",
            tutorial: "Configurez le salon avec `/welcoming setup`."
          }
        ]
      }
    };

    const t = (content as any)[lang];

    await interaction.reply({ content: t.header });

    for (const feature of t.features) {
      const embed = new KagamiEmbedBuilder("info")
        .setTitle(feature.title)
        .setDescription(feature.description)
        .addFields(
          { name: t.how, value: feature.howItWorks },
          { name: t.start, value: feature.tutorial }
        );

      await interaction.followUp({ embeds: [embed] });
    }
  }
};
