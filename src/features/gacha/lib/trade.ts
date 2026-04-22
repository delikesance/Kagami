import db from "../../../shared/lib/db";
import { getRarity, type Rarity } from "./gacha";

export interface TradeOffer {
  senderId: string;
  receiverId: string;
  giveCardId: string;
  receiveCardId: string;
}

export function checkTradeValidity(offer: TradeOffer): { valid: boolean, message?: string } {
  // Check sender inventory
  const senderItem = db.prepare("SELECT quantity FROM gacha_inventory WHERE owner_id = ? AND collected_user_id = ?").get(offer.senderId, offer.giveCardId) as any;
  if (!senderItem || senderItem.quantity < 1) return { valid: false, message: "Sender does not have the offered card." };

  // Check receiver inventory
  const receiverItem = db.prepare("SELECT quantity FROM gacha_inventory WHERE owner_id = ? AND collected_user_id = ?").get(offer.receiverId, offer.receiveCardId) as any;
  if (!receiverItem || receiverItem.quantity < 1) return { valid: false, message: "Receiver does not have the requested card." };

  return { valid: true };
}

export function executeTrade(offer: TradeOffer): boolean {
  const check = checkTradeValidity(offer);
  if (!check.valid) return false;

  const performTrade = db.transaction(() => {
    // 1. Remove from sender
    const sItem = db.prepare("SELECT quantity FROM gacha_inventory WHERE owner_id = ? AND collected_user_id = ?").get(offer.senderId, offer.giveCardId) as any;
    if (sItem.quantity === 1) {
      db.prepare("DELETE FROM gacha_inventory WHERE owner_id = ? AND collected_user_id = ?").run(offer.senderId, offer.giveCardId);
    } else {
      db.prepare("UPDATE gacha_inventory SET quantity = quantity - 1 WHERE owner_id = ? AND collected_user_id = ?").run(offer.senderId, offer.giveCardId);
    }

    // 2. Remove from receiver
    const rItem = db.prepare("SELECT quantity FROM gacha_inventory WHERE owner_id = ? AND collected_user_id = ?").get(offer.receiverId, offer.receiveCardId) as any;
    if (rItem.quantity === 1) {
      db.prepare("DELETE FROM gacha_inventory WHERE owner_id = ? AND collected_user_id = ?").run(offer.receiverId, offer.receiveCardId);
    } else {
      db.prepare("UPDATE gacha_inventory SET quantity = quantity - 1 WHERE owner_id = ? AND collected_user_id = ?").run(offer.receiverId, offer.receiveCardId);
    }

    // 3. Give to sender
    db.prepare(`
      INSERT INTO gacha_inventory (owner_id, collected_user_id, quantity)
      VALUES (?, ?, 1)
      ON CONFLICT(owner_id, collected_user_id) DO UPDATE SET quantity = quantity + 1
    `).run(offer.senderId, offer.receiveCardId);

    // 4. Give to receiver
    db.prepare(`
      INSERT INTO gacha_inventory (owner_id, collected_user_id, quantity)
      VALUES (?, ?, 1)
      ON CONFLICT(owner_id, collected_user_id) DO UPDATE SET quantity = quantity + 1
    `).run(offer.receiverId, offer.giveCardId);
  });

  try {
    performTrade();
    return true;
  } catch (e) {
    console.error("Trade transaction failed:", e);
    return false;
  }
}
