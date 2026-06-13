package com.streamio.android.ui.tv

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Movie
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Tv
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.tv.material3.*
import com.streamio.android.ui.components.ContentRow
import com.streamio.android.ui.screens.home.HomeViewModel

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun TvHomeScreen(
    onMovieClick: (Int) -> Unit,
    onShowClick: (Int) -> Unit,
    onEpisodeClick: (Int, Int) -> Unit,
    onBrowseMovies: () -> Unit,
    onBrowseShows: () -> Unit,
    onSettings: () -> Unit,
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

    Row(modifier = Modifier.fillMaxSize()) {
        // Sidebar navigation
        Column(
            modifier = Modifier
                .width(200.dp)
                .fillMaxHeight()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                "Streamio",
                style = MaterialTheme.typography.headlineSmall,
                color = androidx.compose.ui.graphics.Color(0xFFE50914),
                modifier = Modifier.padding(vertical = 16.dp),
            )

            TvSidebarButton(
                label = "Movies",
                icon = Icons.Default.Movie,
                onClick = onBrowseMovies,
            )
            TvSidebarButton(
                label = "Shows",
                icon = Icons.Default.Tv,
                onClick = onBrowseShows,
            )
            Spacer(Modifier.weight(1f))
            TvSidebarButton(
                label = "Settings",
                icon = Icons.Default.Settings,
                onClick = onSettings,
            )
        }

        // Main content
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(vertical = 24.dp, horizontal = 16.dp),
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
        }
    }
}
