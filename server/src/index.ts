import { mkdirSync } from 'fs';
import { buildApp } from './app';
import { config, IMAGES_DIR, SEGMENTS_DIR } from './config';
import { probeHwAccel } from './lib/hwAccel';
import { startScheduler } from './services/scheduler';
import { cleanupAllSessions } from './services/transcoder';
import { logger } from './lib/logger';

async function main() {
  // Ensure required directories exist
  mkdirSync(config.DATA_DIR, { recursive: true });
  mkdirSync(IMAGES_DIR, { recursive: true });
  mkdirSync(SEGMENTS_DIR, { recursive: true });

  await probeHwAccel();

  const app = buildApp();

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down...');
    await cleanupAllSessions();
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    startScheduler();
    logger.info({ port: config.PORT, host: config.HOST }, 'Streamio server started');
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

main();
