package com.streamio.android.ui.screens.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.streamio.android.data.preferences.AppPreferences
import com.streamio.android.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
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
    // Password change
    val currentPassword: String = "",
    val newPassword: String = "",
    val changingPassword: Boolean = false,
    val passwordError: String? = null,
    val passwordChanged: Boolean = false,
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
            _state.update { it.copy(validating = true, error = null) }
            // checkHealth persists the new URL and restores the old one on failure
            authRepo.checkHealth(_state.value.newServerUrl)
                .onSuccess {
                    _state.update { it.copy(editingServerUrl = false, validating = false) }
                }
                .onFailure { e ->
                    _state.update { it.copy(validating = false, error = "Cannot reach server: ${e.message}") }
                }
        }
    }

    fun onCurrentPasswordChanged(v: String) =
        _state.update { it.copy(currentPassword = v, passwordError = null, passwordChanged = false) }

    fun onNewPasswordChanged(v: String) =
        _state.update { it.copy(newPassword = v, passwordError = null, passwordChanged = false) }

    fun changePassword() {
        val s = _state.value
        if (s.currentPassword.isBlank() || s.newPassword.isBlank()) {
            _state.update { it.copy(passwordError = "Both fields are required") }
            return
        }
        if (s.newPassword.length < 8) {
            _state.update { it.copy(passwordError = "New password must be at least 8 characters") }
            return
        }
        viewModelScope.launch {
            _state.update { it.copy(changingPassword = true, passwordError = null) }
            authRepo.updatePassword(s.currentPassword, s.newPassword)
                .onSuccess {
                    _state.update {
                        it.copy(
                            changingPassword = false,
                            passwordChanged = true,
                            currentPassword = "",
                            newPassword = "",
                        )
                    }
                }
                .onFailure { e ->
                    _state.update { it.copy(changingPassword = false, passwordError = e.message) }
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
