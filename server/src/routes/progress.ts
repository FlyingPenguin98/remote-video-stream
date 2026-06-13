import { FastifyInstance } from 'fastify';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { watchProgress } from '../db/schema';
import { badRequest } from '../lib/errors';

export default async function progressRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', fastify.authenticate);

  // PUT /api/progress — upsert playback position
  fastify.put<{
    Body: { mediaItemId: number; episodeId?: number; positionSec: number; durationSec?: number };
  }>('/', async (request, reply) => {
    const { mediaItemId, episodeId, positionSec, durationSec } = request.body;
    if (!mediaItemId || positionSec == null) return badRequest(reply, 'mediaItemId and positionSec required');

    const completed = durationSec ? positionSec / durationSec > 0.9 : false;
    const now = Date.now();

    const existing = episodeId
      ? await db.select().from(watchProgress)
          .where(and(
            eq(watchProgress.userId, request.user.userId),
            eq(watchProgress.mediaItemId, mediaItemId),
            eq(watchProgress.episodeId, episodeId)
          ))
          .get()
      : await db.select().from(watchProgress)
          .where(and(
            eq(watchProgress.userId, request.user.userId),
            eq(watchProgress.mediaItemId, mediaItemId),
            sql`${watchProgress.episodeId} IS NULL`
          ))
          .get();

    if (existing) {
      await db.update(watchProgress)
        .set({ positionSec, durationSec: durationSec ?? null, completed, updatedAt: now })
        .where(eq(watchProgress.id, existing.id));
    } else {
      await db.insert(watchProgress).values({
        userId: request.user.userId,
        mediaItemId,
        episodeId: episodeId ?? null,
        positionSec,
        durationSec: durationSec ?? null,
        completed,
        updatedAt: now,
      });
    }

    return { ok: true };
  });

  // GET /api/progress/:mediaItemId — movie progress
  fastify.get<{ Params: { mediaItemId: string } }>('/:mediaItemId', async (request) => {
    const mediaItemId = parseInt(request.params.mediaItemId, 10);
    const row = await db.select().from(watchProgress)
      .where(and(
        eq(watchProgress.userId, request.user.userId),
        eq(watchProgress.mediaItemId, mediaItemId),
        sql`${watchProgress.episodeId} IS NULL`
      ))
      .get();
    return row ?? null;
  });

  // GET /api/progress/:mediaItemId/:episodeId
  fastify.get<{ Params: { mediaItemId: string; episodeId: string } }>(
    '/:mediaItemId/:episodeId',
    async (request) => {
      const mediaItemId = parseInt(request.params.mediaItemId, 10);
      const episodeId = parseInt(request.params.episodeId, 10);
      const row = await db.select().from(watchProgress)
        .where(and(
          eq(watchProgress.userId, request.user.userId),
          eq(watchProgress.mediaItemId, mediaItemId),
          eq(watchProgress.episodeId, episodeId)
        ))
        .get();
      return row ?? null;
    }
  );
}
