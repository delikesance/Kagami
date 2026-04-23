import { Events, type Message } from "discord.js";
import type { Event } from "../../../shared/types/event";
import { addXP } from "../lib/xp";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";
import { addShards, getDomainTierByLevel } from "../../gacha/lib/gacha";
import db from "../../../shared/lib/db";

export const xpMessageEvent: Event<Events.MessageCreate> = {
  name: Events.MessageCreate,
  async execute(message: Message) {
    if (message.author.bot || !message.guild) return;

    let multiplier = 1.0;
    
    // Check if message is inside a voice channel (Domain)
    if (message.channel.isVoiceBased()) {
      const activeReflection = db.query("SELECT tier_level FROM active_reflections WHERE channel_id = ?")
        .get(message.channel.id) as { tier_level: number } | undefined;
      
      if (activeReflection) {
        const tier = getDomainTierByLevel(activeReflection.tier_level);
        multiplier = tier.xpMultiplier;
        
        // Random shard drop chance for being active in a domain
        if (tier.shardChance > 0 && Math.random() < tier.shardChance) {
          const shardsFound = Math.floor(Math.random() * 11) + 10; // 10-20 shards
          addShards(message.author.id, shardsFound);
          await message.channel.send(`✨ **${message.author.username}** a trouvé **${shardsFound} shards** par terre dans ce domaine !`);
        }
      }
    }

    const result = await addXP(message.guild.id, message.author.id, multiplier);

    if (result?.leveledUp) {
      const shardReward = result.newLevel * 50;
      addShards(message.author.id, shardReward);

      const embed = new KagamiEmbedBuilder("success")
        .setTitle("🌸 Level Up!")
        .setDescription(`Félicitations **${message.author.username}**, tu es passé au niveau **${result.newLevel}** !\n\n✨ Tu as gagné **${shardReward} shards** pour le Gacha !`)
        .setThumbnail(message.author.displayAvatarURL());

      await message.channel.send({ content: `<@${message.author.id}>`, embeds: [embed] });
    }
  }
};