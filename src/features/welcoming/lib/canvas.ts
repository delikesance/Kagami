import { createCanvas, loadImage } from "@napi-rs/canvas";
import type { GuildMember } from "discord.js";

export async function generateWelcomeImage(member: GuildMember) {
  const canvas = createCanvas(1024, 450);
  const ctx = canvas.getContext("2d");

  // Sleek Dark Background
  ctx.fillStyle = "#111111"; 
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Big Avatar on the left
  const avatarSize = 300;
  const x = 75;
  const y = (canvas.height - avatarSize) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const avatar = await loadImage(member.user.displayAvatarURL({ extension: "png", size: 512 }));
  ctx.drawImage(avatar, x, y, avatarSize, avatarSize);
  ctx.restore();

  // Clean Typography on the right
  ctx.textAlign = "left";
  ctx.fillStyle = "#FFFFFF";
  
  ctx.font = "bold 60px sans-serif";
  ctx.fillText("WELCOME", 450, 210);

  ctx.font = "45px sans-serif";
  ctx.fillStyle = "#AAAAAA";
  ctx.fillText(member.user.username, 450, 270);

  return canvas.toBuffer("image/png");
}
