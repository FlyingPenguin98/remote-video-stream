import { FastifyInstance } from 'fastify';
import { eq, like, desc, asc, and, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { mediaItems, seasons, episodes, watchProgress } from '../db/schema';
import { runScan } from '../services/scanner';
import { notFound, forbidden } from '../lib/errors';
import { IMAGES_DIR } from '../config';

function formatMediaItem(row: typeof mediaItems.$inferSelect, progress?: typeof watchProgress.$inferSelect | null) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    year: row.year,
    tmdbId: row.tmdbId,
    overview: row.overview,
    posterUrl: row.posterPath ? row.posterPath.replace(IMAGES_DIR, '/api/images') : null,
    backdropUrl: row.backdropPath ? row.backdropPath.replace(IMAGES_DIR, '/api/images') : null,
    rating: row.rating,
    genres: JSON.parse(row.genres ?? '[]') as string[],
    durationSec: row.durationSec,
    isDirectPlay: row.isDirectPlay,
    scannedAt: row.scannedAt,
    watchProgress: progress
      ? { positionSec: progress.positionSec, durationSec: progress.durationSec, completed: progress.completed }
      : null,
  };
}

function formatEpisode(ep: typeof episodes.$inferSelect, progress?: typeof watchProgress.$inferSelect | null) {
  return {
    id: ep.id,
    seriesId: ep.seriesId,
    seasonId: ep.seasonId,
    seasonNumber: ep.seasonNumber,
    episodeNumber: ep.episodeNumber,
    title: ep.title,
    overview: ep.overview,
    stillUrl: ep.stillPath ? ep.stillPath.replace(IMAGES_DIR, '/api/images') : null,
    airDate: ep.airDate,
    durationSec: ep.durationSec,
    isDirectPlay: ep.isDirectPlay,
    watchProgress: progress
      ? { positionSec: progress.positionSec, durationSec: progress.durationSec, completed: progress.completed }
      : null,
  };
}

