package com.streamio.android.data.repository

import com.streamio.android.data.api.StreamioApi
import com.streamio.android.data.api.models.*
import com.streamio.android.data.mock.MockDataSource
import com.streamio.android.data.preferences.AppPreferences
import kotlinx.coroutines.flow.first
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LibraryRepository @Inject constructor(
    private val api: StreamioApi,
    private val prefs: AppPreferences,
) {

    private suspend fun isDemoMode() = prefs.isDemoMode.first()

    suspend fun getMovies(
        page: Int = 1,
        limit: Int = 50,
        query: String? = null,
        sort: String? = null,
    ): Result<PaginatedResponse<MediaItem>> {
        if (isDemoMode()) {
            val items = if (query.isNullOrBlank()) MockDataSource.movies
                        else MockDataSource.movies.filter { it.title.contains(query, ignoreCase = true) }
            return Result.success(PaginatedResponse(items, items.size, 1, 1))
        }
        return runCatching { api.getMovies(page, limit, query, sort).body() ?: error("No data") }
    }

    suspend fun getMovie(id: Int): Result<MediaItem> {
        if (isDemoMode()) {
            return MockDataSource.findMovie(id)
                ?.let { Result.success(it) }
                ?: Result.failure(NoSuchElementException("Movie $id not found"))
        }
        return runCatching { api.getMovie(id).body() ?: error("Not found") }
    }

    suspend fun getShows(
        page: Int = 1,
        limit: Int = 50,
        query: String? = null,
    ): Result<PaginatedResponse<MediaItem>> {
        if (isDemoMode()) {
            val items = listOf(MockDataSource.breakingBadItem).filter {
                query.isNullOrBlank() || it.title.contains(query, ignoreCase = true)
            }
            return Result.success(PaginatedResponse(items, items.size, 1, 1))
        }
        return runCatching { api.getShows(page, limit, query).body() ?: error("No data") }
    }

    suspend fun getShow(id: Int): Result<ShowDetail> {
        if (isDemoMode()) {
            return MockDataSource.findShow(id)
                ?.let { Result.success(it) }
                ?: Result.failure(NoSuchElementException("Show $id not found"))
        }
        return runCatching { api.getShow(id).body() ?: error("Not found") }
    }

    suspend fun getContinueWatching(): Result<List<ContinueWatchingItem>> {
        if (isDemoMode()) return Result.success(MockDataSource.continueWatching)
        return runCatching { api.getContinueWatching().body() ?: emptyList() }
    }

    suspend fun getRecentlyAdded(limit: Int = 20): Result<List<MediaItem>> {
        if (isDemoMode()) return Result.success(MockDataSource.recentlyAdded.take(limit))
        return runCatching { api.getRecentlyAdded(limit).body() ?: emptyList() }
    }

    suspend fun triggerScan(): Result<Unit> {
        if (isDemoMode()) return Result.success(Unit)
        return runCatching { api.triggerScan() }
    }
}
