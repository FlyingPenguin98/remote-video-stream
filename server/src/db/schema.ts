import { sqliteTable, integer, text, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const now = sql`(cast(strftime('%s', 'now') as integer) * 1000)`;

export const users = sqliteTable('users', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  username:  text('username').notNull().unique(),
  email:     text('email').unique(),
  password:  text('password').notNull(),
  role:      text('role', { enum: ['admin', 'user'] }).notNull().default('user'),
  avatarUrl: text('avatar_url'),
  createdAt: integer('created_at').notNull().default(now),
  updatedAt: integer('updated_at').notNull().default(now),
});

export const mediaItems = sqliteTable('media_items', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  type:          text('type', { enum: ['movie', 'series'] }).notNull(),
  title:         text('title').notNull(),
  sortTitle:     text('sort_title').notNull(),
  year:          integer('year'),
  tmdbId:        integer('tmdb_id').unique(),
  imdbId:        text('imdb_id'),
  overview:      text('overview'),
  posterPath:    text('poster_path'),
  backdropPath:  text('backdrop_path'),
  rating:        real('rating'),
  genres:        text('genres').notNull().default('[]'),
  filePath:      text('file_path'),
  durationSec:   integer('duration_sec'),
  fileSize:      integer('file_size'),
  codecVideo:    text('codec_video'),
  codecAudio:    text('codec_audio'),
  container:     text('container'),
  isDirectPlay:  integer('is_direct_play', { mode: 'boolean' }).notNull().default(false),
  tmdbFetchedAt: integer('tmdb_fetched_at'),
  scannedAt:     integer('scanned_at').notNull().default(now),
  createdAt:     integer('created_at').notNull().default(now),
}, (t) => ({
  typeIdx:      index('idx_media_items_type').on(t.type),
  sortTitleIdx: index('idx_media_items_sort_title').on(t.sortTitle),
}));

export const seasons = sqliteTable('seasons', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  seriesId:     integer('series_id').notNull().references(() => mediaItems.id, { onDelete: 'cascade' }),
  seasonNumber: integer('season_number').notNull(),
  title:        text('title'),
  overview:     text('overview'),
  posterPath:   text('poster_path'),
  airDate:      text('air_date'),
}, (t) => ({
  uniq:      uniqueIndex('uq_seasons_series_number').on(t.seriesId, t.seasonNumber),
  seriesIdx: index('idx_seasons_series').on(t.seriesId),
}));

export const episodes = sqliteTable('episodes', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  seriesId:      integer('series_id').notNull().references(() => mediaItems.id, { onDelete: 'cascade' }),
  seasonId:      integer('season_id').notNull().references(() => seasons.id, { onDelete: 'cascade' }),
  seasonNumber:  integer('season_number').notNull(),
  episodeNumber: integer('episode_number').notNull(),
  title:         text('title'),
  overview:      text('overview'),
  stillPath:     text('still_path'),
  airDate:       text('air_date'),
  durationSec:   integer('duration_sec'),
  filePath:      text('file_path').notNull(),
  fileSize:      integer('file_size'),
  codecVideo:    text('codec_video'),
  codecAudio:    text('codec_audio'),
  container:     text('container'),
  isDirectPlay:  integer('is_direct_play', { mode: 'boolean' }).notNull().default(false),
  scannedAt:     integer('scanned_at').notNull().default(now),
}, (t) => ({
  seriesIdx: index('idx_episodes_series').on(t.seriesId),
  seasonIdx: index('idx_episodes_season').on(t.seasonId),
}));

export const watchProgress = sqliteTable('watch_progress', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  userId:      integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  mediaItemId: integer('media_item_id').notNull().references(() => mediaItems.id, { onDelete: 'cascade' }),
  episodeId:   integer('episode_id').references(() => episodes.id, { onDelete: 'cascade' }),
  positionSec: real('position_sec').notNull().default(0),
  durationSec: real('duration_sec'),
  completed:   integer('completed', { mode: 'boolean' }).notNull().default(false),
  updatedAt:   integer('updated_at').notNull().default(now),
}, (t) => ({
  userIdx: index('idx_progress_user').on(t.userId, t.updatedAt),
}));

export const transcodeSessions = sqliteTable('transcode_sessions', {
  id:          text('id').primaryKey(),
  userId:      integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  mediaItemId: integer('media_item_id').references(() => mediaItems.id),
  episodeId:   integer('episode_id').references(() => episodes.id),
  filePath:    text('file_path').notNull(),
  segmentDir:  text('segment_dir').notNull(),
  pid:         integer('pid'),
  startOffset: real('start_offset').notNull().default(0),
  status:      text('status', { enum: ['pending', 'active', 'ended', 'error'] }).notNull().default('pending'),
  createdAt:   integer('created_at').notNull().default(now),
  lastPing:    integer('last_ping').notNull().default(now),
});

export const tmdbCache = sqliteTable('tmdb_cache', {
  cacheKey:  text('cache_key').primaryKey(),
  body:      text('body').notNull(),
  fetchedAt: integer('fetched_at').notNull().default(now),
});
