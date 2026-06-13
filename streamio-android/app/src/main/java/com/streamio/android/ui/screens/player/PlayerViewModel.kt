package com.streamio.android.ui.screens.player

import android.app.Application
import androidx.annotation.OptIn
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.viewModelScope
import androidx.media3.common.MediaItem as Media3Item
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.hls.HlsMediaSource
import androidx.media3.exoplayer.source.ProgressiveMediaSource
import androidx.media3.session.MediaSession
import com.streamio.android.data.repository.LibraryRepository
import com.streamio.android.data.repository.ProgressRepository
import com.streamio.android.data.repository.StreamRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
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
    val isDemoMode: Boolean = false,
)

@OptIn(UnstableApi::class)
@HiltViewModel
class PlayerViewModel @Inject constructor(
    application: Application,
    private val streamRepo: StreamRepository,
    private val progressRepo: ProgressRepository,
    private val library: LibraryRepository,
    savedState: SavedStateHandle,
) : AndroidViewModel(application) {

    // Nav args: for movies, mediaItemId is set; for episodes, episodeId + showId are set
    private val mediaItemId: Int? = savedState["mediaItemId"]
    private val episodeId: Int? = savedState["episodeId"]
    private val showId: Int? = savedState["showId"]

    private val _state = MutableStateFlow(PlayerState())
    val state = _state.asStateFlow()

    private var sessionId: String? = null
    private var isDirect: Boolean = false

    // Transcoded streams begin at the resume offset (server runs ffmpeg -ss),
    // so the player timeline starts at 0 and the real media position is
    // offset + currentPosition. Direct play seeks locally, offset stays 0.
    private var positionOffsetSec: Double = 0.0
    private var knownDurationSec: Double? = null

    // viewModelScope is already cancelled by the time onCleared() runs, so the
    // final progress save and session teardown need their own scope.
    private val cleanupScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    val player: ExoPlayer = ExoPlayer.Builder(application).build()
    private val mediaSession = MediaSession.Builder(application, player).build()

    init {
        startPlayback()
    }

    /** Returns resume position (sec) and full media duration (sec) from the library. */
    private suspend fun loadResumeInfo(): Pair<Double, Double?> {
        if (episodeId != null && showId != null) {
            val show = library.getShow(showId).getOrNull()
            val episode = show?.seasons
                ?.asSequence()
                ?.flatMap { it.episodes.asSequence() }
                ?.find { it.id == episodeId }
            val wp = episode?.watchProgress
            val resume = if (wp != null && !wp.completed) wp.positionSec else 0.0
            return resume to episode?.durationSec?.toDouble()
        }
        if (mediaItemId != null) {
            val item = library.getMovie(mediaItemId).getOrNull()
            val wp = item?.watchProgress
            val resume = if (wp != null && !wp.completed) wp.positionSec else 0.0
            return resume to item?.durationSec?.toDouble()
        }
        return 0.0 to null
    }

    private fun startPlayback() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }

            if (streamRepo.isDemoMode()) {
                _state.update { it.copy(loading = false, isDemoMode = true) }
                return@launch
            }

            val (resumeSec, durationSec) = loadResumeInfo()
            knownDurationSec = durationSec

            streamRepo.startStream(
                mediaItemId = mediaItemId,
                episodeId = episodeId,
                startOffset = resumeSec,
            ).onSuccess { session ->
                sessionId = session.sessionId
                isDirect = session.isDirect
                positionOffsetSec = if (session.isDirect) 0.0 else resumeSec
                _state.update { it.copy(loading = false, isDirectPlay = session.isDirect) }

                val token = streamRepo.getToken()
                val dataSourceFactory = DefaultHttpDataSource.Factory()
                    .setDefaultRequestProperties(mapOf("Authorization" to "Bearer $token"))

                if (session.isDirect && session.fileUrl != null) {
                    val url = "${streamRepo.getServerUrl()}${session.fileUrl}"
                    player.setMediaSource(
                        ProgressiveMediaSource.Factory(dataSourceFactory)
                            .createMediaSource(Media3Item.fromUri(url))
                    )
                    player.prepare()
                    if (resumeSec > 0) player.seekTo((resumeSec * 1000).toLong())
                } else {
                    val url = streamRepo.buildManifestUrl(session.sessionId)
                    player.setMediaSource(
                        HlsMediaSource.Factory(dataSourceFactory)
                            .createMediaSource(Media3Item.fromUri(url))
                    )
                    player.prepare()
                }
                player.play()

                startProgressLoop()
                if (!session.isDirect) startPingLoop()
            }.onFailure { e ->
                _state.update { it.copy(loading = false, error = e.message ?: "Failed to start stream") }
            }
        }
    }

    private fun currentMediaPositionSec(): Double =
        positionOffsetSec + player.currentPosition / 1000.0

    private fun currentDurationSec(): Double? =
        knownDurationSec
            ?: if (isDirect) player.duration.takeIf { it > 0 }?.div(1000.0) else null

    private fun startProgressLoop() {
        viewModelScope.launch {
            while (isActive) {
                delay(10_000)
                if (player.isPlaying) {
                    progressRepo.updateProgress(
                        mediaItemId = showId ?: mediaItemId ?: return@launch,
                        episodeId = episodeId,
                        positionSec = currentMediaPositionSec(),
                        durationSec = currentDurationSec(),
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
        val positionSec = currentMediaPositionSec()
        val durationSec = currentDurationSec()
        val sid = sessionId
        val direct = isDirect
        val progressId = showId ?: mediaItemId

        mediaSession.release()
        player.release()

        cleanupScope.launch {
            if (positionSec > 0 && progressId != null) {
                progressRepo.updateProgress(
                    mediaItemId = progressId,
                    episodeId = episodeId,
                    positionSec = positionSec,
                    durationSec = durationSec,
                )
            }
            if (sid != null && !direct) {
                streamRepo.stopStream(sid)
            }
        }
    }
}
