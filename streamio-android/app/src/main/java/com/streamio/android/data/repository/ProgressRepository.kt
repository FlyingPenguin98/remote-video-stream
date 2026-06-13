package com.streamio.android.data.repository

import com.streamio.android.data.api.StreamioApi
import com.streamio.android.data.api.models.ProgressUpdate
import com.streamio.android.data.api.models.WatchProgress
import com.streamio.android.data.preferences.AppPreferences
import kotlinx.coroutines.flow.first
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProgressRepository @Inject constructor(
    private val api: StreamioApi,
    private val prefs: AppPreferences,
) {

    suspend fun updateProgress(
        mediaItemId: Int,
        episodeId: Int? = null,
        positionSec: Double,
        durationSec: Double? = null,
    ): Result<Unit> {
        if (prefs.isDemoMode.first()) return Result.success(Unit)
        return runCatching {
            api.updateProgress(ProgressUpdate(mediaItemId, episodeId, positionSec, durationSec))
        }
    }

    suspend fun getProgress(mediaItemId: Int): WatchProgress? {
        if (prefs.isDemoMode.first()) return null
        return runCatching { api.getProgress(mediaItemId).body() }.getOrNull()
    }

    suspend fun getEpisodeProgress(mediaItemId: Int, episodeId: Int): WatchProgress? {
        if (prefs.isDemoMode.first()) return null
        return runCatching { api.getEpisodeProgress(mediaItemId, episodeId).body() }.getOrNull()
    }
}
