package com.streamio.android.ui.screens.home

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.streamio.android.data.api.models.MediaItem
import com.streamio.android.ui.components.ContentRow

@Composable
fun HomeScreen(
    onMovieClick: (Int) -> Unit,
    onShowClick: (Int) -> Unit,
    onEpisodeClick: (Int, Int) -> Unit,
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    val serverUrl by viewModel.serverUrl.collectAsState()

    if (state.loading) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
        return
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(32.dp),
    ) {
        if (state.continueWatching.isNotEmpty()) {
            item {
                ContentRow(
                    title = "Continue Watching",
                    items = state.continueWatching.map { cw ->
                        cw.mediaItem.copy(
                            watchProgress = com.streamio.android.data.api.models.WatchProgressBrief(
                                positionSec = cw.positionSec,
                                durationSec = cw.durationSec,
                                completed = false,
                            )
                        )
                    },
                    serverUrl = serverUrl ?: "",
                    onItemClick = { item ->
                        val cw = state.continueWatching.find { it.mediaItem.id == item.id }
                        if (cw?.episode != null) {
                            onEpisodeClick(cw.episode.id, cw.mediaItem.id)
                        } else {
                            if (item.type == "movie") onMovieClick(item.id) else onShowClick(item.id)
                        }
                    },
                )
            }
        }

        if (state.recentlyAdded.isNotEmpty()) {
            item {
                ContentRow(
                    title = "Recently Added",
                    items = state.recentlyAdded,
                    serverUrl = serverUrl ?: "",
                    onItemClick = { item ->
                        if (item.type == "movie") onMovieClick(item.id) else onShowClick(item.id)
                    },
                )
            }
        }

        if (state.continueWatching.isEmpty() && state.recentlyAdded.isEmpty()) {
            item {
                Box(
                    modifier = Modifier.fillParentMaxSize(),
                    contentAlignment = Alignment.Center,
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Your library is empty", style = MaterialTheme.typography.titleMedium)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "Add media files to your Pi and trigger a scan from the web UI.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }
    }
}
