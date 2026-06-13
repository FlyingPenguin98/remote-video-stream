package com.streamio.android.data.repository

import com.streamio.android.data.api.StreamioApi
import com.streamio.android.data.api.models.LoginRequest
import com.streamio.android.data.api.models.User
import com.streamio.android.data.preferences.AppPreferences
import kotlinx.coroutines.flow.first
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val api: StreamioApi,
    private val prefs: AppPreferences,
) {

    suspend fun login(username: String, password: String): Result<User> = runCatching {
        if (prefs.isDemoMode.first()) {
            val name = username.ifBlank { "demo" }
            val user = User(1, name, null, "user", null, System.currentTimeMillis())
            prefs.setAuth("demo-token", user.username, user.role)
            return@runCatching user
        }
        val response = api.login(LoginRequest(username, password))
        val body = response.body() ?: error(response.errorBody()?.string() ?: "Login failed")
        prefs.setAuth(body.accessToken, body.user.username, body.user.role)
        body.user
    }

    suspend fun getMe(): Result<User> = runCatching {
        if (prefs.isDemoMode.first()) {
            val name = prefs.username.first() ?: "demo"
            return@runCatching User(1, name, null, "user", null, System.currentTimeMillis())
        }
        val response = api.getMe()
        response.body() ?: error("Failed to fetch profile")
    }

    suspend fun updatePassword(currentPassword: String, newPassword: String): Result<Unit> = runCatching {
        if (prefs.isDemoMode.first()) return@runCatching Unit
        val response = api.updateMe(
            mapOf("currentPassword" to currentPassword, "newPassword" to newPassword)
        )
        if (!response.isSuccessful) error(response.errorBody()?.string() ?: "Update failed")
    }

    /**
     * Persists the URL (the interceptor reads it from DataStore), probes
     * /api/health, and restores the previous URL if the server is unreachable.
     */
    suspend fun checkHealth(serverUrl: String): Result<Unit> {
        val normalized = normalizeServerUrl(serverUrl)
            ?: return Result.failure(IllegalArgumentException("Invalid server URL"))

        val previous = prefs.serverUrl.first()
        prefs.setServerUrl(normalized)
        return runCatching {
            val response = api.health()
            if (!response.isSuccessful) error("Server returned ${response.code()}")
            Unit
        }.onFailure {
            if (previous != null) prefs.setServerUrl(previous) else prefs.clearServerUrl()
        }
    }

    suspend fun logout() {
        prefs.clearAuth()
    }

    companion object {
        /** Adds an http:// scheme if missing; returns null if still unparseable. */
        fun normalizeServerUrl(raw: String): String? {
            val trimmed = raw.trim().trimEnd('/')
            if (trimmed.isBlank()) return null
            val withScheme =
                if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) trimmed
                else "http://$trimmed"
            return if (withScheme.toHttpUrlOrNull() != null) withScheme else null
        }
    }
}
