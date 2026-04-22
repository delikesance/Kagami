import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import db from "../../../shared/lib/db";
import type { User } from "discord.js";

export const ROLL_COST = 100;

export enum Rarity {
  COMMON = "COMMON", // ⚪
  RARE = "RARE", // 🔵
  EPIC = "EPIC", // 🟣
  LEGENDARY = "LEGENDARY", // 🟡
}

export interface GachaUser {
  id: string;
  username: string;
  likes: number;
  rarity: Rarity;
}

export async function generateGachaCard(userData: GachaUser, avatarUrl: string) {
  const canvas = createCanvas(400, 600);
  const ctx = canvas.getContext("2d");

  const rarityColor = getRarityColorHex(userData.rarity);

  // 1. Background (Gruvbox bg0)
  ctx.fillStyle = "#282828";
  ctx.fillRect(0, 0, 400, 600);

  // 2. Decorative Grid
  ctx.strokeStyle = "rgba(235, 219, 178, 0.03)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 400; i += 30) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 600); ctx.stroke();
  }
  for (let i = 0; i < 600; i += 30) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(400, i); ctx.stroke();
  }

  // 3. Rarity Border
  ctx.strokeStyle = rarityColor;
  ctx.lineWidth = 15;
  ctx.strokeRect(0, 0, 400, 600);

  // 4. Avatar
  try {
    const avatar = await loadImage(avatarUrl);
    ctx.save();
    // Shadow for avatar
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 20;
    
    // Draw avatar in a square box
    const imgSize = 300;
    const x = (400 - imgSize) / 2;
    const y = 60;
    
    ctx.drawImage(avatar, x, y, imgSize, imgSize);
    
    // Sharp inner border for avatar
    ctx.strokeStyle = "#3c3836";
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, imgSize, imgSize);
    ctx.restore();
  } catch (e) {
    console.error("Failed to load avatar for card:", e);
  }

  // 5. Typography & Details
  ctx.textAlign = "center";

  // Name
  ctx.fillStyle = "#ebdbb2";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(userData.username.toUpperCase(), 200, 420);

  // Rarity Group (Icon + Text) Centering
  ctx.font = "bold 24px sans-serif";
  const textMetrics = ctx.measureText(userData.rarity);
  const gap = 8; // Reduced from 12
  const iconSize = 25; 
  const totalWidth = iconSize + gap + textMetrics.width;
  
  const centerX = 200;
  const centerY = 465;
  const startX = centerX - (totalWidth / 2);
  const badgePadding = 20;
  const badgeHeight = 44;

  // 1. Draw Rarity Badge Background
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.strokeStyle = rarityColor;
  ctx.lineWidth = 2;
  ctx.fillRect(startX - badgePadding, centerY - (badgeHeight / 2), totalWidth + (badgePadding * 2), badgeHeight);
  ctx.strokeRect(startX - badgePadding, centerY - (badgeHeight / 2), totalWidth + (badgePadding * 2), badgeHeight);
  ctx.restore();

  // 2. Draw Icon
  drawRarityIcon(ctx, startX, centerY - (iconSize / 2), userData.rarity);

  // 3. Draw Rarity Text
  // Using a small vertical offset (-2) to compensate for font descent/visual weight
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = rarityColor;
  ctx.fillText(userData.rarity, startX + iconSize + gap, centerY - 2);
  ctx.restore();

  // Likes Stats
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic"; // Reset to default
  ctx.fillStyle = "#928374"; // Gruvbox gray
  ctx.font = "20px sans-serif";
  ctx.fillText(`Loves: ${userData.likes}`, 200, 515);

  // Kagami Logo/Tag at bottom
  ctx.fillStyle = "rgba(235, 219, 178, 0.2)";
  ctx.font = "italic 16px sans-serif";
  ctx.fillText("KAGAMI REFLECTIONS", 200, 560);

  return canvas.toBuffer("image/png");
}

