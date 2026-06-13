import { execFile } from 'child_process';
import { promisify } from 'util';
import { config } from '../config';

const execFileAsync = promisify(execFile);

export interface ProbeResult {
  codecVideo: string;
  codecAudio: string;
  container: string;
  durationSec: number;
  fileSize: number;
  width: number;
  height: number;
  isDirectPlay: boolean;
}

const DIRECT_PLAY_VIDEO = new Set(['h264', 'hevc']);
const DIRECT_PLAY_AUDIO = new Set(['aac', 'mp3']);
const DIRECT_PLAY_CONTAINER = new Set(['matroska', 'mov,mp4,m4a,3gp,3g2,mj2', 'mov']);

interface FfprobeOutput {
  streams: Array<{
    codec_type: string;
    codec_name: string;
    width?: number;
    height?: number;
    duration?: string;
  }>;
  format: {
    format_name: string;
    duration?: string;
    size?: string;
  };
}

export async function probeFile(filePath: string): Promise<ProbeResult> {
  const { stdout } = await execFileAsync(
    config.FFPROBE_PATH,
    [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_streams',
      '-show_format',
      filePath,
    ],
    { timeout: 30000 }
  );

  const info = JSON.parse(stdout) as FfprobeOutput;
  const videoStream = info.streams.find((s) => s.codec_type === 'video');
  const audioStream = info.streams.find((s) => s.codec_type === 'audio');

  const codecVideo = videoStream?.codec_name ?? 'unknown';
  const codecAudio = audioStream?.codec_name ?? 'unknown';
  const container = info.format.format_name ?? 'unknown';
  const durationSec = parseFloat(
    videoStream?.duration ?? info.format.duration ?? '0'
  );
  const fileSize = parseInt(info.format.size ?? '0', 10);
  const width = videoStream?.width ?? 0;
  const height = videoStream?.height ?? 0;

  const isDirectPlay =
    DIRECT_PLAY_VIDEO.has(codecVideo) &&
    DIRECT_PLAY_AUDIO.has(codecAudio) &&
    DIRECT_PLAY_CONTAINER.has(container);

  return { codecVideo, codecAudio, container, durationSec, fileSize, width, height, isDirectPlay };
}
