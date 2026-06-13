package com.streamio.android.data.repository

import com.streamio.android.data.api.StreamioApi
import com.streamio.android.data.api.models.StartStreamRequest
import com.streamio.android.data.api.models.StreamSession
import com.streamio.android.data.mock.MockDataSource
import com.streamio.android.data.preferences.AppPreferences
import kotlinx.coroutines.flow.first
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class StreamRepository @Inject constructor(
    private val api: StreamioApi,
    private val prefs: AppPreferences,
) {

    suspend fun startStream(
        mediaItemId: Int? = null,
        episodeId: Int? = null,
        startOffset: Double = 0.0,
    ): Result<StreamSession> {
        if (prefs.isDemoMode.first()) return Result.success(MockDataSource.demoSession)
        return runCatching {
            val body = StartStreamRequest(mediaItemId, episodeId, startOffset)
            val response = api.startStream(body)
            response.body() ?: error(response.errorBody()?.string() ?: "Stream start failed")
        }
    }

    suspend fun stopStream(sessionId: String): Result<Unit> {
        if (prefs.isDemoMode.first()) return Result.success(Unit)
        return runCatching { api.stopStream(sessionId) }
    }

    suspend fun ping(sessionId: String): Result<Unit> {
        if (prefs.isDemoMode.first()) return Result.success(Unit)
        return runCatching { api.ping(sessionId) }
    }

    suspend fun buildManifestUrl(sessionId: String): String {
        val base = prefs.serverUrl.first() ?: "http://localhost:3000"
        return "$base/api/stream/$sessionId/manifest.m3u8"
    }

    suspend fun getToken(): String = prefs.token.first() ?: ""
    suspend fun getServerUrl(): String = prefs.serverUrl.first() ?: "http://localhost:3000"
    suspend fun isDemoMode(): Boolean = prefs.isDemoMode.first()
}
