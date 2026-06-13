import { z } from 'zod';
import { join } from 'path';

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  MEDIA_ROOT: z.string().default('./media'),
  DATA_DIR: z.string().default('./data'),

  FFMPEG_PATH: z.string().default('ffmpeg'),
  FFPROBE_PATH: z.string().default('ffprobe'),

  JWT_SECRET: z.string().min(32).default('change-this-to-a-long-random-string-at-least-32-chars!'),
  JWT_EXPIRY: z.string().default('7d'),

  TMDB_API_KEY: z.string().default(''),
  TMDB_BASE_URL: z.string().default('https://api.themoviedb.org/3'),

  MAX_CONCURRENT_SESSIONS: z.coerce.number().default(2),
  SESSION_TIMEOUT_MS: z.coerce.number().default(300000),
  HLS_SEGMENT_DURATION: z.coerce.number().default(6),
  MAX_VIDEO_BITRATE: z.string().default('4000k'),
  MAX_RESOLUTION: z.coerce.number().default(720),

  SCAN_CRON: z.string().default('0 */2 * * *'),
});

export const config = schema.parse(process.env);

export const DB_PATH = join(config.DATA_DIR, 'streamio.db');
export const IMAGES_DIR = join(config.DATA_DIR, 'images');
export const SEGMENTS_DIR = join(config.DATA_DIR, 'segments');
