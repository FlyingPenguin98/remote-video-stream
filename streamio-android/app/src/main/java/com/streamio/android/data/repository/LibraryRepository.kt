package com.streamio.android.data.repository

import com.streamio.android.data.api.StreamioApi
import com.streamio.android.data.api.models.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LibraryRepository @Inject constructor(
    private val api: StreamioApi,
) {

    suspend fun getMovies(
        page: Int = 1,
        limit: Int = 50,
        query: String? = null,
        sort: String? = null,
    ): Result<PaginatedResponse<MediaItem>> = runCatching {
        api.getMovies(page, limit, query, sort).body() ?: error("No data")
    }

    suspend fun getMovie(id: Int): Result<MediaItem> = runCatching {
        api.getMovie(id).body() ?: error("Not found")
    }

    suspend fun getShows(
        page: Int = 1,
        limit: Int = 50,
        query: String? = null,
    ): Result<PaginatedResponse<MediaItem>> = runCatching {
        api.getShows(page, limit, query).body() ?: error("No data")
    }

    suspend fun getShow(id: Int): Result<ShowDetail> = runCatching {
        api.getShow(id).body() ?: error("Not found")
    }

    suspend fun getContinueWatching(): Result<List<ContinueWatchingItem>> = runCatching {
        api.getContinueWatching().body() ?: emptyList()
    }

    suspend fun getRecentlyAdded(limit: Int = 20): Result<List<MediaItem>> = runCatching {
        api.getRecentlyAdded(limit).body() ?: emptyList()
    }

    suspend fun triggerScan(): Result<Unit> = runCatching {
        api.triggerScan()
    }
}
