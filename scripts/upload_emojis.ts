import { Client, GatewayIntentBits } from "discord.js";
import { env } from "../src/shared/lib/env";
import { readFileSync } from "fs";
import { Rarity } from "../src/features/gacha/lib/gacha";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

await client.login(env.DISCORD_TOKEN);

client.once("ready", async () => {
  const guild = await client.guilds.fetch(env.GUILD_ID);
  if (!guild) {
    console.error("Guild not found!");
    process.exit(1);
  }

  console.log(`Connected to guild: ${guild.name}`);
  const results: Record<string, string> = {};

  for (const rarity of Object.values(Rarity)) {
    const name = `kagami_${rarity.toLowerCase()}`;
    const file = readFileSync(`assets/png/${rarity.toLowerCase()}.png`);
    
    // Check if emoji already exists
    let emoji = guild.emojis.cache.find(e => e.name === name);
    if (!emoji) {
      console.log(`Uploading ${name}...`);
      emoji = await guild.emojis.create({ attachment: file, name });
    } else {
      console.log(`${name} already exists.`);
    }
    
    results[rarity] = `<:${emoji.name}:${emoji.id}>`;
  }

  console.log("--- EMOJI MAPPING ---");
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
});
