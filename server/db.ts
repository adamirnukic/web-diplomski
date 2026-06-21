import { DatabaseSync } from 'node:sqlite'
import { join } from 'node:path'

const dbPath = process.env.DB_PATH ?? join(process.cwd(), 'server', 'data.sqlite')

export const db = new DatabaseSync(dbPath)

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS game_stats (
    user_id       TEXT NOT NULL,
    game_id       TEXT NOT NULL,
    wins          INTEGER NOT NULL DEFAULT 0,
    losses        INTEGER NOT NULL DEFAULT 0,
    draws         INTEGER NOT NULL DEFAULT 0,
    games_played  INTEGER NOT NULL DEFAULT 0,
    xp            INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, game_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS matches (
    id          TEXT PRIMARY KEY,
    game_id     TEXT NOT NULL,
    mode        TEXT NOT NULL,
    result      TEXT NOT NULL,
    created_at  INTEGER NOT NULL
  );
`)

console.log(`[db] SQLite spreman na ${dbPath}`)
