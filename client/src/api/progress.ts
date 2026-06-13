import { api } from './client';
import type { WatchProgress } from '../../../shared/types';

export interface ProgressUpdate {
  mediaItemId: number;
  episodeId?: number;
  positionSec: number;
  durationSec?: number;
}

export const updateProgress = (data: ProgressUpdate) =>
  api.put('/progress', data).then((r) => r.data);

export const getProgress = (mediaItemId: number) =>
  api.get<WatchProgress | null>(`/progress/${mediaItemId}`).then((r) => r.data).catch(() => null);

export const getEpisodeProgress = (mediaItemId: number, episodeId: number) =>
  api.get<WatchProgress | null>(`/progress/${mediaItemId}/${episodeId}`).then((r) => r.data).catch(() => null);
