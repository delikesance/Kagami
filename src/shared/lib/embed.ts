export const embedConfig = {
  colors: {
    info: 0x8ec07c,    // Gruvbox Aqua
    success: 0xb8bb26, // Gruvbox Green
    warning: 0xfabd2f, // Gruvbox Yellow
    error: 0xfb4934,   // Gruvbox Red
  },
};
import { EmbedBuilder } from "discord.js";
export class KagamiEmbedBuilder extends EmbedBuilder {
  constructor(level?: "warning" | "error" | "info" | "success") {
    super()
    const colors = embedConfig.colors;
    
    if (level === "error") this.setColor(colors.error);
    else if (level === "warning") this.setColor(colors.warning);
    else if (level === "success") this.setColor(colors.success);
    else this.setColor(colors.info);

    this.setFooter({ text: "ＫＡＧＡＭＩ | Made with ❤️ by Delikesance" })
  }
  static error(message: string) {
    return new this("error")
      .setDescription(`> ${message}`)
      .setTitle("Error")
  }
  static warning(message: string) {
    return new this("warning")
      .setDescription(`> ${message}`)
      .setTitle("Warning")
  }
  static success(message: string) {
    return new this("success")
      .setDescription(`> ${message}`)
      .setTitle("Success")
  }
}
export default KagamiEmbedBuilder;
