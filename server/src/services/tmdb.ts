import { createWriteStream, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { pipeline } from 'stream/promises';
import pLimit from 'p-limit';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { tmdbCache } from '../db/schema';
import { config, IMAGES_DIR } from '../config';
import { logger } from '../lib/logger';

const limit = pLimit(3);
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface TmdbMovie {
  id: number;
  title: string;
  release_date?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  genres?: Array<{ id: number; name: string }>;
  imdb_id?: string;
}

export interface TmdbSeries {
  id: number;
  name: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  genres?: Array<{ id: number; name: string }>;
  seasons?: Array<{
    season_number: number;
    name: string;
    overview?: string;
    poster_path?: string;
    air_date?: string;
  }>;
}

export interface TmdbEpisode {
  episode_number: number;
  name?: string;
  overview?: string;
  still_path?: string;
  air_date?: string;
  runtime?: number;
}

export interface TmdbSeason {
  season_number: number;
  episodes: TmdbEpisode[];
}

async function cachedFetch<T>(cacheKey: string, url: string): Promise<T | null> {
  if (!config.TMDB_API_KEY) return null;

  const cached = await db.select().from(tmdbCache).where(eq(tmdbCache.cacheKey, cacheKey)).get();
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return JSON.parse(cached.body) as T;
  }

  try {
    const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}api_key=${config.TMDB_API_KEY}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`TMDb ${res.status}`);
    }
    const data = (await res.json()) as T;
    const body = JSON.stringify(data);

    await db.insert(tmdbCache)
      .values({ cacheKey, body, fetchedAt: Date.now() })
      .onConflictDoUpdate({ target: tmdbCache.cacheKey, set: { body, fetchedAt: Date.now() } });

    return data;
  } catch (err) {
    logger.warn({ err, cacheKey }, 'TMDb fetch failed');
    return null;
  }
}

export async function searchMovie(title: string, year?: number): Promise<TmdbMovie | null> {
  return limit(async () => {
    const yearParam = year ? `&year=${year}` : '';
    const key = `search/movie/${encodeURIComponent(title)}/${year ?? ''}`;
    const url = `${config.TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(title)}${yearParam}`;
    const res = await cachedFetch<{ results: TmdbMovie[] }>(key, url);
    if (!res?.results?.length) return null;
    return year
      ? (res.results.find((r) => r.release_date?.startsWith(String(year))) ?? res.results[0])
      : res.results[0];
  });
}

export async function getMovieDetails(tmdbId: number): Promise<TmdbMovie | null> {
  return limit(() =>
    cachedFetch<TmdbMovie>(`movie/${tmdbId}`, `${config.TMDB_BASE_URL}/movie/${tmdbId}`)
  );
}

export async function searchSeries(title: string): Promise<TmdbSeries | null> {
  return limit(async () => {
    const key = `search/tv/${encodeURIComponent(title)}`;
    const url = `${config.TMDB_BASE_URL}/search/tv?query=${encodeURIComponent(title)}`;
    const res = await cachedFetch<{ results: TmdbSeries[] }>(key, url);
    return res?.results?.[0] ?? null;
  });
}

export async function getSeriesDetails(tmdbId: number): Promise<TmdbSeries | null> {
  return limit(() =>
    cachedFetch<TmdbSeries>(`tv/${tmdbId}`, `${config.TMDB_BASE_URL}/tv/${tmdbId}`)
  );
}

export async function getSeasonDetails(tmdbId: number, seasonNumber: number): Promise<TmdbSeason | null> {
  return limit(() =>
    cachedFetch<TmdbSeason>(
      `tv/${tmdbId}/season/${seasonNumber}`,
      `${config.TMDB_BASE_URL}/tv/${tmdbId}/season/${seasonNumber}`
    )
  );
}

export async function downloadImage(remotePath: string, localPath: string): Promise<void> {
  if (!config.TMDB_API_KEY) return;
  mkdirSync(dirname(localPath), { recursive: true });

  const url = `https://image.tmdb.org/t/p/w500${remotePath}`;
  try {
    const res = await fetch(url);
    if (!res.ok || !res.body) return;
    const dest = createWriteStream(localPath);
    await pipeline(res.body as unknown as NodeJS.ReadableStream, dest);
  } catch (err) {
    logger.warn({ err, url }, 'Image download failed');
  }
}

export function localPosterPath(tmdbId: number, type: 'poster' | 'backdrop' | 'still', suffix = ''): string {
  return join(IMAGES_DIR, String(tmdbId), `${type}${suffix}.jpg`);
}

export function posterUrl(localPath: string): string {
  const rel = localPath.replace(IMAGES_DIR, '').replace(/\\/g, '/');
  return `/api/images${rel}`;
}
