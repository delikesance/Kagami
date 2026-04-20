export const embedConfig = {
  colors: {
    info: 0x3498db,
    success: 0x2ecc71,
    warning: 0xf1c40f,
    error: 0xe74c3c,
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

    this.setFooter({ text: "made with ❤️ by Delikesance" })
    this.setTimestamp()
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
