import { readdirSync, statSync, existsSync } from 'fs';
import { join, extname, basename, dirname } from 'path';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../db/client';
import { mediaItems, seasons, episodes } from '../db/schema';
import { probeFile } from './directPlay';
import {
  searchMovie, getMovieDetails, searchSeries, getSeriesDetails, getSeasonDetails,
  downloadImage, localPosterPath,
} from './tmdb';
import { config, IMAGES_DIR } from '../config';
import { logger } from '../lib/logger';

const VIDEO_EXTS = new Set(['.mkv', '.mp4', '.avi', '.m4v', '.mov', '.wmv']);
const EPISODE_RE = /[Ss](\d{1,2})[Ee](\d{1,2})/;
const MOVIE_YEAR_RE = /^(.+?)[\s._]+[\(\[]((?:19|20)\d{2})[\)\]].*$/;
const MOVIE_YEAR_DOT_RE = /^(.+?)[\s._]((?:19|20)\d{2})[\s._].*$/;

function makeSortTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, '$1_')
    .trim();
}

function* walkDir(dir: string): Generator<string> {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(full);
    } else if (entry.isFile() && VIDEO_EXTS.has(extname(entry.name).toLowerCase())) {
      yield full;
    }
  }
}

function parseEpisodeFilename(filePath: string): { seriesName: string; season: number; episode: number } | null {
  const name = basename(filePath, extname(filePath));
  const m = name.match(EPISODE_RE);
  if (!m) return null;
  const idx = name.search(EPISODE_RE);
  const seriesName = name.slice(0, idx).replace(/[._-]+$/, '').replace(/[._]/g, ' ').trim();
  return { seriesName, season: parseInt(m[1], 10), episode: parseInt(m[2], 10) };
}

function parseMovieFilename(filePath: string): { title: string; year?: number } {
  const name = basename(filePath, extname(filePath));
  let m = name.match(MOVIE_YEAR_RE);
  if (m) return { title: m[1].replace(/[._]/g, ' ').trim(), year: parseInt(m[2], 10) };
  m = name.match(MOVIE_YEAR_DOT_RE);
  if (m) return { title: m[1].replace(/[._]/g, ' ').trim(), year: parseInt(m[2], 10) };
  return { title: name.replace(/[._]/g, ' ').trim() };
}

function isEpisodePath(filePath: string): boolean {
  if (EPISODE_RE.test(basename(filePath))) return true;
  const parts = filePath.replace(config.MEDIA_ROOT, '').split(/[\\/]/);
  return parts.some((p) => /^(shows?|tv|series|television)/i.test(p));
}

async function enrichMovie(mediaItemId: number, title: string, year?: number): Promise<void> {
  try {
    const result = await searchMovie(title, year);
    if (!result) return;
    const details = await getMovieDetails(result.id);
    const movie = details ?? result;

    const posterLocalPath = movie.poster_path
      ? localPosterPath(movie.id, 'poster')
      : null;
    const backdropLocalPath = movie.backdrop_path
      ? localPosterPath(movie.id, 'backdrop')
      : null;

    if (movie.poster_path && posterLocalPath && !existsSync(posterLocalPath)) {
      await downloadImage(movie.poster_path, posterLocalPath);
    }
    if (movie.backdrop_path && backdropLocalPath && !existsSync(backdropLocalPath)) {
      await downloadImage(movie.backdrop_path, backdropLocalPath);
    }

    await db.update(mediaItems)
      .set({
        tmdbId: movie.id,
        imdbId: movie.imdb_id ?? null,
        overview: movie.overview ?? null,
        posterPath: posterLocalPath,
        backdropPath: backdropLocalPath,
        rating: movie.vote_average ?? null,
        genres: JSON.stringify((movie.genres ?? []).map((g) => g.name)),
        tmdbFetchedAt: Date.now(),
      })
      .where(eq(mediaItems.id, mediaItemId));
  } catch (err) {
    logger.warn({ err, title }, 'Movie enrichment failed');
  }
}

