package com.streamio.android.ui.screens.showdetail

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.streamio.android.data.api.models.ShowDetail
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

data class ShowDetailState(
    val show: ShowDetail? = null,
    val loading: Boolean = true,
    val error: String? = null,
    val selectedSeason: Int = 1,
)

@HiltViewModel
class ShowDetailViewModel @Inject constructor(
    private val library: LibraryRepository,
    prefs: AppPreferences,
    savedState: SavedStateHandle,
) : ViewModel() {

    private val showId: Int = checkNotNull(savedState["showId"])

    private val _state = MutableStateFlow(ShowDetailState())
    val state = _state.asStateFlow()

    val serverUrl = prefs.serverUrl.stateIn(viewModelScope, SharingStarted.Eagerly, "")

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            library.getShow(showId)
                .onSuccess { show ->
                    val firstSeason = show.seasons.minByOrNull { it.seasonNumber }?.seasonNumber ?: 1
                    _state.update { it.copy(show = show, loading = false, selectedSeason = firstSeason) }
                }
                .onFailure { e ->
                    _state.update { it.copy(loading = false, error = e.message) }
                }
        }
    }

    fun selectSeason(seasonNumber: Int) = _state.update { it.copy(selectedSeason = seasonNumber) }
}
