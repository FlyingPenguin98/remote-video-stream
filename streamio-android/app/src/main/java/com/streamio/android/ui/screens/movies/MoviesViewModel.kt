package com.streamio.android.ui.screens.movies

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

data class MoviesState(
    val items: List<MediaItem> = emptyList(),
    val total: Int = 0,
    val loading: Boolean = true,
    val query: String = "",
    val sort: String = "title",
)

@OptIn(FlowPreview::class)
@HiltViewModel
class MoviesViewModel @Inject constructor(
    private val library: LibraryRepository,
    prefs: AppPreferences,
) : ViewModel() {

    private val _state = MutableStateFlow(MoviesState())
    val state = _state.asStateFlow()

    val serverUrl = prefs.serverUrl.stateIn(viewModelScope, SharingStarted.Eagerly, "")

    init {
        viewModelScope.launch {
            _state
                .map { it.query to it.sort }
                .distinctUntilChanged()
                .debounce(300)
                .collect { (q, sort) -> fetch(q, sort) }
        }
    }

    fun onQueryChanged(q: String) = _state.update { it.copy(query = q) }
    fun onSortChanged(s: String) = _state.update { it.copy(sort = s) }

    private fun fetch(query: String, sort: String) {
        viewModelScope.launch {
            _state.update { it.copy(loading = true) }
            library.getMovies(query = query.ifBlank { null }, sort = sort, limit = 100)
                .onSuccess { result ->
                    _state.update { it.copy(items = result.items, total = result.total, loading = false) }
                }
                .onFailure { _state.update { it.copy(loading = false) } }
        }
    }
}
