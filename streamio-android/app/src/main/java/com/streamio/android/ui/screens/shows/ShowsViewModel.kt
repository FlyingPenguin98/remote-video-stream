package com.streamio.android.ui.screens.shows

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.streamio.android.data.api.models.MediaItem
import com.streamio.android.data.preferences.AppPreferences
import com.streamio.android.data.repository.LibraryRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ShowsState(
    val items: List<MediaItem> = emptyList(),
    val total: Int = 0,
    val loading: Boolean = true,
    val query: String = "",
)

@OptIn(FlowPreview::class)
@HiltViewModel
class ShowsViewModel @Inject constructor(
    private val library: LibraryRepository,
    prefs: AppPreferences,
) : ViewModel() {

    private val _state = MutableStateFlow(ShowsState())
    val state = _state.asStateFlow()

    val serverUrl = prefs.serverUrl.stateIn(viewModelScope, SharingStarted.Eagerly, "")

    init {
        viewModelScope.launch {
            _state
                .map { it.query }
                .distinctUntilChanged()
                .debounce(300)
                .collect { q -> fetch(q) }
        }
    }

    fun onQueryChanged(q: String) = _state.update { it.copy(query = q) }

    private fun fetch(query: String) {
        viewModelScope.launch {
            _state.update { it.copy(loading = true) }
            library.getShows(query = query.ifBlank { null }, limit = 100)
                .onSuccess { result ->
                    _state.update { it.copy(items = result.items, total = result.total, loading = false) }
                }
                .onFailure { _state.update { it.copy(loading = false) } }
        }
    }
}
