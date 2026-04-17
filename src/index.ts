import { Client, Collection, Events, GatewayIntentBits, MessageFlags, REST, Routes, type ClientOptions, type SendableChannels } from "discord.js";
import type { Command } from "./types/command";
import { env } from "./lib/env";
import db from "./lib/db";

import { pingCommand } from "./commands/ping";
import { avatarCommand } from "./commands/avatar";
import { bannerCommand } from "./commands/banner";
import { clearCommand } from "./commands/clear";
import { welcomingCommand } from "./features/welcoming/commands/welcoming";
import { sendWelcomeMessage } from "./features/welcoming/events/guildMemberAdd";

class Bot extends Client {
  public commands = new Collection<string, Command>()

  constructor(options: ClientOptions) {
    super(options)
  }

  async loadCommands() {
    this.commands.set(pingCommand.data.name, pingCommand)
    this.commands.set(avatarCommand.data.name, avatarCommand)
    this.commands.set(bannerCommand.data.name, bannerCommand)
    this.commands.set(clearCommand.data.name, clearCommand)
    this.commands.set(welcomingCommand.data.name, welcomingCommand)
  }
}

const bot = new Bot({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
})

await bot.loadCommands()

bot.once(Events.ClientReady, async (client) => {
  console.log(`[OK] Logged in as ${client.user.tag}`)
})

bot.on(Events.GuildMemberAdd, async (member) => {
  const query = db.query("SELECT welcome_channel_id FROM guild_configs WHERE guild_id = ?");
  const result = query.get(member.guild.id) as { welcome_channel_id: string } | null;

  if (result?.welcome_channel_id) {
    try {
      const channel = await member.guild.channels.fetch(result.welcome_channel_id);
      if (channel && channel.isSendable()) {
        await sendWelcomeMessage(member, channel as SendableChannels);
      }
    } catch (error) {
      console.error(`[ERROR] Failed to fetch welcome channel for guild ${member.guild.id}:`, error);
    }
  }
});


async function loadCommandJSON() {
  return bot.commands.map(c => c.data.toJSON())
}

const commands = await loadCommandJSON()
const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN)

try {
  console.log(`[DEPLOY] Started refreshing ${commands.length} application command(s).`)

  const data = await rest.put(
    Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID),
    { body: commands },
  )

  console.log(
    `[DEPLOY] Successfully reloaded ${Array.isArray(data) ? data.length : commands.length
    } application command(s).`,
  )
} catch (error) {
  console.error("[DEPLOY] Failed to deploy commands:", error)
  process.exit(1)
}


bot.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  const command = bot.commands.get(interaction.commandName)

  if (!command) {
    if (interaction.replied || interaction.deferred) return

    await interaction.reply({
      content: "This command is not available right now.",
      flags: MessageFlags.Ephemeral
    })

    return
  }

  await command.execute(interaction)
})

await bot.login(env.DISCORD_TOKEN)
