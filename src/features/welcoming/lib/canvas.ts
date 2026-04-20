import { createCanvas, loadImage } from "@napi-rs/canvas";
import type { GuildMember } from "discord.js";

export async function generateWelcomeImage(member: GuildMember) {
  const canvas = createCanvas(1024, 450);
  const ctx = canvas.getContext("2d");

  // 1. Gruvbox bg0 Background
  ctx.fillStyle = "#282828";
  ctx.fillRect(0, 0, 1024, 450);

  // 2. Subtle Border (bg1)
  ctx.strokeStyle = "#3c3836";
  ctx.lineWidth = 20;
  ctx.strokeRect(0, 0, 1024, 450);

  // 3. Avatar with sharp circular crop
  const avatarSize = 200;
  const x = (canvas.width - avatarSize) / 2;
  const y = 50; // Moved up from 80

  ctx.save();
  ctx.beginPath();
  ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const avatar = await loadImage(member.user.displayAvatarURL({ extension: "png", size: 512 }));
  ctx.drawImage(avatar, x, y, avatarSize, avatarSize);
  ctx.restore();

  // Avatar Ring (Aqua)
  ctx.strokeStyle = "#8ec07c";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x + avatarSize / 2, y + avatarSize / 2, (avatarSize / 2) + 5, 0, Math.PI * 2);
  ctx.stroke();

  // 4. Typography
  ctx.textAlign = "center";

  // Welcome Text (fg / cream)
  ctx.fillStyle = "#ebdbb2";
  ctx.font = "bold 60px sans-serif";
  ctx.fillText("BIENVENUE", canvas.width / 2, 360); // Moved down from 340

  // Username (Aqua)
  ctx.fillStyle = "#8ec07c";
  ctx.font = "40px sans-serif";
  ctx.fillText(member.user.username, canvas.width / 2, 410); // Moved down from 395

  return canvas.toBuffer("image/png");
}
