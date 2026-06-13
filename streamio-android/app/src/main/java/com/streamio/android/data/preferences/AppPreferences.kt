package com.streamio.android.data.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "streamio_prefs")

@Singleton
class AppPreferences @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val serverUrlKey = stringPreferencesKey("server_url")
    private val tokenKey = stringPreferencesKey("token")
    private val usernameKey = stringPreferencesKey("username")
    private val roleKey = stringPreferencesKey("role")

    val serverUrl: Flow<String?> = context.dataStore.data.map { it[serverUrlKey] }
    val token: Flow<String?> = context.dataStore.data.map { it[tokenKey] }
    val username: Flow<String?> = context.dataStore.data.map { it[usernameKey] }
    val role: Flow<String?> = context.dataStore.data.map { it[roleKey] }

    suspend fun setServerUrl(url: String) {
        context.dataStore.edit { it[serverUrlKey] = url.trimEnd('/') }
    }

    suspend fun setAuth(token: String, username: String, role: String) {
        context.dataStore.edit {
            it[tokenKey] = token
            it[usernameKey] = username
            it[roleKey] = role
        }
    }

    suspend fun clearAuth() {
        context.dataStore.edit {
            it.remove(tokenKey)
            it.remove(usernameKey)
            it.remove(roleKey)
        }
    }

    suspend fun clearAll() {
        context.dataStore.edit { it.clear() }
    }
}
