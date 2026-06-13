import { FastifyReply } from 'fastify';

export function unauthorized(reply: FastifyReply, message = 'Unauthorized') {
  return reply.status(401).send({ error: message });
}

export function forbidden(reply: FastifyReply, message = 'Forbidden') {
  return reply.status(403).send({ error: message });
}

export function notFound(reply: FastifyReply, message = 'Not found') {
  return reply.status(404).send({ error: message });
}

export function badRequest(reply: FastifyReply, message: string) {
  return reply.status(400).send({ error: message });
}

export function conflict(reply: FastifyReply, message: string) {
  return reply.status(409).send({ error: message });
}

export function tooManyRequests(reply: FastifyReply, message: string) {
  return reply.status(429).send({ error: message });
}

export function serverError(reply: FastifyReply, message = 'Internal server error') {
  return reply.status(500).send({ error: message });
}