function drawRarityIcon(ctx: any, x: number, y: number, rarity: Rarity) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.25, 0.25); // Scale down from 100x100 to 25x25

  const rarityColor = getRarityColorHex(rarity);
  ctx.fillStyle = rarityColor;
  ctx.strokeStyle = "#3c3836";
  ctx.lineWidth = 4;

  if (rarity === Rarity.COMMON) {
    // Path: M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z
    ctx.beginPath();
    ctx.moveTo(50, 10); ctx.lineTo(85, 30); ctx.lineTo(85, 70);
    ctx.lineTo(50, 90); ctx.lineTo(15, 70); ctx.lineTo(15, 30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (rarity === Rarity.RARE) {
    // Path: M50 10 L90 50 L50 90 L10 50 Z
    ctx.beginPath();
    ctx.moveTo(50, 10); ctx.lineTo(90, 50); ctx.lineTo(50, 90); ctx.lineTo(10, 50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.2)";
    // Inner: M50 25 L75 50 L50 75 L25 50 Z
    ctx.beginPath();
    ctx.moveTo(50, 25); ctx.lineTo(75, 50); ctx.lineTo(50, 75); ctx.lineTo(25, 50);
    ctx.closePath();
    ctx.fill();
  } else if (rarity === Rarity.EPIC) {
    // Path: M50 5 L65 35 L95 50 L65 65 L50 95 L35 65 L5 50 L35 35 Z
    ctx.beginPath();
    ctx.moveTo(50, 5); ctx.lineTo(65, 35); ctx.lineTo(95, 50); ctx.lineTo(65, 65);
    ctx.lineTo(50, 95); ctx.lineTo(35, 65); ctx.lineTo(5, 50); ctx.lineTo(35, 35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath(); ctx.arc(50, 50, 10, 0, Math.PI * 2); ctx.fill();
  } else if (rarity === Rarity.LEGENDARY) {
    ctx.beginPath(); ctx.arc(50, 50, 45, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ebdbb2";
    // Sun Star: M50 15 L55 45 L85 50 L55 55 L50 85 L45 55 L15 50 L45 45 Z
    ctx.beginPath();
    ctx.moveTo(50, 15); ctx.lineTo(55, 45); ctx.lineTo(85, 50); ctx.lineTo(55, 55);
    ctx.lineTo(50, 85); ctx.lineTo(45, 55); ctx.lineTo(15, 50); ctx.lineTo(45, 45);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#282828";
    ctx.beginPath(); ctx.arc(50, 50, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  ctx.restore();
}

function getRarityColorHex(rarity: Rarity): string {
  switch (rarity) {
    case Rarity.COMMON: return "#ebdbb2"; // Cream
    case Rarity.RARE: return "#83a598"; // Blue
    case Rarity.EPIC: return "#d3869b"; // Purple
    case Rarity.LEGENDARY: return "#fabd2f"; // Yellow
  }
}

export function registerUser(user: User) {
  if (user.bot) return;
  
  db.prepare(`
    INSERT INTO global_users (user_id, username) 
    VALUES (?, ?)
    ON CONFLICT(user_id) DO UPDATE SET username = excluded.username
  `).run(user.id, user.username);
}

export function getRarity(likes: number): Rarity {
  if (likes === 0) return Rarity.COMMON;

  // Get the sum of ALL likes ever given globally
  const result = db.prepare("SELECT SUM(likes) as total FROM gacha_profiles").get() as { total: number | null };
  const totalGlobalLoves = result?.total || 0;

  if (totalGlobalLoves === 0) return Rarity.COMMON;

  // Calculate what percentage of the "Global Love Pool" this user owns
  const share = (likes / totalGlobalLoves) * 100;

  // Rarity based on "Market Share" of global likes
  if (share >= 10) return Rarity.LEGENDARY; // Owns 10%+ of all global likes
  if (share >= 5) return Rarity.EPIC;      // Owns 5%+
  if (share >= 2) return Rarity.RARE;      // Owns 2%+
  return Rarity.COMMON;
}

export function getRarityColor(rarity: Rarity): number {
  switch (rarity) {
    case Rarity.COMMON: return 0xebdbb2; // Gruvbox fg (white/cream)
    case Rarity.RARE: return 0x83a598; // Gruvbox blue
    case Rarity.EPIC: return 0xd3869b; // Gruvbox purple
    case Rarity.LEGENDARY: return 0xfabd2f; // Gruvbox yellow
  }
}

export function getRarityEmoji(rarity: Rarity): string {
  switch (rarity) {
    case Rarity.COMMON: return "<:kagami_common:1496248284744908971> ";
    case Rarity.RARE: return "<:kagami_rare:1496248286611247114> ";
    case Rarity.EPIC: return "<:kagami_epic:1496248288029184033> ";
    case Rarity.LEGENDARY: return "<:kagami_legendary:1496248289429815366> ";
  }
}

export function getEconomy(userId: string): { shards: number; last_daily: number } {
  let econ = db.prepare("SELECT shards, last_daily FROM global_economy WHERE user_id = ?").get(userId) as any;
  if (!econ) {
    db.prepare("INSERT INTO global_economy (user_id) VALUES (?)").run(userId);
    return { shards: 0, last_daily: 0 };
  }
  return econ;
}

export function addShards(userId: string, amount: number) {
  db.prepare(`
    INSERT INTO global_economy (user_id, shards) 
    VALUES (?, ?)
    ON CONFLICT(user_id) DO UPDATE SET shards = shards + excluded.shards
  `).run(userId, amount);
}

export function likeUser(likerId: string, likedId: string): boolean {
  try {
    // Attempt to insert like
    db.prepare("INSERT INTO gacha_likes (liker_id, liked_id) VALUES (?, ?)").run(likerId, likedId);
    
    // Increment likes in profile
    db.prepare(`
      INSERT INTO gacha_profiles (user_id, likes) 
      VALUES (?, 1)
      ON CONFLICT(user_id) DO UPDATE SET likes = likes + 1
    `).run(likedId);
    
    return true; // Success
  } catch (err) {
    // Unique constraint failed (already liked)
    return false;
  }
}

export function getGachaProfile(userId: string): GachaUser | null {
  const profile = db.prepare(`
    SELECT u.user_id as id, u.username, IFNULL(p.likes, 0) as likes
    FROM global_users u
    LEFT JOIN gacha_profiles p ON u.user_id = p.user_id
    WHERE u.user_id = ?
  `).get(userId) as any;

  if (!profile) return null;

  return {
    ...profile,
    rarity: getRarity(profile.likes)
  };
}

export function rollUser(): GachaUser | null {
  // Determine rarity to pull based on weights
  const rand = Math.random() * 100;
  let targetRarity = Rarity.COMMON;
  
  if (rand < 1) targetRarity = Rarity.LEGENDARY; // 1%
  else if (rand < 10) targetRarity = Rarity.EPIC; // 9%
  else if (rand < 30) targetRarity = Rarity.RARE; // 20%
  // 70% COMMON

  // Fetch users that match this rarity
  const users = db.prepare(`
    SELECT u.user_id as id, u.username, IFNULL(p.likes, 0) as likes
    FROM global_users u
    LEFT JOIN gacha_profiles p ON u.user_id = p.user_id
  `).all() as any[];

  if (users.length === 0) return null;

  // Filter by target rarity
  const matchingUsers = users.filter(u => getRarity(u.likes) === targetRarity);

  // If no users match the target rarity, fallback to any random user
  const pool = matchingUsers.length > 0 ? matchingUsers : users;
  
  const selected = pool[Math.floor(Math.random() * pool.length)];

  return {
    ...selected,
    rarity: getRarity(selected.likes)
  };
}

export function claimUser(ownerId: string, collectedUserId: string) {
  db.prepare(`
    INSERT INTO gacha_inventory (owner_id, collected_user_id, quantity) 
    VALUES (?, ?, 1)
    ON CONFLICT(owner_id, collected_user_id) DO UPDATE SET quantity = quantity + 1
  `).run(ownerId, collectedUserId);
}

export function getInventory(ownerId: string) {
  return db.prepare(`
    SELECT i.collected_user_id as id, u.username, i.quantity, IFNULL(p.likes, 0) as likes
    FROM gacha_inventory i
    JOIN global_users u ON i.collected_user_id = u.user_id
    LEFT JOIN gacha_profiles p ON u.user_id = p.user_id
    WHERE i.owner_id = ?
    ORDER BY p.likes DESC, i.quantity DESC
  `).all(ownerId) as any[];
}
