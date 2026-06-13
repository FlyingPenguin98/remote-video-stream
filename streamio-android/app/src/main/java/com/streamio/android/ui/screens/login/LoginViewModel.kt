package com.streamio.android.ui.screens.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
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

data class LoginState(
    val username: String = "",
    val password: String = "",
    val loading: Boolean = false,
    val error: String? = null,
    val loggedIn: Boolean = false,
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    prefs: AppPreferences,
) : ViewModel() {

    private val _state = MutableStateFlow(LoginState())
    val state = _state.asStateFlow()

    val isDemoMode = prefs.isDemoMode.stateIn(viewModelScope, SharingStarted.Eagerly, false)

    fun onUsernameChanged(v: String) = _state.update { it.copy(username = v, error = null) }
    fun onPasswordChanged(v: String) = _state.update { it.copy(password = v, error = null) }

    fun loginAsDemo() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            authRepository.login("demo", "demo")
                .onSuccess { _state.update { it.copy(loading = false, loggedIn = true) } }
                .onFailure { _state.update { it.copy(loading = false, loggedIn = true) } }
        }
    }

    fun login() {
        val s = _state.value
        if (s.username.isBlank() || s.password.isBlank()) {
            _state.update { it.copy(error = "Username and password required") }
            return
        }
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            authRepository.login(s.username, s.password)
                .onSuccess { _state.update { it.copy(loading = false, loggedIn = true) } }
                .onFailure { _state.update { it.copy(loading = false, error = "Invalid credentials") } }
        }
    }
}