async function enrichSeries(mediaItemId: number, title: string): Promise<void> {
  try {
    const series = await searchSeries(title);
    if (!series) return;
    const details = await getSeriesDetails(series.id);
    const data = details ?? series;

    const posterLocalPath = data.poster_path
      ? localPosterPath(data.id, 'poster')
      : null;
    const backdropLocalPath = data.backdrop_path
      ? localPosterPath(data.id, 'backdrop')
      : null;

    if (data.poster_path && posterLocalPath && !existsSync(posterLocalPath)) {
      await downloadImage(data.poster_path, posterLocalPath);
    }
    if (data.backdrop_path && backdropLocalPath && !existsSync(backdropLocalPath)) {
      await downloadImage(data.backdrop_path, backdropLocalPath);
    }

    await db.update(mediaItems)
      .set({
        tmdbId: data.id,
        overview: data.overview ?? null,
        posterPath: posterLocalPath,
        backdropPath: backdropLocalPath,
        rating: data.vote_average ?? null,
        genres: JSON.stringify((data.genres ?? []).map((g) => g.name)),
        tmdbFetchedAt: Date.now(),
      })
      .where(eq(mediaItems.id, mediaItemId));

    // Enrich seasons
    for (const s of data.seasons ?? []) {
      if (s.season_number === 0) continue;
      const seasonRows = db.select().from(seasons)
        .where(eq(seasons.seriesId, mediaItemId))
        .all();
      const seasonRow = seasonRows.find((r) => r.seasonNumber === s.season_number);

      if (!seasonRow) continue;

      const posterPath = s.poster_path ? localPosterPath(data.id, 'poster', `_s${s.season_number}`) : null;
      if (s.poster_path && posterPath && !existsSync(posterPath)) {
        await downloadImage(s.poster_path, posterPath);
      }

      await db.update(seasons)
        .set({
          title: s.name ?? null,
          overview: s.overview ?? null,
          posterPath,
          airDate: s.air_date ?? null,
        })
        .where(eq(seasons.id, seasonRow.id));

      // Enrich episodes in this season
      const seasonDetails = await getSeasonDetails(data.id, s.season_number);
      if (!seasonDetails) continue;

      for (const ep of seasonDetails.episodes) {
        const stillPath = ep.still_path
          ? localPosterPath(data.id, 'still', `_s${s.season_number}e${ep.episode_number}`)
          : null;
        if (ep.still_path && stillPath && !existsSync(stillPath)) {
          await downloadImage(ep.still_path, stillPath);
        }

        await db.update(episodes)
          .set({
            title: ep.name ?? null,
            overview: ep.overview ?? null,
            stillPath,
            airDate: ep.air_date ?? null,
            durationSec: ep.runtime ? ep.runtime * 60 : null,
          })
          .where(and(
            eq(episodes.seriesId, mediaItemId),
            eq(episodes.seasonNumber, s.season_number),
            eq(episodes.episodeNumber, ep.episode_number),
          ));
      }
    }
  } catch (err) {
    logger.warn({ err, title }, 'Series enrichment failed');
  }
}

