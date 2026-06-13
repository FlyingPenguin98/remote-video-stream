import { FastifyInstance } from 'fastify';
import { createReadStream, statSync, existsSync } from 'fs';
import { join } from 'path';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client';
import { mediaItems, episodes, transcodeSessions } from '../db/schema';
import { startStream, stopStream, pingSession, getActiveSessionCount } from '../services/transcoder';
import { notFound, badRequest, tooManyRequests, serverError, forbidden } from '../lib/errors';
import { config, SEGMENTS_DIR, IMAGES_DIR } from '../config';

export default async function streamRoutes(fastify: FastifyInstance) {
  // POST /api/stream/start
  fastify.post<{
    Body: { mediaItemId?: number; episodeId?: number; startOffset?: number };
  }>('/start', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const { mediaItemId, episodeId, startOffset = 0 } = request.body;
    if (!mediaItemId && !episodeId) return badRequest(reply, 'mediaItemId or episodeId required');

    let filePath: string;
    let resolvedMediaItemId: number | undefined = mediaItemId;

    if (episodeId) {
      const ep = await db.select().from(episodes).where(eq(episodes.id, episodeId)).get();
      if (!ep) return notFound(reply);
      filePath = ep.filePath;
      resolvedMediaItemId = mediaItemId ?? ep.seriesId;
    } else {
      const item = await db.select().from(mediaItems).where(eq(mediaItems.id, mediaItemId!)).get();
      if (!item) return notFound(reply);
      if (!item.filePath) return badRequest(reply, 'No file associated with this item');
      filePath = item.filePath;
    }

    if (!existsSync(filePath)) return notFound(reply, 'Media file not found on disk');

    try {
      const result = await startStream({
        userId: request.user.userId,
        filePath,
        startOffset,
        mediaItemId: resolvedMediaItemId,
        episodeId,
      });
      return reply.send(result);
    } catch (err: any) {
      if (err.statusCode === 429) return tooManyRequests(reply, 'Maximum concurrent streams reached');
      fastify.log.error(err);
      return serverError(reply, err.message);
    }
  });

  // GET /api/stream/:sessionId/manifest.m3u8 — JWT via query param for hls.js
  fastify.get<{ Params: { sessionId: string }; Querystring: { token?: string } }>(
    '/:sessionId/manifest.m3u8',
    async (request, reply) => {
      const { sessionId } = request.params;
      const token = request.query.token ?? request.headers.authorization?.replace('Bearer ', '');
      if (!token) return reply.status(401).send({ error: 'Unauthorized' });

      let user: { userId: number; role: string };
      try {
        user = fastify.jwt.verify(token);
      } catch {
        return reply.status(401).send({ error: 'Invalid token' });
      }

      const session = await db.select().from(transcodeSessions)
        .where(and(eq(transcodeSessions.id, sessionId), eq(transcodeSessions.userId, user.userId)))
        .get();
      if (!session) return notFound(reply);

      const manifestPath = join(session.segmentDir, 'manifest.m3u8');
      if (!existsSync(manifestPath)) return notFound(reply, 'Manifest not ready');

      return reply
        .header('Content-Type', 'application/vnd.apple.mpegurl')
        .header('Cache-Control', 'no-cache')
        .send(createReadStream(manifestPath));
    }
  );

  // GET /api/stream/:sessionId/:filename — serve .ts segments
  fastify.get<{ Params: { sessionId: string; filename: string }; Querystring: { token?: string } }>(
    '/:sessionId/:filename',
    async (request, reply) => {
      const { sessionId, filename } = request.params;
      if (!filename.endsWith('.ts')) return badRequest(reply, 'Invalid segment');

      const token = request.query.token ?? request.headers.authorization?.replace('Bearer ', '');
      if (!token) return reply.status(401).send({ error: 'Unauthorized' });

      let user: { userId: number };
      try {
        user = fastify.jwt.verify(token);
      } catch {
        return reply.status(401).send({ error: 'Invalid token' });
      }

      const session = await db.select().from(transcodeSessions)
        .where(and(eq(transcodeSessions.id, sessionId), eq(transcodeSessions.userId, user.userId)))
        .get();
      if (!session) return notFound(reply);

      const segPath = join(session.segmentDir, filename);
      if (!existsSync(segPath)) return notFound(reply, 'Segment not found');

      return reply
        .header('Content-Type', 'video/mp2t')
        .header('Cache-Control', 'public, max-age=3600')
        .send(createReadStream(segPath));
    }
  );

  // POST /api/stream/:sessionId/ping
  fastify.post<{ Params: { sessionId: string }; Body: { position?: number } }>(
    '/:sessionId/ping',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const { sessionId } = request.params;
      const session = await db.select().from(transcodeSessions)
        .where(and(eq(transcodeSessions.id, sessionId), eq(transcodeSessions.userId, request.user.userId)))
        .get();
      if (!session) return notFound(reply);
      await pingSession(sessionId);
      return { ok: true };
    }
  );

  // DELETE /api/stream/:sessionId
  fastify.delete<{ Params: { sessionId: string } }>(
    '/:sessionId',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const { sessionId } = request.params;
      const session = await db.select().from(transcodeSessions)
        .where(eq(transcodeSessions.id, sessionId))
        .get();
      if (!session) return reply.status(204).send();
      if (session.userId !== request.user.userId && request.user.role !== 'admin') {
        return forbidden(reply);
      }
      await stopStream(sessionId);
      return reply.status(204).send();
    }
  );

  // GET /api/files/:id — direct play with byte-range
  fastify.get<{ Params: { id: string }; Querystring: { token?: string; type?: string } }>(
    '/files/:id',
    async (request, reply) => {
      const token = request.query.token ?? request.headers.authorization?.replace('Bearer ', '');
      if (!token) return reply.status(401).send({ error: 'Unauthorized' });
      try { fastify.jwt.verify(token); } catch {
        return reply.status(401).send({ error: 'Invalid token' });
      }

      const id = parseInt(request.params.id, 10);
      const type = request.query.type;

      let filePath: string | null = null;
      let container = 'mp4';

      if (type === 'episode') {
        const ep = await db.select().from(episodes).where(eq(episodes.id, id)).get();
        if (!ep) return notFound(reply);
        filePath = ep.filePath;
        container = ep.container ?? 'mp4';
      } else {
        const item = await db.select().from(mediaItems).where(eq(mediaItems.id, id)).get();
        if (!item || !item.filePath) return notFound(reply);
        filePath = item.filePath;
        container = item.container ?? 'mp4';
      }

      if (!existsSync(filePath)) return notFound(reply, 'File not found on disk');

      const stat = statSync(filePath);
      const total = stat.size;
      const mimeType = container.includes('matroska') ? 'video/x-matroska' : 'video/mp4';

      const rangeHeader = request.headers.range;
      if (rangeHeader) {
        const [, rangeStr] = rangeHeader.replace(/bytes=/, '').split('-');
        const start = parseInt(rangeHeader.replace(/bytes=(\d+)-.*/, '$1'), 10);
        const end = rangeStr ? parseInt(rangeStr, 10) : Math.min(start + 1024 * 1024, total - 1);
        const chunkSize = end - start + 1;

        return reply
          .status(206)
          .header('Content-Range', `bytes ${start}-${end}/${total}`)
          .header('Accept-Ranges', 'bytes')
          .header('Content-Length', chunkSize)
          .header('Content-Type', mimeType)
          .send(createReadStream(filePath, { start, end }));
      }

      return reply
        .header('Accept-Ranges', 'bytes')
        .header('Content-Length', total)
        .header('Content-Type', mimeType)
        .send(createReadStream(filePath));
    }
  );

  // GET /api/images/* — serve cached TMDb images
  fastify.get<{ Params: { '*': string } }>(
    '/images/*',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const imgPath = join(IMAGES_DIR, request.params['*']);
      if (!existsSync(imgPath)) return notFound(reply);
      const ext = imgPath.split('.').pop() ?? 'jpg';
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      return reply
        .header('Content-Type', mime)
        .header('Cache-Control', 'public, max-age=86400')
        .send(createReadStream(imgPath));
    }
  );
}
