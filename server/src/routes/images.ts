import { FastifyInstance } from 'fastify';
import { createReadStream, existsSync } from 'fs';
import { join, resolve, sep } from 'path';
import { IMAGES_DIR } from '../config';
import { notFound, badRequest } from '../lib/errors';

// Cached TMDb artwork. Served without auth: poster art is not sensitive,
// and <img> tags / native image loaders cannot attach Authorization headers.
export default async function imageRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { '*': string } }>('/images/*', async (request, reply) => {
    const root = resolve(IMAGES_DIR);
    const requested = resolve(join(root, request.params['*']));
    if (requested !== root && !requested.startsWith(root + sep)) {
      return badRequest(reply, 'Invalid path');
    }
    if (!existsSync(requested)) return notFound(reply);

    const ext = requested.split('.').pop() ?? 'jpg';
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    return reply
      .header('Content-Type', mime)
      .header('Cache-Control', 'public, max-age=86400')
      .send(createReadStream(requested));
  });
}
