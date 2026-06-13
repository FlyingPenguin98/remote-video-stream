import { api } from './client';
import type { MediaItem, PaginatedResponse } from '../../../shared/types';

export interface LibraryQuery {
  page?: number;
  limit?: number;
  q?: string;
  sort?: 'title' | 'year' | 'rating';
  order?: 'asc' | 'desc';
}

export const getMovies = (params?: LibraryQuery) =>
  api.get<PaginatedResponse<MediaItem>>('/library/movies', { params }).then((r) => r.data);

export const getMovie = (id: number) =>
  api.get<MediaItem>(`/library/movies/${id}`).then((r) => r.data);

export const getShows = (params?: LibraryQuery) =>
  api.get<PaginatedResponse<MediaItem>>('/library/shows', { params }).then((r) => r.data);

export const getShow = (id: number) =>
  api.get<any>(`/library/shows/${id}`).then((r) => r.data);

export const getContinueWatching = () =>
  api.get<any[]>('/library/continue-watching').then((r) => r.data);

export const getRecentlyAdded = (limit = 20) =>
  api.get<MediaItem[]>('/library/recently-added', { params: { limit } }).then((r) => r.data);

export const triggerScan = () =>
  api.post('/library/scan').then((r) => r.data);
