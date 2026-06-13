package com.streamio.android.ui.tv

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.streamio.android.ui.components.EpisodeRow
import com.streamio.android.ui.screens.showdetail.ShowDetailViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TvShowDetailScreen(
    onEpisodeClick: (episodeId: Int, showId: Int) -> Unit,
    onBack: () -> Unit,
    viewModel: ShowDetailViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    val serverUrl by viewModel.serverUrl.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(state.show?.title ?: "") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        },
    ) { padding ->
        if (state.loading) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            return@Scaffold
        }

        val show = state.show ?: return@Scaffold

        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(bottom = 24.dp),
        ) {
            item {
                show.backdropUrl?.let { url ->
                    AsyncImage(
                        model = "${serverUrl ?: ""}$url",
                        contentDescription = null,
                        modifier = Modifier.fillMaxWidth().height(250.dp),
                        contentScale = ContentScale.Crop,
                    )
                }
            }

            item {
                Column(modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp)) {
                    Text(show.title, style = MaterialTheme.typography.headlineMedium)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        show.year?.let { Text("$it", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                        show.rating?.let { Text("★ ${"%.1f".format(it)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                    }
                    show.overview?.let {
                        Spacer(Modifier.height(8.dp))
                        Text(it, style = MaterialTheme.typography.bodyMedium, maxLines = 5, overflow = TextOverflow.Ellipsis)
                    }
                }
            }

            if (show.seasons.size > 1) {
                item {
                    Row(
                        modifier = Modifier
                            .horizontalScroll(rememberScrollState())
                            .padding(horizontal = 24.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        show.seasons.sortedBy { it.seasonNumber }.forEach { season ->
                            FilterChip(
                                selected = state.selectedSeason == season.seasonNumber,
                                onClick = { viewModel.selectSeason(season.seasonNumber) },
                                label = { Text("Season ${season.seasonNumber}") },
                            )
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                }
            }

            val currentSeason = show.seasons.find { it.seasonNumber == state.selectedSeason }
            currentSeason?.episodes?.sortedBy { it.episodeNumber }?.let { episodes ->
                items(episodes, key = { it.id }) { episode ->
                    EpisodeRow(
                        episode = episode,
                        serverUrl = serverUrl ?: "",
                        onClick = { onEpisodeClick(episode.id, show.id) },
                    )
                    HorizontalDivider(modifier = Modifier.padding(horizontal = 24.dp))
                }
            }
        }
    }
}
