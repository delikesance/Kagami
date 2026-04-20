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

export default db;
