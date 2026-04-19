import { Database } from "bun:sqlite";

const db = new Database("database.sqlite", { create: true });

// Initialize tables
db.query(`
  CREATE TABLE IF NOT EXISTS guild_configs (
    guild_id TEXT PRIMARY KEY,
    welcome_channel_id TEXT,
    log_channel_id TEXT,
    log_events TEXT DEFAULT '[]'
  )
`).run();

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

export default db;
