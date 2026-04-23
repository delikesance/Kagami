import { Client, GatewayIntentBits } from "discord.js";
import { env } from "../src/shared/lib/env";
import { readFileSync } from "fs";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log('Bot logged in. Attempting to send devlog...');
  try {
    const channel = await client.channels.fetch('1496236144646553620');
    if (channel && channel.isTextBased()) {
      const devlogContent = readFileSync('./DEVLOG.md', 'utf-8');
      
      const chunks = [];
      for (let i = 0; i < devlogContent.length; i += 1900) {
        chunks.push(devlogContent.substring(i, i + 1900));
      }
      
      await channel.send("📝 **New Devlog - Domain Resonance Implementation:**");
      for (const chunk of chunks) {
        await channel.send("```md\n" + chunk + "\n```");
      }
      
      console.log('Devlog sent successfully!');
    } else {
      console.error('Channel not found or is not text-based.');
    }
  } catch (error) {
    console.error('Error sending devlog:', error);
  } finally {
    client.destroy();
    process.exit(0);
  }
});

client.login(env.DISCORD_TOKEN).catch(err => {
    console.error("Failed to login:", err);
    process.exit(1);
});
