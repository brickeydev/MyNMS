import fs from "node:fs"
import path from "node:path"

import Database from "better-sqlite3"

const DATA_DIR = process.env.DATA_DIR ?? "/data"
const DB_PATH = process.env.DB_PATH ?? path.join(DATA_DIR, "mynms.db")
const PHOTO_DIR = process.env.PHOTO_DIR ?? path.join(DATA_DIR, "photos")
const LOGO_DIR = process.env.LOGO_DIR ?? path.join(DATA_DIR, "logos")
const NEWS_IMAGE_DIR = process.env.NEWS_IMAGE_DIR ?? path.join(DATA_DIR, "news-images")

const schema = `
  CREATE TABLE IF NOT EXISTS analytics_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS page_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT DEFAULT (datetime('now')),
    path TEXT NOT NULL,
    referrer TEXT,
    ip_hash TEXT NOT NULL,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    country TEXT,
    session_hash TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views (created_at);
  CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views (path);
  CREATE INDEX IF NOT EXISTS idx_page_views_ip_hash ON page_views (ip_hash);

  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    category TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    photo_path TEXT,
    lat REAL,
    lng REAL,
    contact TEXT,
    status TEXT NOT NULL DEFAULT 'offen',
    owner_token TEXT
  );

  CREATE TABLE IF NOT EXISTS news_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    guid TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    link TEXT NOT NULL,
    description TEXT NOT NULL,
    author TEXT,
    pub_date TEXT NOT NULL,
    source TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS directory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    logo_path TEXT,
    address TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    social_instagram TEXT,
    social_facebook TEXT,
    opening_hours TEXT,
    lat REAL,
    lng REAL,
    approved INTEGER NOT NULL DEFAULT 0,
    owner_token TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_entries_category_type_status
    ON entries (category, type, status);
  CREATE INDEX IF NOT EXISTS idx_news_cache_source_pub_date
    ON news_cache (source, pub_date DESC);
  CREATE INDEX IF NOT EXISTS idx_directory_category_approved
    ON directory (category, approved);
`

declare global {
  var __mynmsDb: Database.Database | undefined
}

function migrate(instance: Database.Database) {
  const migrations = [
    "ALTER TABLE entries ADD COLUMN owner_token TEXT",
    "ALTER TABLE directory ADD COLUMN owner_token TEXT",
    "ALTER TABLE directory ADD COLUMN social_spotify TEXT",
    "ALTER TABLE directory ADD COLUMN social_tiktok TEXT",
    "ALTER TABLE directory ADD COLUMN social_soundcloud TEXT",
    "ALTER TABLE directory ADD COLUMN social_youtube TEXT",
    "ALTER TABLE directory ADD COLUMN social_linkedin TEXT",
    "ALTER TABLE news_cache ADD COLUMN image_path TEXT",
    "ALTER TABLE directory ADD COLUMN social_whatsapp TEXT",
    "ALTER TABLE directory ADD COLUMN social_twitter TEXT",
    "ALTER TABLE directory ADD COLUMN social_bluesky TEXT",
    "ALTER TABLE directory ADD COLUMN social_mastodon TEXT",
    "ALTER TABLE directory ADD COLUMN social_bandcamp TEXT",
  ]
  for (const sql of migrations) {
    try {
      instance.exec(sql)
    } catch {
      // Column already exists — ignore
    }
  }
}

function initializeDatabase(): Database.Database {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.mkdirSync(PHOTO_DIR, { recursive: true })
  fs.mkdirSync(LOGO_DIR, { recursive: true })
  fs.mkdirSync(NEWS_IMAGE_DIR, { recursive: true })

  const instance = new Database(DB_PATH)
  instance.pragma("journal_mode = WAL")
  instance.pragma("foreign_keys = ON")
  instance.exec(schema)
  migrate(instance)

  // Data retention: remove page_views older than 365 days
  instance.exec("DELETE FROM page_views WHERE created_at < datetime('now', '-365 days')")

  // Data retention: remove old news cache entries and their downloaded images
  const oldNewsImages = instance
    .prepare(
      "SELECT image_path FROM news_cache WHERE fetched_at < datetime('now', '-365 days') AND image_path IS NOT NULL"
    )
    .all() as Array<{ image_path: string }>
  instance.exec("DELETE FROM news_cache WHERE fetched_at < datetime('now', '-365 days')")
  for (const row of oldNewsImages) {
    try {
      fs.unlinkSync(path.join(NEWS_IMAGE_DIR, row.image_path))
    } catch {
      // File already gone — ignore
    }
  }

  return instance
}

function getDb(): Database.Database {
  if (!globalThis.__mynmsDb) {
    globalThis.__mynmsDb = initializeDatabase()
  }
  return globalThis.__mynmsDb
}

export const db: Database.Database = new Proxy({} as Database.Database, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export { DATA_DIR, DB_PATH, PHOTO_DIR, LOGO_DIR, NEWS_IMAGE_DIR }

export function getDailySalt(): string {
  const today = new Date().toISOString().slice(0, 10)

  const row = db
    .prepare("SELECT value FROM analytics_config WHERE key = 'daily_salt'")
    .get() as { value: string } | undefined

  if (row?.value) {
    const sep = row.value.indexOf(":")
    if (sep !== -1 && row.value.slice(0, sep) === today) {
      return row.value.slice(sep + 1)
    }
  }

  const newSalt = crypto.randomUUID() + "-" + crypto.randomUUID()
  db.prepare(
    "INSERT OR REPLACE INTO analytics_config (key, value) VALUES ('daily_salt', ?)"
  ).run(`${today}:${newSalt}`)
  return newSalt
}
