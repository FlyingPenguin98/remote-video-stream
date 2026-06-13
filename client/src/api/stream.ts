import { api } from './client';
import type { StreamSession } from '../../../shared/types';

export interface StartStreamParams {
  mediaItemId?: number;
  episodeId?: number;
  startOffset?: number;
}

export const startStream = (params: StartStreamParams) =>
  api.post<StreamSession>('/stream/start', params).then((r) => r.data);

export const stopStream = (sessionId: string) =>
  api.delete(`/stream/${sessionId}`).catch(() => {});

export const pingStream = (sessionId: string, position: number) =>
  api.post(`/stream/${sessionId}/ping`, { position }).catch(() => {});

export function buildManifestUrl(sessionId: string): string {
  const token = localStorage.getItem('token') ?? '';
  return `/api/stream/${sessionId}/manifest.m3u8?token=${encodeURIComponent(token)}`;
}

export function buildDirectUrl(id: number, type: 'movie' | 'episode'): string {
  const token = localStorage.getItem('token') ?? '';
  return `/api/stream/files/${id}?type=${type}&token=${encodeURIComponent(token)}`;
}
