export interface User {
  id: number;
  username: string;
  email: string | null;
  role: 'admin' | 'user';
  avatarUrl: string | null;
  createdAt: number;
}

export interface MediaItem {
  id: number;
  type: 'movie' | 'series';
  title: string;
  sortTitle: string;
  year: number | null;
  tmdbId: number | null;
  imdbId: string | null;
  overview: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  rating: number | null;
  genres: string[];
  filePath: string | null;
  durationSec: number | null;
  fileSize: number | null;
  codecVideo: string | null;
  codecAudio: string | null;
  container: string | null;
  isDirectPlay: boolean;
  scannedAt: number;
  createdAt: number;
  watchProgress?: WatchProgress | null;
}

export interface Season {
  id: number;
  seriesId: number;
  seasonNumber: number;
  title: string | null;
  overview: string | null;
  posterPath: string | null;
  airDate: string | null;
  episodes?: Episode[];
}

export interface Episode {
  id: number;
  seriesId: number;
  seasonId: number;
  seasonNumber: number;
  episodeNumber: number;
  title: string | null;
  overview: string | null;
  stillPath: string | null;
  airDate: string | null;
  durationSec: number | null;
  filePath: string;
  fileSize: number | null;
  codecVideo: string | null;
  codecAudio: string | null;
  container: string | null;
  isDirectPlay: boolean;
  watchProgress?: WatchProgress | null;
}

export interface WatchProgress {
  id: number;
  userId: number;
  mediaItemId: number;
  episodeId: number | null;
  positionSec: number;
  durationSec: number | null;
  completed: boolean;
  updatedAt: number;
}

export interface StreamSession {
  sessionId: string;
  manifestUrl: string;
  fileUrl?: string;
  isDirect: boolean;
  resumePosition: number;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface SystemInfo {
  hwAccelAvailable: boolean;
  activeSessionCount: number;
  dbPath: string;
  mediaRoot: string;
  dataDir: string;
  nodeVersion: string;
}