export async function runScan(): Promise<{ movies: number; episodes: number }> {
  logger.info({ mediaRoot: config.MEDIA_ROOT }, 'Library scan started');
  let movieCount = 0;
  let episodeCount = 0;

  const allFiles = [...walkDir(config.MEDIA_ROOT)];
  const episodeFiles = allFiles.filter(isEpisodePath);
  const movieFiles = allFiles.filter((f) => !isEpisodePath(f));

  // --- Movies ---
  for (const filePath of movieFiles) {
    try {
      const existing = await db.select().from(mediaItems).where(eq(mediaItems.filePath, filePath)).get();
      const stat = statSync(filePath);

      if (existing && existing.fileSize === stat.size) continue;

      const { title, year } = parseMovieFilename(filePath);
      const probe = await probeFile(filePath);

      const values = {
        type: 'movie' as const,
        title,
        sortTitle: makeSortTitle(title),
        year: year ?? null,
        filePath,
        durationSec: Math.round(probe.durationSec),
        fileSize: stat.size,
        codecVideo: probe.codecVideo,
        codecAudio: probe.codecAudio,
        container: probe.container,
        isDirectPlay: probe.isDirectPlay,
        scannedAt: Date.now(),
      };

      if (existing) {
        await db.update(mediaItems).set(values).where(eq(mediaItems.id, existing.id));
        movieCount++;
      } else {
        const [inserted] = await db.insert(mediaItems).values(values).returning();
        movieCount++;
        enrichMovie(inserted.id, title, year).catch(() => {});
      }
    } catch (err) {
      logger.warn({ err, filePath }, 'Failed to process movie file');
    }
  }

  // --- Episodes: group by series name ---
  const seriesMap = new Map<string, Array<{ filePath: string; season: number; episode: number }>>();
  for (const filePath of episodeFiles) {
    const parsed = parseEpisodeFilename(filePath);
    if (!parsed) continue;
    const key = parsed.seriesName.toLowerCase();
    if (!seriesMap.has(key)) seriesMap.set(key, []);
    seriesMap.get(key)!.push({ filePath, season: parsed.season, episode: parsed.episode });
  }

  for (const [, epFiles] of seriesMap) {
    const seriesName = parseEpisodeFilename(epFiles[0].filePath)!.seriesName;
    try {
      let seriesRow = await db.select().from(mediaItems)
        .where(eq(mediaItems.sortTitle, makeSortTitle(seriesName)))
        .get();

      if (!seriesRow) {
        const [inserted] = await db.insert(mediaItems).values({
          type: 'series',
          title: seriesName,
          sortTitle: makeSortTitle(seriesName),
          scannedAt: Date.now(),
        }).returning();
        seriesRow = inserted;
        enrichSeries(seriesRow.id, seriesName).catch(() => {});
      }

      // Upsert seasons and episodes
      const seasonNumbers = [...new Set(epFiles.map((e) => e.season))];
      for (const seasonNum of seasonNumbers) {
        const existingSeasons = db.select().from(seasons)
          .where(eq(seasons.seriesId, seriesRow.id))
          .all();
        let seasonRow = existingSeasons.find((r) => r.seasonNumber === seasonNum);

        if (!seasonRow) {
          const [inserted] = await db.insert(seasons).values({
            seriesId: seriesRow.id,
            seasonNumber: seasonNum,
          }).returning();
          seasonRow = inserted;
        }

        const seasonEps = epFiles.filter((e) => e.season === seasonNum);
        for (const { filePath, episode } of seasonEps) {
          try {
            const stat = statSync(filePath);
            const existingEps = db.select().from(episodes)
              .where(and(eq(episodes.seriesId, seriesRow!.id), eq(episodes.seasonNumber, seasonNum), eq(episodes.episodeNumber, episode)))
              .all();
            const existing = existingEps[0] ?? null;

            if (existing && existing.fileSize === stat.size) continue;

            const probe = await probeFile(filePath);
            const values = {
              seriesId: seriesRow!.id,
              seasonId: seasonRow!.id,
              seasonNumber: seasonNum,
              episodeNumber: episode,
              filePath,
              durationSec: Math.round(probe.durationSec),
              fileSize: stat.size,
              codecVideo: probe.codecVideo,
              codecAudio: probe.codecAudio,
              container: probe.container,
              isDirectPlay: probe.isDirectPlay,
              scannedAt: Date.now(),
            };

            if (existing) {
              await db.update(episodes).set(values).where(eq(episodes.id, existing.id));
            } else {
              await db.insert(episodes).values(values).onConflictDoUpdate({
                target: [episodes.seriesId, episodes.seasonNumber, episodes.episodeNumber],
                set: values,
              });
            }
            episodeCount++;
          } catch (err) {
            logger.warn({ err, filePath }, 'Failed to process episode file');
          }
        }
      }
    } catch (err) {
      logger.warn({ err, seriesName }, 'Failed to process series');
    }
  }

  // --- Prune stale entries ---
  const allMovieRows = await db.select({ id: mediaItems.id, filePath: mediaItems.filePath })
    .from(mediaItems).where(eq(mediaItems.type, 'movie')).all();
  for (const row of allMovieRows) {
    if (row.filePath && !existsSync(row.filePath)) {
      await db.delete(mediaItems).where(eq(mediaItems.id, row.id));
    }
  }

  const allEpisodeRows = await db.select({ id: episodes.id, filePath: episodes.filePath }).from(episodes).all();
  for (const row of allEpisodeRows) {
    if (!existsSync(row.filePath)) {
      await db.delete(episodes).where(eq(episodes.id, row.id));
    }
  }

  logger.info({ movies: movieCount, episodes: episodeCount }, 'Library scan complete');
  return { movies: movieCount, episodes: episodeCount };
}
