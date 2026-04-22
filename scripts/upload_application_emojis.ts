import { Client, GatewayIntentBits } from "discord.js";
import { env } from "../src/shared/lib/env";
import { readFileSync } from "fs";
import { Rarity } from "../src/features/gacha/lib/gacha";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

await client.login(env.DISCORD_TOKEN);

client.once("ready", async () => {
  console.log(`Logged in as ${client.user?.tag}`);
  
  if (!client.application) {
    console.error("Application not found!");
    process.exit(1);
  }

  console.log("Fetching current Application Emojis...");
  const currentEmojis = await client.application.emojis.fetch();
  
  const results: Record<string, string> = {};

  for (const rarity of Object.values(Rarity)) {
    const name = `kagami_${rarity.toLowerCase()}`;
    const file = readFileSync(`assets/png/${rarity.toLowerCase()}.png`);
    
    let emoji = currentEmojis.find(e => e.name === name);
    
    if (!emoji) {
      console.log(`Uploading Application Emoji: ${name}...`);
      emoji = await client.application.emojis.create({ attachment: file, name });
    } else {
      console.log(`Application Emoji ${name} already exists.`);
    }
    
    results[rarity] = `<:${emoji.name}:${emoji.id}>`;
  }

  console.log("--- PERMANENT APPLICATION EMOJI MAPPING ---");
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
});