export default async function libraryRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', fastify.authenticate);

  // GET /api/library/movies
  fastify.get<{
    Querystring: { page?: string; limit?: string; q?: string; sort?: string; order?: string };
  }>('/movies', async (request) => {
    const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
    const limit = Math.min(100, parseInt(request.query.limit ?? '50', 10));
    const offset = (page - 1) * limit;
    const q = request.query.q;
    const sortCol = request.query.sort === 'year' ? mediaItems.year
      : request.query.sort === 'rating' ? mediaItems.rating
      : mediaItems.sortTitle;
    const order = request.query.order === 'desc' ? desc(sortCol) : asc(sortCol);

    const where = and(
      eq(mediaItems.type, 'movie'),
      q ? like(mediaItems.title, `%${q}%`) : undefined
    );

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(mediaItems).where(where);
    const rows = await db.select().from(mediaItems).where(where).orderBy(order).limit(limit).offset(offset).all();

    const progressRows = rows.length
      ? await db.select().from(watchProgress)
          .where(and(
            eq(watchProgress.userId, request.user.userId),
            sql`${watchProgress.mediaItemId} IN (${sql.raw(rows.map((r) => r.id).join(','))})`,
            sql`${watchProgress.episodeId} IS NULL`
          ))
          .all()
      : [];
    const progressMap = new Map(progressRows.map((p) => [p.mediaItemId, p]));

    return {
      items: rows.map((r) => formatMediaItem(r, progressMap.get(r.id))),
      total: count,
      page,
      pages: Math.ceil(count / limit),
    };
  });

  // GET /api/library/movies/:id
  fastify.get<{ Params: { id: string } }>('/movies/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const row = await db.select().from(mediaItems).where(and(eq(mediaItems.id, id), eq(mediaItems.type, 'movie'))).get();
    if (!row) return notFound(reply);

    const progress = await db.select().from(watchProgress)
      .where(and(
        eq(watchProgress.userId, request.user.userId),
        eq(watchProgress.mediaItemId, id),
        sql`${watchProgress.episodeId} IS NULL`
      ))
      .get();

    return formatMediaItem(row, progress);
  });

  // GET /api/library/shows
  fastify.get<{
    Querystring: { page?: string; limit?: string; q?: string; sort?: string; order?: string };
  }>('/shows', async (request) => {
    const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
    const limit = Math.min(100, parseInt(request.query.limit ?? '50', 10));
    const offset = (page - 1) * limit;
    const q = request.query.q;

    const where = and(
      eq(mediaItems.type, 'series'),
      q ? like(mediaItems.title, `%${q}%`) : undefined
    );

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(mediaItems).where(where);
    const rows = await db.select().from(mediaItems).where(where)
      .orderBy(asc(mediaItems.sortTitle)).limit(limit).offset(offset).all();

    return {
      items: rows.map((r) => formatMediaItem(r)),
      total: count,
      page,
      pages: Math.ceil(count / limit),
    };
  });

  // GET /api/library/shows/:id
  fastify.get<{ Params: { id: string } }>('/shows/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const row = await db.select().from(mediaItems).where(and(eq(mediaItems.id, id), eq(mediaItems.type, 'series'))).get();
    if (!row) return notFound(reply);

    const allSeasons = await db.select().from(seasons).where(eq(seasons.seriesId, id))
      .orderBy(asc(seasons.seasonNumber)).all();
    const allEpisodes = await db.select().from(episodes).where(eq(episodes.seriesId, id))
      .orderBy(asc(episodes.seasonNumber), asc(episodes.episodeNumber)).all();

    const progressRows = allEpisodes.length
      ? await db.select().from(watchProgress)
          .where(and(
            eq(watchProgress.userId, request.user.userId),
            sql`${watchProgress.episodeId} IN (${sql.raw(allEpisodes.map((e) => e.id).join(','))})`
          ))
          .all()
      : [];
    const progressMap = new Map(progressRows.map((p) => [p.episodeId!, p]));

    const seasonsWithEpisodes = allSeasons.map((s) => ({
      id: s.id,
      seasonNumber: s.seasonNumber,
      title: s.title,
      overview: s.overview,
      posterUrl: s.posterPath ? s.posterPath.replace(IMAGES_DIR, '/api/images') : null,
      airDate: s.airDate,
      episodes: allEpisodes
        .filter((e) => e.seasonId === s.id)
        .map((e) => formatEpisode(e, progressMap.get(e.id))),
    }));

    return { ...formatMediaItem(row), seasons: seasonsWithEpisodes };
  });

  // GET /api/library/continue-watching
  fastify.get('/continue-watching', async (request) => {
    const rows = await db.select({
      progress: watchProgress,
      media: mediaItems,
      episode: episodes,
    })
      .from(watchProgress)
      .innerJoin(mediaItems, eq(watchProgress.mediaItemId, mediaItems.id))
      .leftJoin(episodes, eq(watchProgress.episodeId, episodes.id))
      .where(and(
        eq(watchProgress.userId, request.user.userId),
        eq(watchProgress.completed, false),
        sql`${watchProgress.positionSec} > 0`
      ))
      .orderBy(desc(watchProgress.updatedAt))
      .limit(20)
      .all();

    return rows.map(({ progress, media, episode }) => ({
      mediaItem: formatMediaItem(media),
      episode: episode ? formatEpisode(episode) : null,
      positionSec: progress.positionSec,
      durationSec: progress.durationSec,
      updatedAt: progress.updatedAt,
    }));
  });

  // GET /api/library/recently-added
  fastify.get<{ Querystring: { limit?: string } }>('/recently-added', async (request) => {
    const limit = Math.min(50, parseInt(request.query.limit ?? '20', 10));
    const rows = await db.select().from(mediaItems)
      .orderBy(desc(mediaItems.scannedAt)).limit(limit).all();
    return rows.map((r) => formatMediaItem(r));
  });

  // POST /api/library/scan
  fastify.post('/scan', {
    onRequest: [fastify.requireAdmin],
  }, async (request, reply) => {
    if (request.user.role !== 'admin') return forbidden(reply);
    runScan().catch((err) => fastify.log.error(err, 'Scan error'));
    return { queued: true };
  });
}
