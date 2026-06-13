import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import authPlugin from './plugins/auth';
import corsPlugin from './plugins/cors';
import staticPlugin from './plugins/static';
import authRoutes from './routes/auth';
import libraryRoutes from './routes/library';
import streamRoutes from './routes/stream';
import progressRoutes from './routes/progress';
import adminRoutes from './routes/admin';
import { logger } from './lib/logger';

export function buildApp() {
  const fastify = Fastify({ logger });

  fastify.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1'],
  });

  fastify.register(corsPlugin);
  fastify.register(authPlugin);
  fastify.register(staticPlugin);

  fastify.register(authRoutes, { prefix: '/api/auth' });
  fastify.register(libraryRoutes, { prefix: '/api/library' });
  fastify.register(streamRoutes, { prefix: '/api/stream' });
  fastify.register(progressRoutes, { prefix: '/api/progress' });
  fastify.register(adminRoutes, { prefix: '/api/admin' });

  fastify.get('/api/health', async () => ({ ok: true, ts: Date.now() }));

  return fastify;
}
