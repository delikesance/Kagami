import db from "../../../shared/lib/db";

export interface UserLevelData {
  xp: number;
  level: number;
}

export const getXPToNextLevel = (level: number) => {
  return 5 * Math.pow(level, 2) + 50 * level + 100;
};

export async function addXP(guildId: string, userId: string, multiplier: number = 1.0): Promise<{ leveledUp: boolean; newLevel: number } | null> {
  const now = Date.now();
  const cooldown = 60 * 1000; // 1 minute cooldown

  const row = db.query("SELECT xp, level, last_msg_timestamp FROM user_levels WHERE guild_id = ? AND user_id = ?")
    .get(guildId, userId) as { xp: number; level: number; last_msg_timestamp: number } | undefined;

  if (row && now - row.last_msg_timestamp < cooldown) {
    return null;
  }

  let xpToAdd = Math.floor(Math.random() * 11) + 15; // 15-25 XP
  xpToAdd = Math.floor(xpToAdd * multiplier);
  
  let newXP = (row?.xp || 0) + xpToAdd;
  let newLevel = row?.level || 0;
  let leveledUp = false;

  while (newXP >= getXPToNextLevel(newLevel)) {
    newXP -= getXPToNextLevel(newLevel);
    newLevel++;
    leveledUp = true;
  }

  if (row) {
    db.query("UPDATE user_levels SET xp = ?, level = ?, last_msg_timestamp = ? WHERE guild_id = ? AND user_id = ?")
      .run(newXP, newLevel, now, guildId, userId);
  } else {
    db.query("INSERT INTO user_levels (guild_id, user_id, xp, level, last_msg_timestamp) VALUES (?, ?, ?, ?, ?)")
      .run(guildId, userId, newXP, newLevel, now);
  }

  return { leveledUp, newLevel };
}

export function getUserLevel(guildId: string, userId: string): UserLevelData {
  const row = db.query("SELECT xp, level FROM user_levels WHERE guild_id = ? AND user_id = ?")
    .get(guildId, userId) as UserLevelData | undefined;

  return row || { xp: 0, level: 0 };
}

export function getTopUsers(guildId: string, limit = 5): { user_id: string, xp: number, level: number }[] {
  return db.query("SELECT user_id, xp, level FROM user_levels WHERE guild_id = ? ORDER BY level DESC, xp DESC LIMIT ?")
    .all(guildId, limit) as { user_id: string, xp: number, level: number }[];
}
