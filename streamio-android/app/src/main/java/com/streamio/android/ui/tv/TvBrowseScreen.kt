package com.streamio.android.ui.tv

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.tv.foundation.lazy.grid.TvGridCells
import androidx.tv.foundation.lazy.grid.TvLazyVerticalGrid
import androidx.tv.foundation.lazy.grid.items
import androidx.tv.material3.ExperimentalTvMaterial3Api
import com.streamio.android.ui.components.MediaCard
import com.streamio.android.ui.screens.movies.MoviesViewModel
import com.streamio.android.ui.screens.shows.ShowsViewModel

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun TvBrowseScreen(
    type: String,
    onItemClick: (Int) -> Unit,
    onBack: () -> Unit,
) {
    when (type) {
        "movies" -> TvMoviesBrowse(onItemClick = onItemClick, onBack = onBack)
        else -> TvShowsBrowse(onItemClick = onItemClick, onBack = onBack)
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun TvMoviesBrowse(
    onItemClick: (Int) -> Unit,
    onBack: () -> Unit,
    viewModel: MoviesViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    val serverUrl by viewModel.serverUrl.collectAsState()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back")
            }
            OutlinedTextField(
                value = state.query,
                onValueChange = viewModel::onQueryChanged,
                placeholder = { Text("Search movies…") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                modifier = Modifier.weight(1f),
                singleLine = true,
            )
        }

        Spacer(Modifier.height(16.dp))

        if (state.loading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (state.items.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No movies found")
            }
        } else {
            TvLazyVerticalGrid(
                columns = TvGridCells.Adaptive(minSize = 150.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                items(state.items, key = { it.id }) { item ->
                    MediaCard(
                        item = item,
                        serverUrl = serverUrl ?: "",
                        onClick = { onItemClick(item.id) },
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun TvShowsBrowse(
    onItemClick: (Int) -> Unit,
    onBack: () -> Unit,
    viewModel: ShowsViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    val serverUrl by viewModel.serverUrl.collectAsState()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back")
            }
            OutlinedTextField(
                value = state.query,
                onValueChange = viewModel::onQueryChanged,
                placeholder = { Text("Search shows…") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                modifier = Modifier.weight(1f),
                singleLine = true,
            )
        }

        Spacer(Modifier.height(16.dp))

        if (state.loading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (state.items.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No shows found")
            }
        } else {
            TvLazyVerticalGrid(
                columns = TvGridCells.Adaptive(minSize = 150.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                items(state.items, key = { it.id }) { item ->
                    MediaCard(
                        item = item,
                        serverUrl = serverUrl ?: "",
                        onClick = { onItemClick(item.id) },
                    )
                }
            }
        }
    }
}
