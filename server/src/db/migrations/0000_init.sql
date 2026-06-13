CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  username   TEXT NOT NULL UNIQUE,
  email      TEXT UNIQUE,
  password   TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  avatar_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000),
  updated_at INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000)
);

CREATE TABLE IF NOT EXISTS media_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  type            TEXT NOT NULL CHECK (type IN ('movie', 'series')),
  title           TEXT NOT NULL,
  sort_title      TEXT NOT NULL,
  year            INTEGER,
  tmdb_id         INTEGER UNIQUE,
  imdb_id         TEXT,
  overview        TEXT,
  poster_path     TEXT,
  backdrop_path   TEXT,
  rating          REAL,
  genres          TEXT NOT NULL DEFAULT '[]',
  file_path       TEXT,
  duration_sec    INTEGER,
  file_size       INTEGER,
  codec_video     TEXT,
  codec_audio     TEXT,
  container       TEXT,
  is_direct_play  INTEGER NOT NULL DEFAULT 0,
  tmdb_fetched_at INTEGER,
  scanned_at      INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000),
  created_at      INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000)
);

CREATE INDEX IF NOT EXISTS idx_media_items_type       ON media_items(type);
CREATE INDEX IF NOT EXISTS idx_media_items_sort_title ON media_items(sort_title);

CREATE TABLE IF NOT EXISTS seasons (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  series_id     INTEGER NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,
  title         TEXT,
  overview      TEXT,
  poster_path   TEXT,
  air_date      TEXT,
  UNIQUE(series_id, season_number)
);

CREATE INDEX IF NOT EXISTS idx_seasons_series ON seasons(series_id);

CREATE TABLE IF NOT EXISTS episodes (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  series_id      INTEGER NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
  season_id      INTEGER NOT NULL REFERENCES seasons(id)     ON DELETE CASCADE,
  season_number  INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  title          TEXT,
  overview       TEXT,
  still_path     TEXT,
  air_date       TEXT,
  duration_sec   INTEGER,
  file_path      TEXT NOT NULL,
  file_size      INTEGER,
  codec_video    TEXT,
  codec_audio    TEXT,
  container      TEXT,
  is_direct_play INTEGER NOT NULL DEFAULT 0,
  scanned_at     INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000),
  UNIQUE(series_id, season_number, episode_number)
);

CREATE INDEX IF NOT EXISTS idx_episodes_series ON episodes(series_id);
CREATE INDEX IF NOT EXISTS idx_episodes_season ON episodes(season_id);

CREATE TABLE IF NOT EXISTS watch_progress (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
  media_item_id INTEGER NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
  episode_id    INTEGER          REFERENCES episodes(id)    ON DELETE CASCADE,
  position_sec  REAL NOT NULL DEFAULT 0,
  duration_sec  REAL,
  completed     INTEGER NOT NULL DEFAULT 0,
  updated_at    INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000)
);

-- Partial unique indexes so NULLs work correctly
CREATE UNIQUE INDEX IF NOT EXISTS uq_progress_movie   ON watch_progress(user_id, media_item_id)          WHERE episode_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_progress_episode ON watch_progress(user_id, media_item_id, episode_id) WHERE episode_id IS NOT NULL;
CREATE INDEX        IF NOT EXISTS idx_progress_user   ON watch_progress(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS transcode_sessions (
  id            TEXT    PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_item_id INTEGER REFERENCES media_items(id),
  episode_id    INTEGER REFERENCES episodes(id),
  file_path     TEXT    NOT NULL,
  segment_dir   TEXT    NOT NULL,
  pid           INTEGER,
  start_offset  REAL    NOT NULL DEFAULT 0,
  status        TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','ended','error')),
  created_at    INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000),
  last_ping     INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000)
);

CREATE TABLE IF NOT EXISTS tmdb_cache (
  cache_key  TEXT    PRIMARY KEY,
  body       TEXT    NOT NULL,
  fetched_at INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000)
);
