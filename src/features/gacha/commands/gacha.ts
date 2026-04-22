import { 
  SlashCommandBuilder, 
  type ChatInputCommandInteraction, 
  EmbedBuilder, 
  PermissionFlagsBits, 
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from "discord.js";
import type { Command } from "../../../shared/types/command";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";
import { 
  ROLL_COST, 
  getEconomy, addShards, 
  rollUser, claimUser, getRarityEmoji, getRarityColor,
  likeUser, getGachaProfile, getInventory, registerUser,
  generateGachaCard, getRarity, Rarity, type GachaUser
} from "../lib/gacha";
import { sellCard, sellAllByRarity } from "../lib/sell";
import { addMarketListing, buyMarketListing, getMarketListings, removeMarketListing } from "../lib/market";
import { executeTrade, checkTradeValidity } from "../lib/trade";

export const gachaCommand: Command = {
  category: "Gacha",
  data: new SlashCommandBuilder()
    .setName("gacha")
    .setDescription("The Kagami Collection System")
    .addSubcommand(sub => 
      sub.setName("roll")
         .setDescription(`Roll users (Cost: ${ROLL_COST} shards each)`)
         .addIntegerOption(opt => 
           opt.setName("amount")
              .setDescription("Number of rolls (max 10)")
              .setMinValue(1)
              .setMaxValue(10)
         )
    )
    .addSubcommand(sub => 
      sub.setName("like")
         .setDescription("Like a user to increase their rarity (can only like each person once)")
         .addUserOption(opt => opt.setName("user").setDescription("The user to like").setRequired(true))
    )
    .addSubcommand(sub => 
      sub.setName("search")
         .setDescription("Search a user's collection value")
         .addUserOption(opt => opt.setName("user").setDescription("The user to search").setRequired(true))
    )
    .addSubcommand(sub => 
      sub.setName("collection")
         .setDescription("View your collection or someone else's")
         .addUserOption(opt => opt.setName("user").setDescription("The user to view"))
    )
    .addSubcommand(sub => 
      sub.setName("sell")
         .setDescription("Sell a specific card from your collection")
         .addUserOption(opt => opt.setName("user").setDescription("The card to sell").setRequired(true))
         .addIntegerOption(opt => opt.setName("quantity").setDescription("Number of copies to sell").setMinValue(1))
    )
    .addSubcommand(sub => 
      sub.setName("sell-all")
         .setDescription("Sell all cards of a specific rarity")
         .addStringOption(opt => 
           opt.setName("rarity")
              .setDescription("The rarity to sell")
              .setRequired(true)
              .addChoices(
                { name: "Common", value: "COMMON" },
                { name: "Rare", value: "RARE" },
                { name: "Epic", value: "EPIC" },
                { name: "Legendary", value: "LEGENDARY" }
              )
         )
    )
    .addSubcommand(sub => 
      sub.setName("market-list")
         .setDescription("View active market listings")
         .addIntegerOption(opt => opt.setName("page").setDescription("Page number").setMinValue(1))
    )
    .addSubcommand(sub => 
      sub.setName("market-sell")
         .setDescription("List a card on the market for Shards")
         .addUserOption(opt => opt.setName("card").setDescription("Card to sell").setRequired(true))
         .addIntegerOption(opt => opt.setName("price").setDescription("Price in shards").setRequired(true).setMinValue(1))
         .addIntegerOption(opt => opt.setName("quantity").setDescription("Quantity to sell").setMinValue(1))
    )
    .addSubcommand(sub => 
      sub.setName("market-buy")
         .setDescription("Buy a listing from the market")
         .addIntegerOption(opt => opt.setName("id").setDescription("Listing ID").setRequired(true))
    )
    .addSubcommand(sub => 
      sub.setName("market-cancel")
         .setDescription("Cancel your own market listing")
         .addIntegerOption(opt => opt.setName("id").setDescription("Listing ID").setRequired(true))
    )
    .addSubcommand(sub => 
      sub.setName("trade")
         .setDescription("Propose a direct card trade with someone")
         .addUserOption(opt => opt.setName("user").setDescription("User to trade with").setRequired(true))
         .addUserOption(opt => opt.setName("give").setDescription("Card you give").setRequired(true))
         .addUserOption(opt => opt.setName("receive").setDescription("Card you want").setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    // Register the user executing the command
    registerUser(interaction.user);
    
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (subcommand === "sell") {
      const target = interaction.options.getUser("user", true);
      const quantity = interaction.options.getInteger("quantity") || 1;

      const totalValue = sellCard(userId, target.id, quantity);

      if (totalValue === null) {
        return interaction.reply({ content: `You don't have enough copies of **${target.username}** to sell.`, ephemeral: true });
      }

      const embed = new KagamiEmbedBuilder("success")
        .setTitle("Card(s) Sold")
        .setDescription(`You sold **${quantity}x ${target.username}** for **${totalValue} shards**!`);
      
      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === "sell-all") {
      const targetRarity = interaction.options.getString("rarity", true) as Rarity;
      const result = sellAllByRarity(userId, targetRarity);

      if (result.count === 0) {
        return interaction.reply({ content: `You don't have any **${targetRarity}** cards to sell.`, ephemeral: true });
      }

      const embed = new KagamiEmbedBuilder("success")
        .setTitle(`Bulk Sell: ${targetRarity}`)
        .setDescription(`You sold **${result.count}** cards for a total of **${result.value} shards**!`);
      
      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === "roll") {
      const amount = interaction.options.getInteger("amount") || 1;
      const totalCost = ROLL_COST * amount;

      const econ = getEconomy(userId);
      if (econ.shards < totalCost) {
        return interaction.reply({ 
          content: `You need **${totalCost} shards** to roll ${amount} time(s). You have **${econ.shards} shards**. Gagnez des niveaux pour obtenir plus de shards !`, 
          ephemeral: true 
        });
      }

      await interaction.deferReply();

      const rolls: GachaUser[] = [];
      for (let i = 0; i < amount; i++) {
        const pulledUser = rollUser();
        if (pulledUser) {
          claimUser(userId, pulledUser.id);
          rolls.push(pulledUser);
        }
      }

      if (rolls.length === 0) {
        return interaction.editReply({ content: "The user pool is currently empty. Chat more to populate it!" });
      }

      // Sort rolls by rarity so rarer cards appear last (Common < Rare < Epic < Legendary)
      const rarityOrder = {
        [Rarity.COMMON]: 0,
        [Rarity.RARE]: 1,
        [Rarity.EPIC]: 2,
        [Rarity.LEGENDARY]: 3
      };
      rolls.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

      // Deduct shards once
      addShards(userId, -totalCost);

      let currentIndex = 0;

      const generateResponse = async (index: number) => {
        const pulledUser = rolls[index];
        let avatarUrl = "https://cdn.discordapp.com/embed/avatars/0.png";
        try {
          const discordUser = await interaction.client.users.fetch(pulledUser.id);
          avatarUrl = discordUser.displayAvatarURL({ extension: "png", size: 512 });
        } catch (e) {}

        const cardBuffer = await generateGachaCard(pulledUser, avatarUrl);
        const attachment = new AttachmentBuilder(cardBuffer, { name: `gacha-${pulledUser.id}-${index}.png` });

        const embed = new EmbedBuilder()
          .setImage(`attachment://gacha-${pulledUser.id}-${index}.png`)
          .setColor(getRarityColor(pulledUser.rarity))
          .setFooter({ text: `Card ${index + 1}/${rolls.length} • Spent ${totalCost} shards` });

        const row = new ActionRowBuilder<ButtonBuilder>();
        
        if (rolls.length > 1) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId("prev")
              .setLabel("⬅️")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(index === 0),
            new ButtonBuilder()
              .setCustomId("next")
              .setLabel("➡️")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(index === rolls.length - 1)
          );
        }

        return { 
          embeds: [embed], 
          files: [attachment], 
          components: rolls.length > 1 ? [row] : [] 
        };
      };

      const initialResponse = await generateResponse(0);
      const message = await interaction.editReply(initialResponse);

      if (rolls.length > 1) {
        const collector = message.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 60000,
        });

        collector.on("collect", async (i) => {
          if (i.user.id !== interaction.user.id) {
            return i.reply({ content: "This is not your gacha result!", ephemeral: true });
          }

          if (i.customId === "prev") currentIndex--;
          if (i.customId === "next") currentIndex++;

          await i.deferUpdate();
          const updatedResponse = await generateResponse(currentIndex);
          await interaction.editReply(updatedResponse);
        });

        collector.on("end", () => {
          interaction.editReply({ components: [] }).catch(() => {});
        });
      }
      return;
    }

    if (subcommand === "like") {
      const targetUser = interaction.options.getUser("user", true);
      if (targetUser.bot) {
        return interaction.reply({ content: "You cannot like bots.", ephemeral: true });
      }
      
      registerUser(targetUser);

      const success = likeUser(userId, targetUser.id);
      if (!success) {
        return interaction.reply({ content: "You have already liked this user!", ephemeral: true });
      }

      const profile = getGachaProfile(targetUser.id);
      const embed = new KagamiEmbedBuilder("success")
        .setTitle("Liked!")
        .setDescription(`You liked **${targetUser.username}**!\nThey now have **${profile?.likes} likes** and are **${profile?.rarity}** ${getRarityEmoji(profile?.rarity as any)}.`);
      
      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === "search") {
      const targetUser = interaction.options.getUser("user", true);
      if (targetUser.bot) {
        return interaction.reply({ content: "Bots are not in the gacha pool.", ephemeral: true });
      }

      registerUser(targetUser);
      const profile = getGachaProfile(targetUser.id);

      if (!profile) {
         return interaction.reply({ content: "Could not fetch profile.", ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(getRarityColor(profile.rarity))
        .setTitle(`Gacha Profile: ${targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: "Rarity", value: `${getRarityEmoji(profile.rarity)} ${profile.rarity}`, inline: true },
          { name: "Likes", value: `${profile.likes}`, inline: true }
        );

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === "collection") {
      const targetUser = interaction.options.getUser("user") || interaction.user;
      const inv = getInventory(targetUser.id);
      const profile = getGachaProfile(targetUser.id);

      const embed = new KagamiEmbedBuilder("info")
        .setTitle(`${targetUser.username}'s Collection`)
        .setThumbnail(targetUser.displayAvatarURL());

      let description = "";
      
      if (profile) {
        description += `**Current Status**\n${getRarityEmoji(profile.rarity)}**${profile.rarity}** (${profile.likes} loves)\n\n`;
      }

      description += `**Inventory**\n`;

      if (inv.length === 0) {
        description += `${targetUser.username} has not collected any users yet.`;
      } else {
        const displayInv = inv.slice(0, 15);
        description += displayInv.map(i => {
           const rarity = getRarity(i.likes);
           return `${getRarityEmoji(rarity)}**${i.username}** (x${i.quantity})`;
        }).join("\n");

        let footer = `Total unique cards: ${inv.length}`;
        if (inv.length > 15) footer += ` (Showing first 15)`;
        embed.setFooter({ text: footer });
      }

      embed.setDescription(description);
      return interaction.reply({ embeds: [embed] });
    }
    if (subcommand === "market-sell") {
      const cardUser = interaction.options.getUser("card", true);
      const price = interaction.options.getInteger("price", true);
      const quantity = interaction.options.getInteger("quantity") || 1;

      if (cardUser.bot) return interaction.reply({ content: "Bots cannot be sold.", ephemeral: true });

      const success = addMarketListing(userId, cardUser.id, price, quantity);
      if (!success) {
        return interaction.reply({ content: `You don't have enough copies of **${cardUser.username}** to sell.`, ephemeral: true });
      }

      return interaction.reply({ 
        embeds: [new KagamiEmbedBuilder("success").setTitle("Market Listing Created").setDescription(`You listed **${quantity}x ${cardUser.username}** for **${price} shards**.`)]
      });
    }

    if (subcommand === "market-cancel") {
      const listingId = interaction.options.getInteger("id", true);
      const success = removeMarketListing(userId, listingId);
      
      if (!success) {
        return interaction.reply({ content: "Listing not found or you don't own it.", ephemeral: true });
      }

      return interaction.reply({ content: `Listing #${listingId} cancelled. Cards returned to your inventory.`, ephemeral: true });
    }

    if (subcommand === "market-buy") {
      const listingId = interaction.options.getInteger("id", true);
      const result = buyMarketListing(userId, listingId);
      
      if (!result.success) {
        return interaction.reply({ content: result.message, ephemeral: true });
      }

      return interaction.reply({ embeds: [new KagamiEmbedBuilder("success").setTitle("Purchase Successful").setDescription(result.message)] });
    }

    if (subcommand === "market-list") {
      let page = interaction.options.getInteger("page") || 1;
      const limit = 10;
      
      const generateEmbed = (p: number) => {
        const { listings, totalPages } = getMarketListings(p, limit);
        const embed = new KagamiEmbedBuilder("info").setTitle("Gacha Market").setFooter({ text: `Page ${p}/${totalPages}` });
        
        if (listings.length === 0) {
          embed.setDescription("The market is currently empty.");
        } else {
          const desc = listings.map(l => {
            return `**#${l.id}** | ${getRarityEmoji(l.rarity)} **${l.card_name}** (x${l.quantity})\n💰 **${l.price} shards** • Sold by ${l.seller_name}`;
          }).join("\n\n");
          embed.setDescription(desc);
        }
        return { embed, totalPages };
      };

      let current = generateEmbed(page);
      
      const row = new ActionRowBuilder<ButtonBuilder>();
      if (current.totalPages > 1) {
        row.addComponents(
          new ButtonBuilder().setCustomId("market_prev").setLabel("⬅️").setStyle(ButtonStyle.Secondary).setDisabled(page === 1),
          new ButtonBuilder().setCustomId("market_next").setLabel("➡️").setStyle(ButtonStyle.Secondary).setDisabled(page === current.totalPages)
        );
      }

      const msg = await interaction.reply({ embeds: [current.embed], components: row.components.length > 0 ? [row] : [], fetchReply: true });

      if (current.totalPages > 1) {
        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });
        collector.on("collect", async (i) => {
          if (i.user.id !== userId) return i.reply({ content: "Not your menu.", ephemeral: true });
          if (i.customId === "market_prev") page--;
          if (i.customId === "market_next") page++;
          
          current = generateEmbed(page);
          row.components[0].setDisabled(page === 1);
          row.components[1].setDisabled(page === current.totalPages);
          
          await i.update({ embeds: [current.embed], components: [row] });
        });
        collector.on("end", () => {
          interaction.editReply({ components: [] }).catch(() => {});
        });
      }
      return;
    }

    if (subcommand === "trade") {
      const targetUser = interaction.options.getUser("user", true);
      const giveCard = interaction.options.getUser("give", true);
      const receiveCard = interaction.options.getUser("receive", true);

      if (targetUser.bot || giveCard.bot || receiveCard.bot || targetUser.id === userId) {
        return interaction.reply({ content: "Invalid trade targets.", ephemeral: true });
      }

      const offer = { senderId: userId, receiverId: targetUser.id, giveCardId: giveCard.id, receiveCardId: receiveCard.id };
      const check = checkTradeValidity(offer);

      if (!check.valid) {
        return interaction.reply({ content: check.message || "Invalid trade.", ephemeral: true });
      }

      const embed = new KagamiEmbedBuilder("info")
        .setTitle("Trade Offer")
        .setDescription(`<@${userId}> wants to trade with <@${targetUser.id}>!\n\n**Offering:** ${giveCard.username}\n**Requesting:** ${receiveCard.username}`);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("trade_accept").setLabel("Accept").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("trade_decline").setLabel("Decline").setStyle(ButtonStyle.Danger)
      );

      const msg = await interaction.reply({ content: `<@${targetUser.id}>`, embeds: [embed], components: [row], fetchReply: true });

      const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });
      collector.on("collect", async (i) => {
        if (i.user.id !== targetUser.id) return i.reply({ content: "This trade is not for you.", ephemeral: true });

        if (i.customId === "trade_decline") {
          await i.update({ content: null, embeds: [new KagamiEmbedBuilder("error").setTitle("Trade Declined").setDescription("The trade was declined.")], components: [] });
          collector.stop();
          return;
        }

        if (i.customId === "trade_accept") {
          const result = executeTrade(offer);
          if (result) {
            await i.update({ content: null, embeds: [new KagamiEmbedBuilder("success").setTitle("Trade Accepted").setDescription("The trade was successful!")], components: [] });
          } else {
            await i.update({ content: null, embeds: [new KagamiEmbedBuilder("error").setTitle("Trade Failed").setDescription("Someone no longer has the required cards.")], components: [] });
          }
          collector.stop();
        }
      });
      collector.on("end", (collected, reason) => {
        if (reason === "time") interaction.editReply({ components: [] }).catch(() => {});
      });
      return;
    }
  }
};
