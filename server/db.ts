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
    avatar        TEXT,
    friend_code   TEXT,
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

  CREATE TABLE IF NOT EXISTS match_players (
    match_id    TEXT NOT NULL,
    user_id     TEXT NOT NULL,
    game_id     TEXT NOT NULL,
    outcome     TEXT NOT NULL,
    created_at  INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_match_players_user ON match_players(user_id, created_at);

  CREATE TABLE IF NOT EXISTS password_resets (
    token       TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    expires_at  INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS friendships (
    id          TEXT PRIMARY KEY,
    requester   TEXT NOT NULL,
    recipient   TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending',
    created_at  INTEGER NOT NULL,
    UNIQUE (requester, recipient),
    FOREIGN KEY (requester) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient) REFERENCES users(id) ON DELETE CASCADE
  );
`)

// Migrate older databases that predate the avatar / friend_code columns.
for (const col of ['avatar TEXT', 'friend_code TEXT']) {
  try {
    db.exec(`ALTER TABLE users ADD COLUMN ${col}`)
  } catch {
    // column already exists — fine
  }
}
db.exec(
  'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_friend_code ON users(friend_code) WHERE friend_code IS NOT NULL',
)

const FRIEND_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no ambiguous 0/O/1/I/L

export function genFriendCode(): string {
  let out = ''
  for (let i = 0; i < 6; i++) out += FRIEND_CODE_CHARS[Math.floor(Math.random() * FRIEND_CODE_CHARS.length)]
  return out
}

/** Give a code to any user that doesn't have one yet (backfill + safety). */
export function ensureFriendCode(userId: string): string {
  const row = db.prepare('SELECT friend_code FROM users WHERE id = ?').get(userId) as
    | { friend_code: string | null }
    | undefined
  if (row?.friend_code) return row.friend_code
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = genFriendCode()
    const taken = db.prepare('SELECT 1 FROM users WHERE friend_code = ?').get(code)
    if (taken) continue
    db.prepare('UPDATE users SET friend_code = ? WHERE id = ?').run(code, userId)
    return code
  }
  throw new Error('Ne mogu generisati friend kod')
}

// Backfill codes for any pre-existing users.
for (const r of db.prepare('SELECT id FROM users WHERE friend_code IS NULL').all() as {
  id: string
}[]) {
  ensureFriendCode(r.id)
}

console.log(`[db] SQLite spreman na ${dbPath}`)
