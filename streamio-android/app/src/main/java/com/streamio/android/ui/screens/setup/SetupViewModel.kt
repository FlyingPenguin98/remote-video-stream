package com.streamio.android.ui.screens.setup

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

data class SetupState(
    val url: String = "",
    val loading: Boolean = false,
    val error: String? = null,
    val setupComplete: Boolean = false,
)

@HiltViewModel
class SetupViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val prefs: AppPreferences,
) : ViewModel() {

    private val _state = MutableStateFlow(SetupState())
    val state = _state.asStateFlow()

    fun onUrlChanged(url: String) {
        _state.update { it.copy(url = url, error = null) }
    }

    fun connect() {
        val url = _state.value.url.trim().trimEnd('/')
        if (url.isBlank()) {
            _state.update { it.copy(error = "Please enter a server URL") }
            return
        }

        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            prefs.setServerUrl(url)
            authRepository.checkHealth(url)
                .onSuccess { _state.update { it.copy(loading = false, setupComplete = true) } }
                .onFailure { err ->
                    _state.update {
                        it.copy(
                            loading = false,
                            error = "Could not connect: ${err.message}. Check the URL and make sure your server is running."
                        )
                    }
                }
        }
    }
}
