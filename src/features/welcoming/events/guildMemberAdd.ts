import { AttachmentBuilder, type GuildMember, type SendableChannels } from "discord.js";
import { KagamiEmbedBuilder } from "../../../lib/embed";
import { generateWelcomeImage } from "../lib/canvas";

const WELCOME_MESSAGES = [
  "Welcome to the club, {member}! Glad you're here. You are our {count}th member!",
  "A wild {member} appeared! Welcome to {guild}. You're member #{count}!",
  "Welcome {member}! We've been expecting you. Glad to have you as member #{count}!",
  "Hey {member}, welcome to the family! You are member #{count}!",
  "Glad you could make it, {member}! You're our {count}th member!",
  "Welcome {member}! Hope you brought snacks for the other {count} members!",
  "Look who joined! It's {member}! Welcome to the server (Member #{count})!",
  "Welcome to {guild}, {member}! Make yourself at home with our {count} members.",
  "Welcome {member}! The party just got better with you being member #{count}!",
  "Hello {member}! Great to have you as our {count}th member.",
  "Welcome {member}! We hope you enjoy your stay. You're member #{count}!",
  "Yay, {member} is here! Welcome to the server. (Member #{count})",
  "Welcome {member}! Take a seat and enjoy the vibes with member #{count}!",
  "High five, {member}! Welcome to {guild}. You're member #{count}!",
  "Welcome {member}! You're our {count}th member! Tell us a bit about yourself.",
  "Welcome aboard, {member}! Glad to have you as member #{count}!",
  "Nice to meet you, {member}! Welcome to {guild} (Member #{count}).",
  "Welcome {member}! Feel free to look around. You're member #{count}!",
  "Welcome {member}! You're just in time to be our {count}th member!",
  "New member alert: {member}! Welcome! You are member #{count}!"
];

export async function sendWelcomeMessage(member: GuildMember, welcomeChannel: SendableChannels) {
  const imageBuffer = await generateWelcomeImage(member);
  const attachment = new AttachmentBuilder(imageBuffer, { name: "welcome.png" });

  const randomBase = WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
  const message = randomBase
    .replace("{member}", member.toString())
    .replace("{guild}", member.guild.name)
    .replace("{count}", member.guild.memberCount.toString());

  const embed = new KagamiEmbedBuilder()
    .setTitle(`Welcome to ${member.guild.name}!`)
    .setDescription(message)
    .setImage("attachment://welcome.png");

  welcomeChannel.send({ embeds: [embed], files: [attachment] })
}
