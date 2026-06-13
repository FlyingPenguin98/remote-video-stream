package com.streamio.android.data.api.models

import com.google.gson.annotations.SerializedName

data class User(
    val id: Int,
    val username: String,
    val email: String?,
    val role: String,
    val avatarUrl: String?,
    val createdAt: Long,
)

data class AuthResponse(
    val accessToken: String,
    val user: User,
)

data class LoginRequest(
    val username: String,
    val password: String,
)

data class MediaItem(
    val id: Int,
    val type: String,
    val title: String,
    val year: Int?,
    val tmdbId: Int?,
    val overview: String?,
    val posterUrl: String?,
    val backdropUrl: String?,
    val rating: Double?,
    val genres: List<String>,
    val durationSec: Int?,
    val isDirectPlay: Boolean,
    val scannedAt: Long,
    val watchProgress: WatchProgressBrief?,
)

data class WatchProgressBrief(
    val positionSec: Double,
    val durationSec: Double?,
    val completed: Boolean,
)

data class Season(
    val id: Int,
    val seasonNumber: Int,
    val title: String?,
    val overview: String?,
    val posterUrl: String?,
    val airDate: String?,
    val episodes: List<Episode>,
)

data class Episode(
    val id: Int,
    val seriesId: Int,
    val seasonNumber: Int,
    val episodeNumber: Int,
    val title: String?,
    val overview: String?,
    val stillUrl: String?,
    val airDate: String?,
    val durationSec: Int?,
    val isDirectPlay: Boolean,
    val watchProgress: WatchProgressBrief?,
)

data class ShowDetail(
    val id: Int,
    val type: String,
    val title: String,
    val year: Int?,
    val tmdbId: Int?,
    val overview: String?,
    val posterUrl: String?,
    val backdropUrl: String?,
    val rating: Double?,
    val genres: List<String>,
    val seasons: List<Season>,
)

data class WatchProgress(
    val id: Int,
    val userId: Int,
    val mediaItemId: Int,
    val episodeId: Int?,
    val positionSec: Double,
    val durationSec: Double?,
    val completed: Boolean,
    val updatedAt: Long,
)

data class PaginatedResponse<T>(
    val items: List<T>,
    val total: Int,
    val page: Int,
    val pages: Int,
)

data class StreamSession(
    val sessionId: String,
    val manifestUrl: String,
    val fileUrl: String?,
    val isDirect: Boolean,
)

data class StartStreamRequest(
    val mediaItemId: Int?,
    val episodeId: Int?,
    val startOffset: Double,
)

data class ProgressUpdate(
    val mediaItemId: Int,
    val episodeId: Int?,
    val positionSec: Double,
    val durationSec: Double?,
)

data class ContinueWatchingItem(
    val mediaItem: MediaItem,
    val episode: Episode?,
    val positionSec: Double,
    val durationSec: Double?,
    val updatedAt: Long,
)

data class SystemInfo(
    val hwAccelAvailable: Boolean,
    val activeSessionCount: Int,
    val dbPath: String,
    val mediaRoot: String,
    val dataDir: String,
    val nodeVersion: String,
)

data class HealthResponse(
    val ok: Boolean,
    val ts: Long,
)
