import db from "../../../shared/lib/db";
import { getRarity, addShards, claimUser, type Rarity } from "./gacha";

export interface MarketListing {
  id: number;
  seller_id: string;
  seller_name: string;
  card_id: string;
  card_name: string;
  price: number;
  quantity: number;
  likes: number;
  rarity: Rarity;
  created_at: number;
}

export function addMarketListing(sellerId: string, cardId: string, price: number, quantity: number = 1): boolean {
  // Check if user has enough of the card
  const row = db.prepare("SELECT quantity FROM gacha_inventory WHERE owner_id = ? AND collected_user_id = ?").get(sellerId, cardId) as { quantity: number } | undefined;
  
  if (!row || row.quantity < quantity) {
    return false; // Not enough cards
  }

  // Remove from inventory
  if (row.quantity === quantity) {
    db.prepare("DELETE FROM gacha_inventory WHERE owner_id = ? AND collected_user_id = ?").run(sellerId, cardId);
  } else {
    db.prepare("UPDATE gacha_inventory SET quantity = quantity - ? WHERE owner_id = ? AND collected_user_id = ?").run(quantity, sellerId, cardId);
  }

  // Add to market
  db.prepare(`
    INSERT INTO gacha_market (seller_id, card_id, price, quantity, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(sellerId, cardId, price, quantity, Date.now());

  return true;
}

export function removeMarketListing(sellerId: string, listingId: number): boolean {
  // Verify ownership
  const listing = db.prepare("SELECT card_id, quantity FROM gacha_market WHERE id = ? AND seller_id = ?").get(listingId, sellerId) as { card_id: string, quantity: number } | undefined;
  
  if (!listing) return false;

  // Delete listing
  db.prepare("DELETE FROM gacha_market WHERE id = ?").run(listingId);

  // Return to inventory
  db.prepare(`
    INSERT INTO gacha_inventory (owner_id, collected_user_id, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(owner_id, collected_user_id) DO UPDATE SET quantity = quantity + excluded.quantity
  `).run(sellerId, listing.card_id, listing.quantity);

  return true;
}

export function buyMarketListing(buyerId: string, listingId: number): { success: boolean, message: string } {
  // Fetch listing
  const listing = db.prepare("SELECT seller_id, card_id, price, quantity FROM gacha_market WHERE id = ?").get(listingId) as any;
  if (!listing) return { success: false, message: "Listing not found." };
  
  if (listing.seller_id === buyerId) {
    return { success: false, message: "You cannot buy your own listing." };
  }

  const totalCost = listing.price; // Let's say price is per bundle listed, or per unit. Let's make it the total price of the listing.

  // Fetch buyer econ
  const econ = db.prepare("SELECT shards FROM global_economy WHERE user_id = ?").get(buyerId) as { shards: number } | undefined;
  if (!econ || econ.shards < totalCost) {
    return { success: false, message: "You do not have enough shards." };
  }

  // Deduct from buyer
  addShards(buyerId, -totalCost);
  // Add to seller
  addShards(listing.seller_id, totalCost);

  // Give cards to buyer
  db.prepare(`
    INSERT INTO gacha_inventory (owner_id, collected_user_id, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(owner_id, collected_user_id) DO UPDATE SET quantity = quantity + excluded.quantity
  `).run(buyerId, listing.card_id, listing.quantity);

  // Delete listing
  db.prepare("DELETE FROM gacha_market WHERE id = ?").run(listingId);

  return { success: true, message: `Successfully purchased for ${totalCost} shards!` };
}

export function getMarketListings(page: number = 1, limit: number = 10): { listings: MarketListing[], totalPages: number } {
  const offset = (page - 1) * limit;

  // Count total for pagination
  const countRow = db.prepare("SELECT COUNT(*) as count FROM gacha_market").get() as { count: number };
  const totalPages = Math.ceil(countRow.count / limit);

  const listings = db.prepare(`
    SELECT 
      m.id, 
      m.seller_id, 
      seller.username as seller_name, 
      m.card_id, 
      card.username as card_name, 
      m.price, 
      m.quantity, 
      IFNULL(p.likes, 0) as likes,
      m.created_at
    FROM gacha_market m
    JOIN global_users seller ON m.seller_id = seller.user_id
    JOIN global_users card ON m.card_id = card.user_id
    LEFT JOIN gacha_profiles p ON card.user_id = p.user_id
    ORDER BY m.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as any[];

  return {
    totalPages: totalPages === 0 ? 1 : totalPages,
    listings: listings.map(l => ({
      ...l,
      rarity: getRarity(l.likes)
    }))
  };
}
