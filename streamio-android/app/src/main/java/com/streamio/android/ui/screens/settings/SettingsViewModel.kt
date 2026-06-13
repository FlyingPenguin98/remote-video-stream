package com.streamio.android.ui.screens.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.streamio.android.data.api.models.User
import com.streamio.android.data.preferences.AppPreferences
import com.streamio.android.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsState(
    val username: String = "",
    val role: String = "",
    val serverUrl: String = "",
    val editingServerUrl: Boolean = false,
    val newServerUrl: String = "",
    val validating: Boolean = false,
    val error: String? = null,
    val loggedOut: Boolean = false,
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val prefs: AppPreferences,
    private val authRepo: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(SettingsState())
    val state = _state.asStateFlow()

    init {
        viewModelScope.launch {
            prefs.username.collect { name ->
                _state.update { it.copy(username = name ?: "") }
            }
        }
        viewModelScope.launch {
            prefs.role.collect { r ->
                _state.update { it.copy(role = r ?: "") }
            }
        }
        viewModelScope.launch {
            prefs.serverUrl.collect { url ->
                _state.update { it.copy(serverUrl = url ?: "") }
            }
        }
    }

    fun startEditingServerUrl() = _state.update {
        it.copy(editingServerUrl = true, newServerUrl = it.serverUrl, error = null)
    }

    fun onNewServerUrlChanged(url: String) = _state.update { it.copy(newServerUrl = url, error = null) }

    fun cancelEditingServerUrl() = _state.update { it.copy(editingServerUrl = false, error = null) }

    fun saveServerUrl() {
        viewModelScope.launch {
            val oldUrl = _state.value.serverUrl
            val newUrl = _state.value.newServerUrl.trimEnd('/')
            _state.update { it.copy(validating = true, error = null) }
            // checkHealth sets the URL before probing; restore old URL on failure
            authRepo.checkHealth(newUrl)
                .onSuccess {
                    _state.update { it.copy(editingServerUrl = false, validating = false) }
                }
                .onFailure { e ->
                    prefs.setServerUrl(oldUrl)
                    _state.update { it.copy(validating = false, error = "Cannot reach server: ${e.message}") }
                }
        }
    }

    fun logout() {
        viewModelScope.launch {
            prefs.clearAuth()
            _state.update { it.copy(loggedOut = true) }
        }
    }
}
