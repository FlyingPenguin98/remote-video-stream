package com.streamio.android.data.repository

import com.streamio.android.data.api.StreamioApi
import com.streamio.android.data.api.models.ProgressUpdate
import com.streamio.android.data.api.models.WatchProgress
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProgressRepository @Inject constructor(
    private val api: StreamioApi,
) {

    suspend fun updateProgress(
        mediaItemId: Int,
        episodeId: Int? = null,
        positionSec: Double,
        durationSec: Double? = null,
    ): Result<Unit> = runCatching {
        api.updateProgress(ProgressUpdate(mediaItemId, episodeId, positionSec, durationSec))
    }

    suspend fun getProgress(mediaItemId: Int): WatchProgress? =
        runCatching { api.getProgress(mediaItemId).body() }.getOrNull()

    suspend fun getEpisodeProgress(mediaItemId: Int, episodeId: Int): WatchProgress? =
        runCatching { api.getEpisodeProgress(mediaItemId, episodeId).body() }.getOrNull()
}
