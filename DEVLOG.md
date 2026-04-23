# Devlog - Domain Resonance Feature

## Overview
Implemented the **Domain Resonance** (VIP Host) system, bridging the gap between the Gacha collection system and the Reflections (Dynamic Voice Channels) system.

## Changes Made

### 1. Database Schema Update (`src/shared/lib/db.ts`)
- Added `tier_level INTEGER DEFAULT 1` to the `active_reflections` table to persist the generated Tier of a Voice Channel.
- Added a migration step (`ALTER TABLE`) on startup to ensure existing databases are safely updated without data loss.

### 2. Collection Score & Tiers Logic (`src/features/gacha/lib/gacha.ts`)
- Added `getCollectionScore(userId)`: Calculates a user's total collection score based on their inventory (Common=1, Rare=5, Epic=20, Legendary=100, multiplied by quantity).
- Added `DomainTier` interface and `getDomainTier(score)` logic to map scores to 5 distinct tiers (Normal, Silver, Gold, Diamond, Prismatic). Each tier provides different perks like `xpMultiplier` and `shardChance`.

### 3. Voice Channel Creation (`src/features/reflections/events/voiceStateUpdate.ts`)
- Modified the Reflection creation logic. When a user joins the generator channel, their Collection Score is calculated, and their Domain Tier is determined.
- The resulting Voice Channel is dynamically renamed to include the Tier's specific emoji (e.g., `✨ Reflet de User`).
- The tier is successfully stored in the `active_reflections` table.

### 4. XP and Shard Perks (`src/features/levels/lib/xp.ts` & `src/features/levels/events/xpEvents.ts`)
- Updated `addXP` to accept a `multiplier` argument.
- Intercepted `MessageCreate` events. If a message is sent within an active Reflection's text channel, the system queries the database for the channel's `tier_level`.
- Applied the Tier's `xpMultiplier` to the user's XP gain.
- Added a random chance (based on the Tier's `shardChance`) for the user to "find" Gacha shards randomly while chatting in a high-tier Domain.

## Next Steps
- Consider expanding visual elements (e.g., generating Domain Banners using Canvas for Tier 3+ channels).
- Implement commands to let users check their current Collection Score.