import cron from 'node-cron';
import { runScan } from './scanner';
import { cleanupStaleSessions } from './transcoder';
import { config } from '../config';
import { logger } from '../lib/logger';

export function startScheduler(): void {
  cron.schedule(config.SCAN_CRON, async () => {
    logger.info('Scheduled library scan triggered');
    try {
      await runScan();
    } catch (err) {
      logger.error({ err }, 'Scheduled scan failed');
    }
  });

  // Clean up stale sessions every 60 seconds
  cron.schedule('* * * * *', async () => {
    try {
      await cleanupStaleSessions();
    } catch (err) {
      logger.error({ err }, 'Session cleanup failed');
    }
  });

  logger.info({ scanCron: config.SCAN_CRON }, 'Scheduler started');
}
