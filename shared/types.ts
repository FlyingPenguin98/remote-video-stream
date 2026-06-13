export interface User {
  id: number;
  username: string;
  email: string | null;
  role: 'admin' | 'user';
  avatarUrl: string | null;
  createdAt: number;
}

// Brief progress embedded in library responses
export interface WatchProgressBrief {
  positionSec: number;
  durationSec: number | null;
  completed: boolean;
}

// Formatted media item as returned by the library API
export interface MediaItem {
  id: number;
  type: 'movie' | 'series';
  title: string;
  year: number | null;
  tmdbId: number | null;
  overview: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: number | null;
  genres: string[];
  durationSec: number | null;
  isDirectPlay: boolean;
  scannedAt: number;
  watchProgress?: WatchProgressBrief | null;
}

export interface Season {
  id: number;
  seasonNumber: number;
  title: string | null;
  overview: string | null;
  posterUrl: string | null;
  airDate: string | null;
  episodes: Episode[];
}

export interface Episode {
  id: number;
  seriesId: number;
  seasonId: number;
  seasonNumber: number;
  episodeNumber: number;
  title: string | null;
  overview: string | null;
  stillUrl: string | null;
  airDate: string | null;
  durationSec: number | null;
  isDirectPlay: boolean;
  watchProgress?: WatchProgressBrief | null;
}

export interface ShowDetail extends MediaItem {
  seasons: Season[];
}

// Full progress row as returned by the progress API
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

export interface ContinueWatchingItem {
  mediaItem: MediaItem;
  episode: Episode | null;
  positionSec: number;
  durationSec: number | null;
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
