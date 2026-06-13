import { mkdirSync, rmSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { eq, lt, or } from 'drizzle-orm';
import { db } from '../db/client';
import { transcodeSessions } from '../db/schema';
import { config, SEGMENTS_DIR } from '../config';
import { isHwAccelAvailable } from '../lib/hwAccel';
import { logger } from '../lib/logger';

export interface StartStreamOptions {
  userId: number;
  filePath: string;
  startOffset: number;
  mediaItemId?: number;
  episodeId?: number;
}

export interface StreamResult {
  sessionId: string;
  manifestUrl: string;
  isDirect: false;
}

function buildFfmpegArgs(filePath: string, segmentDir: string, startOffset: number): string[] {
  const useHw = isHwAccelAvailable();
  const videoCodec = useHw ? 'h264_v4l2m2m' : 'libx264';
  const qualityArgs = useHw
    ? ['-b:v', config.MAX_VIDEO_BITRATE, '-maxrate', '4500k', '-bufsize', '9000k']
    : ['-crf', '23', '-preset', 'veryfast', '-b:v', '0'];

  return [
    '-hide_banner',
    '-ss', String(startOffset),
    '-i', filePath,
    '-c:v', videoCodec,
    ...qualityArgs,
    '-vf', `scale=-2:${config.MAX_RESOLUTION}`,
    '-c:a', 'aac',
    '-b:a', '192k',
    '-ac', '2',
    '-f', 'hls',
    '-hls_time', String(config.HLS_SEGMENT_DURATION),
    '-hls_list_size', '0',
    '-hls_segment_type', 'mpegts',
    '-hls_flags', 'independent_segments',
    '-hls_segment_filename', join(segmentDir, 'seg%05d.ts'),
    join(segmentDir, 'manifest.m3u8'),
  ];
}

function waitForFirstSegment(segmentDir: string, timeoutMs = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (existsSync(segmentDir) && readdirSync(segmentDir).some((f) => f.endsWith('.ts'))) {
        return resolve();
      }
      if (Date.now() - start > timeoutMs) {
        return reject(new Error('Timeout waiting for first HLS segment'));
      }
      setTimeout(check, 200);
    };
    check();
  });
}

export async function getActiveSessionCount(): Promise<number> {
  const rows = await db.select().from(transcodeSessions)
    .where(eq(transcodeSessions.status, 'active'))
    .all();
  return rows.length;
}

export async function startStream(opts: StartStreamOptions): Promise<StreamResult> {
  const active = await getActiveSessionCount();
  if (active >= config.MAX_CONCURRENT_SESSIONS) {
    throw Object.assign(new Error('Too many active streams'), { statusCode: 429 });
  }

  const sessionId = uuidv4();
  const segmentDir = join(SEGMENTS_DIR, sessionId);
  mkdirSync(segmentDir, { recursive: true });

  const args = buildFfmpegArgs(opts.filePath, segmentDir, opts.startOffset);

  logger.info({ sessionId, filePath: opts.filePath, useHw: isHwAccelAvailable() }, 'Starting HLS transcode');

  await db.insert(transcodeSessions).values({
    id: sessionId,
    userId: opts.userId,
    mediaItemId: opts.mediaItemId ?? null,
    episodeId: opts.episodeId ?? null,
    filePath: opts.filePath,
    segmentDir,
    startOffset: opts.startOffset,
    status: 'pending',
    lastPing: Date.now(),
  });

  const ffmpeg = spawn(config.FFMPEG_PATH, args, { stdio: ['ignore', 'ignore', 'pipe'] });

  ffmpeg.stderr?.on('data', (chunk: Buffer) => {
    logger.debug({ sessionId }, chunk.toString().trim());
  });

  ffmpeg.on('close', (code) => {
    logger.info({ sessionId, code }, 'ffmpeg process exited');
    db.update(transcodeSessions)
      .set({ status: code === 0 ? 'ended' : 'error', pid: null })
      .where(eq(transcodeSessions.id, sessionId))
      .run();
  });

  await db.update(transcodeSessions)
    .set({ pid: ffmpeg.pid ?? null, status: 'active' })
    .where(eq(transcodeSessions.id, sessionId));

  try {
    await waitForFirstSegment(segmentDir);
  } catch {
    ffmpeg.kill('SIGKILL');
    rmSync(segmentDir, { recursive: true, force: true });
    await db.delete(transcodeSessions).where(eq(transcodeSessions.id, sessionId));
    throw new Error('Transcoder failed to produce segments in time');
  }

  return {
    sessionId,
    manifestUrl: `/api/stream/${sessionId}/manifest.m3u8`,
    isDirect: false,
  };
}

export async function stopStream(sessionId: string): Promise<void> {
  const session = await db.select().from(transcodeSessions)
    .where(eq(transcodeSessions.id, sessionId))
    .get();

  if (!session) return;

  if (session.pid) {
    try { process.kill(session.pid, 'SIGKILL'); } catch { /* already dead */ }
  }

  if (existsSync(session.segmentDir)) {
    rmSync(session.segmentDir, { recursive: true, force: true });
  }

  await db.delete(transcodeSessions).where(eq(transcodeSessions.id, sessionId));
}

export async function pingSession(sessionId: string): Promise<void> {
  await db.update(transcodeSessions)
    .set({ lastPing: Date.now() })
    .where(eq(transcodeSessions.id, sessionId));
}

export async function cleanupStaleSessions(): Promise<void> {
  const cutoff = Date.now() - config.SESSION_TIMEOUT_MS;
  const stale = await db.select().from(transcodeSessions)
    .where(or(
      lt(transcodeSessions.lastPing, cutoff),
      eq(transcodeSessions.status, 'error')
    ))
    .all();

  for (const session of stale) {
    logger.info({ sessionId: session.id }, 'Cleaning up stale session');
    await stopStream(session.id);
  }
}

export async function cleanupAllSessions(): Promise<void> {
  const all = await db.select().from(transcodeSessions).all();
  for (const session of all) {
    if (session.pid) {
      try { process.kill(session.pid, 'SIGKILL'); } catch { /* already dead */ }
    }
    if (existsSync(session.segmentDir)) {
      rmSync(session.segmentDir, { recursive: true, force: true });
    }
  }
  await db.delete(transcodeSessions).all();
}
