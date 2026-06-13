import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string): Promise<string> => new Promise((res) => rl.question(q, res));

async function main() {
  // Import db after dotenv is loaded if needed
  const { db } = await import('../server/src/db/client');
  const { users } = await import('../server/src/db/schema');
  const { eq } = await import('drizzle-orm');

  console.log('Create a new user\n');
  const username = (await ask('Username: ')).trim();
  const password = (await ask('Password (min 8 chars): ')).trim();
  const role = (await ask('Role [user/admin]: ')).trim() as 'user' | 'admin';
  rl.close();

  if (!username || password.length < 8) {
    console.error('Invalid input');
    process.exit(1);
  }

  const existing = await db.select().from(users).where(eq(users.username, username)).get();
  if (existing) {
    console.error('Username already taken');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(users).values({
    username,
    password: hash,
    role: role === 'admin' ? 'admin' : 'user',
  }).returning();

  console.log(`\nCreated user: ${user.username} (${user.role}) — id=${user.id}`);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
