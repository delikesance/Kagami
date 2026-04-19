import { Client, Collection, Events, GatewayIntentBits, MessageFlags, REST, Routes, type ClientOptions, type SendableChannels } from "discord.js";
import type { Command } from "./shared/types/command";
import { env } from "./shared/lib/env";
import db from "./shared/lib/db";

import { pingCommand } from "./features/utility/commands/ping";
import { avatarCommand } from "./features/information/commands/avatar";
import { bannerCommand } from "./features/information/commands/banner";
import { clearCommand } from "./features/moderation/commands/clear";
import { welcomingCommand } from "./features/welcoming/commands/welcoming";
import { configCommand } from "./features/logging/commands/config";
import { sendWelcomeMessage } from "./features/welcoming/events/guildMemberAdd";
import { LogEvent, createLogEmbed, sendLog } from "./features/logging/lib/logger";

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
    this.commands.set(configCommand.data.name, configCommand)
  }
}

const bot = new Bot({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
})

await bot.loadCommands()

bot.once(Events.ClientReady, async (client) => {
  console.log(`[OK] Logged in as ${client.user.tag}`)
})

bot.on(Events.GuildMemberAdd, async (member) => {
  // Welcoming
  const welcomeQuery = db.query("SELECT welcome_channel_id FROM guild_configs WHERE guild_id = ?");
  const welcomeResult = welcomeQuery.get(member.guild.id) as { welcome_channel_id: string } | null;

  if (welcomeResult?.welcome_channel_id) {
    try {
      const channel = await member.guild.channels.fetch(welcomeResult.welcome_channel_id);
      if (channel && channel.isSendable()) {
        await sendWelcomeMessage(member, channel as SendableChannels);
      }
    } catch (error) {
      console.error(`[ERROR] Failed to fetch welcome channel for guild ${member.guild.id}:`, error);
    }
  }

  // Logging
  const embed = createLogEmbed(
    "Member Joined",
    `${member} (${member.user.tag}) has joined the server.`,
    0x2ecc71 // Green
  ).setThumbnail(member.user.displayAvatarURL());

  await sendLog(member.guild.id, LogEvent.MEMBER_JOIN, embed, bot);
});

bot.on(Events.GuildMemberRemove, async (member) => {
  const embed = createLogEmbed(
    "Member Left",
    `${member.user.tag} has left the server.`,
    0xe74c3c // Red
  ).setThumbnail(member.user.displayAvatarURL());

  await sendLog(member.guild.id, LogEvent.MEMBER_LEAVE, embed, bot);
});

bot.on(Events.MessageDelete, async (message) => {
  if (message.partial || !message.guildId || message.author?.bot) return;

  const embed = createLogEmbed(
    "Message Deleted",
    `**Author:** ${message.author} (${message.author.tag})\n**Channel:** ${message.channel}\n\n**Content:**\n${message.content || "*No content*"}`,
    0xe74c3c // Red
  );

  await sendLog(message.guildId, LogEvent.MESSAGE_DELETE, embed, bot);
});

bot.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
  if (oldMessage.partial || newMessage.partial || !oldMessage.guildId || oldMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return;

  const embed = createLogEmbed(
    "Message Updated",
    `**Author:** ${oldMessage.author} (${oldMessage.author.tag})\n**Channel:** ${oldMessage.channel}\n[Jump to message](${newMessage.url})`,
    0x3498db // Blue
  )
    .addFields(
      { name: "Old Content", value: oldMessage.content || "*No content*" },
      { name: "New Content", value: newMessage.content || "*No content*" }
    );

  await sendLog(oldMessage.guildId, LogEvent.MESSAGE_UPDATE, embed, bot);
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
