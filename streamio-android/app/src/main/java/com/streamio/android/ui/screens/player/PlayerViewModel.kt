package com.streamio.android.ui.screens.player

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.viewModelScope
import androidx.media3.common.MediaItem as Media3Item
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.hls.HlsMediaSource
import androidx.media3.exoplayer.source.ProgressiveMediaSource
import androidx.media3.session.MediaSession
import com.streamio.android.data.repository.ProgressRepository
import com.streamio.android.data.repository.StreamRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PlayerState(
    val loading: Boolean = true,
    val error: String? = null,
    val isDirectPlay: Boolean = false,
)

@HiltViewModel
class PlayerViewModel @Inject constructor(
    application: Application,
    private val streamRepo: StreamRepository,
    private val progressRepo: ProgressRepository,
    savedState: SavedStateHandle,
) : AndroidViewModel(application) {

    // Nav args: for movies, mediaItemId is set; for episodes, episodeId + showId are set
    private val mediaItemId: Int? = savedState["mediaItemId"]
    private val episodeId: Int? = savedState["episodeId"]
    private val showId: Int? = savedState["showId"]

    private val _state = MutableStateFlow(PlayerState())
    val state = _state.asStateFlow()

    private var sessionId: String? = null
    private var durationSec: Double? = null

    val player: ExoPlayer = ExoPlayer.Builder(application).build()
    private val mediaSession = MediaSession.Builder(application, player).build()

    init {
        startPlayback()
    }

    private fun startPlayback() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            streamRepo.startStream(
                mediaItemId = mediaItemId,
                episodeId = episodeId,
                startOffset = 0.0,
            ).onSuccess { session ->
                sessionId = session.sessionId
                _state.update { it.copy(loading = false, isDirectPlay = session.isDirect) }

                val token = streamRepo.getToken()
                val url = if (session.isDirect && session.fileUrl != null) {
                    "${streamRepo.getServerUrl()}${session.fileUrl}"
                } else {
                    streamRepo.buildManifestUrl(session.sessionId)
                }

                val dataSourceFactory = DefaultHttpDataSource.Factory()
                    .setDefaultRequestProperties(mapOf("Authorization" to "Bearer $token"))

                val mediaSource = if (session.isDirect) {
                    ProgressiveMediaSource.Factory(dataSourceFactory)
                        .createMediaSource(Media3Item.fromUri(url))
                } else {
                    HlsMediaSource.Factory(dataSourceFactory)
                        .createMediaSource(Media3Item.fromUri(url))
                }

                player.setMediaSource(mediaSource)
                player.prepare()
                player.play()

                startProgressLoop()
                startPingLoop()
            }.onFailure { e ->
                _state.update { it.copy(loading = false, error = e.message ?: "Failed to start stream") }
            }
        }
    }

    private fun startProgressLoop() {
        viewModelScope.launch {
            while (isActive) {
                delay(10_000)
                if (player.isPlaying) {
                    val positionSec = player.currentPosition / 1000.0
                    val dur = player.duration.takeIf { it > 0 }?.div(1000.0)
                    durationSec = dur
                    progressRepo.updateProgress(
                        mediaItemId = showId ?: mediaItemId ?: return@launch,
                        episodeId = episodeId,
                        positionSec = positionSec,
                        durationSec = dur,
                    )
                }
            }
        }
    }

    private fun startPingLoop() {
        viewModelScope.launch {
            while (isActive) {
                delay(30_000)
                sessionId?.let { streamRepo.ping(it) }
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        // Snapshot position before releasing the player
        val positionSec = player.currentPosition / 1000.0
        val dur = durationSec ?: player.duration.takeIf { it > 0 }?.div(1000.0)
        val sid = sessionId

        mediaSession.release()
        player.release()

        // Fire-and-forget final progress save + stream stop
        viewModelScope.launch {
            if (positionSec > 0) {
                progressRepo.updateProgress(
                    mediaItemId = showId ?: mediaItemId ?: return@launch,
                    episodeId = episodeId,
                    positionSec = positionSec,
                    durationSec = dur,
                )
            }
            sid?.let { streamRepo.stopStream(it) }
        }
    }
}
