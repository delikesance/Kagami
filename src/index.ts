import { Client, Collection, GatewayIntentBits, Partials, type ClientOptions } from "discord.js";
import { env } from "./shared/lib/env";
import { commands } from "./commands";
import { events } from "./events";
import { deployCommands } from "./shared/lib/deploy";
import type { Command } from "./shared/types/command";

/**
 * Kagami Bot Client
 */
export class Bot extends Client {
  public commands = new Collection<string, Command>();

  constructor(options: ClientOptions) {
    super(options);
  }

  /**
   * Initializes the bot by loading commands and events
   */
  async init() {
    this.loadCommands();
    this.loadEvents();
    
    await this.login(env.DISCORD_TOKEN);
    await deployCommands(commands);
  }

  private loadCommands() {
    for (const command of commands) {
      this.commands.set(command.data.name, command);
    }
  }

  private loadEvents() {
    for (const event of events) {
      if (event.once) {
        this.once(event.name, (...args) => event.execute(...args));
      } else {
        this.on(event.name, (...args) => event.execute(...args));
      }
    }
  }
}

const bot = new Bot({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.GuildMember,
    Partials.User
  ]
});

await bot.init();
