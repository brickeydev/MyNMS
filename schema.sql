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
