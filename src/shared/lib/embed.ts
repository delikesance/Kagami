import { EmbedBuilder } from "discord.js";

export class KagamiEmbedBuilder extends EmbedBuilder {
  constructor(level?: "warning" | "error") {
    super()

    if (!level) this.setColor("Blue")
    if (level == "warning") this.setColor("Yellow")
    if (level == "error") this.setColor("Red")

    this.setFooter({ text: "Made with ❤️ by Delikesance" })
    this.setTimestamp()
  }

  static error(message: string) {
    return new this("error")
      .setDescription(`> ${message}`)
      .setTitle("❌ Error")
  }

  static warning(message: string) {
    return new this("warning")
      .setDescription(`> ${message}`)
      .setTitle("⚠️ Warning")
  }
}
