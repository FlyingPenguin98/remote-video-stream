package com.streamio.android.ui.tv

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.streamio.android.data.api.models.MediaItem
import com.streamio.android.ui.components.MediaCard
import com.streamio.android.ui.screens.movies.MoviesViewModel
import com.streamio.android.ui.screens.shows.ShowsViewModel

@Composable
fun TvBrowseScreen(
    type: String,
    onItemClick: (Int) -> Unit,
    onBack: () -> Unit,
) {
    if (type == "movies") {
        val viewModel: MoviesViewModel = hiltViewModel()
        val state by viewModel.state.collectAsState()
        val serverUrl by viewModel.serverUrl.collectAsState()
        TvMediaGrid(
            items = state.items,
            loading = state.loading,
            query = state.query,
            onQueryChanged = viewModel::onQueryChanged,
            searchPlaceholder = "Search movies…",
            emptyText = "No movies found",
            serverUrl = serverUrl ?: "",
            onItemClick = onItemClick,
            onBack = onBack,
        )
    } else {
        val viewModel: ShowsViewModel = hiltViewModel()
        val state by viewModel.state.collectAsState()
        val serverUrl by viewModel.serverUrl.collectAsState()
        TvMediaGrid(
            items = state.items,
            loading = state.loading,
            query = state.query,
            onQueryChanged = viewModel::onQueryChanged,
            searchPlaceholder = "Search shows…",
            emptyText = "No shows found",
            serverUrl = serverUrl ?: "",
            onItemClick = onItemClick,
            onBack = onBack,
        )
    }
}

@Composable
private fun TvMediaGrid(
    items: List<MediaItem>,
    loading: Boolean,
    query: String,
    onQueryChanged: (String) -> Unit,
    searchPlaceholder: String,
    emptyText: String,
    serverUrl: String,
    onItemClick: (Int) -> Unit,
    onBack: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize().padding(24.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back")
            }
            OutlinedTextField(
                value = query,
                onValueChange = onQueryChanged,
                placeholder = { Text(searchPlaceholder) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                modifier = Modifier.weight(1f),
                singleLine = true,
            )
        }

        Spacer(Modifier.height(16.dp))

        if (loading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (items.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(emptyText, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        } else {
            LazyVerticalGrid(
                columns = GridCells.Adaptive(minSize = 150.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                items(items, key = { it.id }) { item ->
                    MediaCard(
                        item = item,
                        serverUrl = serverUrl,
                        onClick = { onItemClick(item.id) },
                    )
                }
            }
        }
    }
}
