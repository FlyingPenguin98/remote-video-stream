package com.streamio.android.data.repository

import com.streamio.android.data.api.StreamioApi
import com.streamio.android.data.api.models.LoginRequest
import com.streamio.android.data.api.models.User
import com.streamio.android.data.preferences.AppPreferences
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val api: StreamioApi,
    private val prefs: AppPreferences,
) {

    suspend fun login(username: String, password: String): Result<User> = runCatching {
        val response = api.login(LoginRequest(username, password))
        val body = response.body() ?: error(response.errorBody()?.string() ?: "Login failed")
        prefs.setAuth(body.accessToken, body.user.username, body.user.role)
        body.user
    }

    suspend fun getMe(): Result<User> = runCatching {
        val response = api.getMe()
        response.body() ?: error("Failed to fetch profile")
    }

    suspend fun updatePassword(currentPassword: String, newPassword: String): Result<Unit> = runCatching {
        val response = api.updateMe(
            mapOf("currentPassword" to currentPassword, "newPassword" to newPassword)
        )
        if (!response.isSuccessful) error(response.errorBody()?.string() ?: "Update failed")
    }

    suspend fun checkHealth(serverUrl: String): Result<Unit> = runCatching {
        val savedUrl = prefs.serverUrl
        prefs.setServerUrl(serverUrl)
        val response = api.health()
        if (!response.isSuccessful) error("Server returned ${response.code()}")
    }

    suspend fun logout() {
        prefs.clearAuth()
    }
}
