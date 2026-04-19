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

export default db;
