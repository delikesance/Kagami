import { createCanvas, loadImage } from "@napi-rs/canvas";
import type { User } from "discord.js";
import { getXPToNextLevel } from "./xp";

export async function generateRankCard(user: User, xp: number, level: number) {
  const canvas = createCanvas(900, 250);
  const ctx = canvas.getContext("2d");

  const xpRequired = getXPToNextLevel(level);
  const progress = Math.min(Math.max(xp / xpRequired, 0), 1);

  // Background (bg0)
  ctx.fillStyle = "#282828";
  ctx.fillRect(0, 0, 900, 250);

  // Avatar with Gray border
  const avatarSize = 140;
  const avX = 50;
  const avY = (250 - avatarSize) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(avX + avatarSize / 2, avY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  const avatar = await loadImage(user.displayAvatarURL({ extension: "png", size: 256 }));
  ctx.drawImage(avatar, avX, avY, avatarSize, avatarSize);
  ctx.restore();

  ctx.strokeStyle = "#928374";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Username (fg)
  ctx.fillStyle = "#ebdbb2";
  ctx.font = "bold 35px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(user.username, 230, 90);

  // Level (Orange)
  ctx.fillStyle = "#fe8019";
  ctx.font = "bold 25px sans-serif";
  ctx.fillText(`Niveau ${level}`, 230, 130);

  // Progress Bar
  const barX = 230;
  const barY = 160;
  const barWidth = 600;
  const barHeight = 12;

  // Background bar (bg1)
  ctx.fillStyle = "#3c3836";
  ctx.beginPath();
  ctx.roundRect(barX, barY, barWidth, barHeight, 6);
  ctx.fill();

  // Progress bar (Aqua)
  ctx.fillStyle = "#8ec07c";
  ctx.beginPath();
  ctx.roundRect(barX, barY, barWidth * progress, barHeight, 6);
  ctx.fill();

  // XP Text (Gray)
  ctx.fillStyle = "#928374";
  ctx.font = "20px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${Math.floor(xp)} / ${xpRequired} XP`, barX + barWidth, barY + 45);

  return canvas.toBuffer("image/png");
}

export async function generateLeaderboardImage(guildName: string, topUsers: { username: string, level: number, xp: number }[]) {
  const canvas = createCanvas(800, 550);
  const ctx = canvas.getContext("2d");

  // Background (bg0)
  ctx.fillStyle = "#282828";
  ctx.fillRect(0, 0, 800, 550);

  // Header (fg)
  ctx.fillStyle = "#ebdbb2";
  ctx.font = "bold 35px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(guildName.toUpperCase(), 400, 70);
  
  ctx.fillStyle = "#8ec07c";
  ctx.font = "20px sans-serif";
  ctx.fillText("CLASSEMENT DE L'ACTIVITÉ", 400, 105);

  // User List
  const startY = 170;
  const rowHeight = 60;
  const rowSpacing = 10;

  topUsers.forEach((user, i) => {
    const y = startY + (rowHeight + rowSpacing) * i;
    
    // Row Background (bg1)
    ctx.fillStyle = "#3c3836";
    ctx.beginPath();
    ctx.roundRect(50, y, 700, rowHeight, 10);
    ctx.fill();

    // Rank # (Yellow for Top, Gray for others)
    ctx.textAlign = "left";
    ctx.fillStyle = i === 0 ? "#fabd2f" : "#928374";
    ctx.font = "bold 25px sans-serif";
    ctx.fillText(`#${i + 1}`, 80, y + 40);

    // Username (fg)
    ctx.fillStyle = "#ebdbb2";
    ctx.font = "22px sans-serif";
    ctx.fillText(user.username, 150, y + 40);

    // Level (Orange)
    ctx.textAlign = "right";
    ctx.fillStyle = "#fe8019";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(`Niveau ${user.level}`, 720, y + 40);
  });

  return canvas.toBuffer("image/png");
}
