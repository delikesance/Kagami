import { Database } from "bun:sqlite";

const db = new Database("database.sqlite", { create: true });

// Initialize tables
db.query(`
  CREATE TABLE IF NOT EXISTS guild_configs (
    guild_id TEXT PRIMARY KEY,
    welcome_channel_id TEXT,
    log_channel_id TEXT,
    log_events TEXT DEFAULT '[]',
    language TEXT DEFAULT 'en'
  )
`).run();

db.query(`
  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    reason TEXT,
    moderator_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  )
`).run();

db.query(`
  CREATE TABLE IF NOT EXISTS automod_configs (
    guild_id TEXT PRIMARY KEY,
    use_default_filter INTEGER DEFAULT 1,
    exempt_roles TEXT DEFAULT '[]',
    exempt_channels TEXT DEFAULT '[]'
  )
`).run();

db.query(`
  CREATE TABLE IF NOT EXISTS automod_blacklists (
    guild_id TEXT NOT NULL,
    word TEXT NOT NULL,
    UNIQUE(guild_id, word)
  )
`).run();

db.query(`
  CREATE TABLE IF NOT EXISTS user_configs (
    user_id TEXT PRIMARY KEY,
    locale TEXT NOT NULL
  )
`).run();

db.query(`
  CREATE TABLE IF NOT EXISTS verification_configs (
    guild_id TEXT PRIMARY KEY,
    role_id TEXT,
    channel_id TEXT,
    enabled INTEGER DEFAULT 0
  )
`).run();

db.query(`
  CREATE TABLE IF NOT EXISTS pending_verifications (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    answer TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    attempts INTEGER DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
  )
`).run();

db.query(`
  CREATE TABLE IF NOT EXISTS user_levels (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 0,
    last_msg_timestamp INTEGER DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
  )
`).run();

db.query(`
  CREATE TABLE IF NOT EXISTS reflection_configs (
    guild_id TEXT PRIMARY KEY,
    generator_channel_id TEXT NOT NULL,
    category_id TEXT
  )
`).run();

db.query(`
  CREATE TABLE IF NOT EXISTS active_reflections (
    channel_id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    owner_id TEXT NOT NULL
  )
`).run();

// Add attempts column if it doesn't exist
try {
  db.query("ALTER TABLE pending_verifications ADD COLUMN attempts INTEGER DEFAULT 0").run();
} catch (e) {}

// Add missing columns if table already exists
try {
  db.query("ALTER TABLE guild_configs ADD COLUMN welcome_channel_id TEXT").run();
} catch (e) {
  // Column likely already exists
}

try {
  db.query("ALTER TABLE guild_configs ADD COLUMN log_channel_id TEXT").run();
} catch (e) {
  // Column likely already exists
}

try {
  db.query("ALTER TABLE guild_configs ADD COLUMN log_events TEXT DEFAULT '[]'").run();
} catch (e) {
  // Column likely already exists
}

try {
  db.query("ALTER TABLE guild_configs ADD COLUMN language TEXT DEFAULT 'en'").run();
} catch (e) {
  // Column likely already exists
}

// --- Gacha System Tables ---
db.query(`
  CREATE TABLE IF NOT EXISTS global_economy (
    user_id TEXT PRIMARY KEY,
    shards INTEGER DEFAULT 0,
    last_daily INTEGER DEFAULT 0
  )
`).run();

db.query(`
  CREATE TABLE IF NOT EXISTS gacha_likes (
    liker_id TEXT NOT NULL,
    liked_id TEXT NOT NULL,
    PRIMARY KEY (liker_id, liked_id)
  )
`).run();

db.query(`
  CREATE TABLE IF NOT EXISTS gacha_profiles (
    user_id TEXT PRIMARY KEY,
    likes INTEGER DEFAULT 0
  )
`).run();

db.query(`
  CREATE TABLE IF NOT EXISTS gacha_inventory (
    owner_id TEXT NOT NULL,
    collected_user_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    PRIMARY KEY (owner_id, collected_user_id)
  )
`).run();

db.query(`
  CREATE TABLE IF NOT EXISTS global_users (
    user_id TEXT PRIMARY KEY,
    username TEXT NOT NULL
  )
`).run();

db.query(`
  CREATE TABLE IF NOT EXISTS developers (
    user_id TEXT PRIMARY KEY
  )
`).run();

db.query(`
  CREATE TABLE IF NOT EXISTS gacha_market (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id TEXT NOT NULL,
    card_id TEXT NOT NULL,
    price INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL
  )
`).run();

// Seed initial developer
const devs = db.query("SELECT COUNT(*) as count FROM developers").get() as { count: number };
if (devs.count === 0) {
  db.prepare("INSERT INTO developers (user_id) VALUES (?)").run("1494544143081279532");
}

export default db;
