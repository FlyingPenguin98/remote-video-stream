import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { config } from '../config';
import { logger } from './logger';

const execFileAsync = promisify(execFile);

let hwAccelAvailable: boolean | null = null;

export async function probeHwAccel(): Promise<boolean> {
  const hasDevice =
    existsSync('/dev/video10') ||
    existsSync('/dev/video11') ||
    existsSync('/dev/video16');

  if (!hasDevice) {
    hwAccelAvailable = false;
    logger.info('Hardware encoder: no V4L2 device found, using software encoding');
    return false;
  }

  try {
    const { stdout } = await execFileAsync(config.FFMPEG_PATH, ['-hide_banner', '-encoders']);
    hwAccelAvailable = stdout.includes('h264_v4l2m2m');
  } catch {
    hwAccelAvailable = false;
  }

  logger.info({ hwAccelAvailable }, 'Hardware encoder probe complete');
  return hwAccelAvailable;
}

export function isHwAccelAvailable(): boolean {
  return hwAccelAvailable === true;
}
