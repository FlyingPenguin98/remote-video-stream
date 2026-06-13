import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { eq, ne } from 'drizzle-orm';
import { db } from '../db/client';
import { users, transcodeSessions } from '../db/schema';
import { badRequest, conflict, notFound } from '../lib/errors';
import { getActiveSessionCount } from '../services/transcoder';
import { isHwAccelAvailable } from '../lib/hwAccel';
import { config, DB_PATH } from '../config';

export default async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', fastify.requireAdmin);

  // GET /api/admin/users
  fastify.get('/users', async () => {
    const rows = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    }).from(users).all();
    return rows;
  });

  // POST /api/admin/users
  fastify.post<{
    Body: { username: string; password: string; role?: 'admin' | 'user'; email?: string };
  }>('/users', async (request, reply) => {
    const { username, password, role = 'user', email } = request.body;
    if (!username || !password) return badRequest(reply, 'username and password required');
    if (password.length < 8) return badRequest(reply, 'password must be at least 8 characters');

    const existing = await db.select().from(users).where(eq(users.username, username)).get();
    if (existing) return conflict(reply, 'Username already taken');

    const hash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({
      username,
      password: hash,
      role,
      email: email ?? null,
    }).returning();

    return reply.status(201).send({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  });

  // DELETE /api/admin/users/:id
  fastify.delete<{ Params: { id: string } }>('/users/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (id === request.user.userId) return badRequest(reply, 'Cannot delete your own account');
    const user = await db.select().from(users).where(eq(users.id, id)).get();
    if (!user) return notFound(reply);
    await db.delete(users).where(eq(users.id, id));
    return reply.status(204).send();
  });

  // GET /api/admin/sessions
  fastify.get('/sessions', async () => {
    return db.select().from(transcodeSessions).where(eq(transcodeSessions.status, 'active')).all();
  });

  // GET /api/admin/system
  fastify.get('/system', async () => {
    return {
      hwAccelAvailable: isHwAccelAvailable(),
      activeSessionCount: await getActiveSessionCount(),
      dbPath: DB_PATH,
      mediaRoot: config.MEDIA_ROOT,
      dataDir: config.DATA_DIR,
      nodeVersion: process.version,
    };
  });
}
