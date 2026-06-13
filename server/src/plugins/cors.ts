import fp from 'fastify-plugin';
import fastifyCors from '@fastify/cors';
import { FastifyInstance } from 'fastify';
import { config } from '../config';

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(fastifyCors, {
    origin: config.NODE_ENV === 'development' ? true : false,
    credentials: true,
  });
});
