import { Events, type Message } from "discord.js";
import type { Event } from "../../../shared/types/event";
import { addXP } from "../lib/xp";
import { KagamiEmbedBuilder } from "../../../shared/lib/embed";

export const xpMessageEvent: Event<Events.MessageCreate> = {
  name: Events.MessageCreate,
  async execute(message: Message) {
    if (message.author.bot || !message.guild) return;

    const result = await addXP(message.guild.id, message.author.id);

    if (result?.leveledUp) {
      const embed = new KagamiEmbedBuilder("success")
        .setTitle("🌸 Level Up!")
        .setDescription(`Félicitations **${message.author.username}**, tu es passé au niveau **${result.newLevel}** !`)
        .setThumbnail(message.author.displayAvatarURL());

      await message.channel.send({ content: `<@${message.author.id}>`, embeds: [embed] });
    }
  }
};
