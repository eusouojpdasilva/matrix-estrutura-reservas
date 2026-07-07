-- Blog articles
CREATE TABLE IF NOT EXISTS articles (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  title            TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  excerpt          TEXT,
  cover_image      TEXT,
  content          TEXT,       -- HTML from Quill editor
  meta_description TEXT,
  read_time_min    INTEGER DEFAULT 5,
  status           TEXT DEFAULT 'draft',  -- 'published' | 'draft'
  published_at     TEXT,
  created_at       TEXT DEFAULT (datetime('now')),
  updated_at       TEXT DEFAULT (datetime('now'))
);
