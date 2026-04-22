import db from "../../../shared/lib/db";
import { Rarity, getRarity, addShards } from "../lib/gacha";

/**
 * Calculates the sell price for a card based on its current rarity.
 * Prices: Common: 25, Rare: 100, Epic: 500, Legendary: 2500
 */
export function getSellPrice(rarity: Rarity): number {
  switch (rarity) {
    case Rarity.COMMON: return 25;
    case Rarity.RARE: return 100;
    case Rarity.EPIC: return 500;
    case Rarity.LEGENDARY: return 2500;
  }
}

/**
 * Sells a specific card from a user's inventory.
 */
export function sellCard(ownerId: string, collectedUserId: string, quantity: number = 1): number | null {
  const row = db.prepare("SELECT quantity, likes FROM gacha_inventory i JOIN gacha_profiles p ON i.collected_user_id = p.user_id WHERE i.owner_id = ? AND i.collected_user_id = ?")
    .get(ownerId, collectedUserId) as { quantity: number, likes: number } | undefined;

  if (!row || row.quantity < quantity) return null;

  const rarity = getRarity(row.likes);
  const totalValue = getSellPrice(rarity) * quantity;

  if (row.quantity === quantity) {
    db.prepare("DELETE FROM gacha_inventory WHERE owner_id = ? AND collected_user_id = ?").run(ownerId, collectedUserId);
  } else {
    db.prepare("UPDATE gacha_inventory SET quantity = quantity - ? WHERE owner_id = ? AND collected_user_id = ?")
      .run(quantity, ownerId, collectedUserId);
  }

  addShards(ownerId, totalValue);
  return totalValue;
}

/**
 * Sells all cards of a specific rarity for a user.
 */
export function sellAllByRarity(ownerId: string, targetRarity: Rarity): { count: number, value: number } {
  const inventory = db.prepare(`
    SELECT i.collected_user_id, i.quantity, IFNULL(p.likes, 0) as likes
    FROM gacha_inventory i
    LEFT JOIN gacha_profiles p ON i.collected_user_id = p.user_id
    WHERE i.owner_id = ?
  `).all(ownerId) as { collected_user_id: string, quantity: number, likes: number }[];

  let totalValue = 0;
  let totalCards = 0;

  for (const item of inventory) {
    if (getRarity(item.likes) === targetRarity) {
      const price = getSellPrice(targetRarity);
      totalValue += price * item.quantity;
      totalCards += item.quantity;
      db.prepare("DELETE FROM gacha_inventory WHERE owner_id = ? AND collected_user_id = ?")
        .run(ownerId, item.collected_user_id);
    }
  }

  addShards(ownerId, totalValue);
  return { count: totalCards, value: totalValue };
}
