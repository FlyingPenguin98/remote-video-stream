import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { users } from '../db/schema';
import { badRequest, conflict, unauthorized } from '../lib/errors';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post<{
    Body: { username: string; password: string };
  }>('/login', async (request, reply) => {
    const { username, password } = request.body;
    if (!username || !password) return badRequest(reply, 'username and password required');

    const user = await db.select().from(users).where(eq(users.username, username)).get();
    if (!user) return unauthorized(reply, 'Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return unauthorized(reply, 'Invalid credentials');

    const token = fastify.jwt.sign({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    return reply.send({
      accessToken: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
  });

  fastify.post<{
    Body: { username: string; password: string; email?: string };
  }>('/register', {
    onRequest: [fastify.requireAdmin],
  }, async (request, reply) => {
    const { username, password, email } = request.body;
    if (!username || !password) return badRequest(reply, 'username and password required');
    if (password.length < 8) return badRequest(reply, 'password must be at least 8 characters');

    const existing = await db.select().from(users).where(eq(users.username, username)).get();
    if (existing) return conflict(reply, 'Username already taken');

    const hash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({
      username,
      password: hash,
      email: email ?? null,
      role: 'user',
    }).returning();

    return reply.status(201).send({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    });
  });

  fastify.get('/me', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const user = await db.select().from(users).where(eq(users.id, request.user.userId)).get();
    if (!user) return unauthorized(reply);

    return reply.send({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    });
  });

  fastify.put<{
    Body: { currentPassword?: string; newPassword?: string; email?: string };
  }>('/me', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const { currentPassword, newPassword, email } = request.body;
    const user = await db.select().from(users).where(eq(users.id, request.user.userId)).get();
    if (!user) return unauthorized(reply);

    const updates: Partial<typeof users.$inferInsert> = {
      updatedAt: Date.now(),
    };

    if (email !== undefined) updates.email = email;

    if (newPassword) {
      if (!currentPassword) return badRequest(reply, 'currentPassword required to change password');
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return badRequest(reply, 'Current password is incorrect');
      if (newPassword.length < 8) return badRequest(reply, 'New password must be at least 8 characters');
      updates.password = await bcrypt.hash(newPassword, 12);
    }

    await db.update(users).set(updates).where(eq(users.id, user.id));
    return reply.send({ ok: true });
  });
}
