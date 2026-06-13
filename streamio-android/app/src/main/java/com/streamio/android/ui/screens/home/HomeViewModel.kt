package com.streamio.android.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.streamio.android.data.api.models.ContinueWatchingItem
import com.streamio.android.data.api.models.MediaItem
import com.streamio.android.data.preferences.AppPreferences
import com.streamio.android.data.repository.LibraryRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HomeState(
    val continueWatching: List<ContinueWatchingItem> = emptyList(),
    val recentlyAdded: List<MediaItem> = emptyList(),
    val loading: Boolean = true,
    val error: String? = null,
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val library: LibraryRepository,
    prefs: AppPreferences,
) : ViewModel() {

    private val _state = MutableStateFlow(HomeState())
    val state = _state.asStateFlow()

    val serverUrl = prefs.serverUrl.stateIn(viewModelScope, SharingStarted.Eagerly, "")

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            val cw = library.getContinueWatching().getOrElse { emptyList() }
            val ra = library.getRecentlyAdded(20).getOrElse { emptyList() }
            _state.update { it.copy(continueWatching = cw, recentlyAdded = ra, loading = false) }
        }
    }
}
