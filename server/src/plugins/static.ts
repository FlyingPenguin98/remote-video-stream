import fp from 'fastify-plugin';
import fastifyStatic from '@fastify/static';
import { FastifyInstance } from 'fastify';
import { join } from 'path';
import { existsSync } from 'fs';

export default fp(async (fastify: FastifyInstance) => {
  const clientDist = join(__dirname, '..', '..', 'public');
  if (existsSync(clientDist)) {
    await fastify.register(fastifyStatic, {
      root: clientDist,
      prefix: '/',
      decorateReply: false,
    });

    // SPA fallback: serve index.html for any non-API route
    fastify.setNotFoundHandler(async (request, reply) => {
      if (!request.url.startsWith('/api')) {
        return reply.sendFile('index.html', clientDist);
      }
      reply.status(404).send({ error: 'Not found' });
    });
  }
});
