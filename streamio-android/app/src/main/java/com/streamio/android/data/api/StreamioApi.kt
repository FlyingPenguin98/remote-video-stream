package com.streamio.android.data.api

import com.streamio.android.data.api.models.*
import retrofit2.Response
import retrofit2.http.*

interface StreamioApi {

    // --- Health ---
    @GET("api/health")
    suspend fun health(): Response<HealthResponse>

    // --- Auth ---
    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): Response<AuthResponse>

    @GET("api/auth/me")
    suspend fun getMe(): Response<User>

    @PUT("api/auth/me")
    suspend fun updateMe(@Body body: Map<String, String>): Response<Unit>

    // --- Library ---
    @GET("api/library/movies")
    suspend fun getMovies(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50,
        @Query("q") q: String? = null,
        @Query("sort") sort: String? = null,
        @Query("order") order: String? = null,
    ): Response<PaginatedResponse<MediaItem>>

    @GET("api/library/movies/{id}")
    suspend fun getMovie(@Path("id") id: Int): Response<MediaItem>

    @GET("api/library/shows")
    suspend fun getShows(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50,
        @Query("q") q: String? = null,
    ): Response<PaginatedResponse<MediaItem>>

    @GET("api/library/shows/{id}")
    suspend fun getShow(@Path("id") id: Int): Response<ShowDetail>

    @GET("api/library/continue-watching")
    suspend fun getContinueWatching(): Response<List<ContinueWatchingItem>>

    @GET("api/library/recently-added")
    suspend fun getRecentlyAdded(@Query("limit") limit: Int = 20): Response<List<MediaItem>>

    @POST("api/library/scan")
    suspend fun triggerScan(): Response<Unit>

    // --- Streaming ---
    @POST("api/stream/start")
    suspend fun startStream(@Body body: StartStreamRequest): Response<StreamSession>

    @DELETE("api/stream/{sessionId}")
    suspend fun stopStream(@Path("sessionId") sessionId: String): Response<Unit>

    @POST("api/stream/{sessionId}/ping")
    suspend fun ping(@Path("sessionId") sessionId: String): Response<Unit>

    // --- Progress ---
    @PUT("api/progress")
    suspend fun updateProgress(@Body body: ProgressUpdate): Response<Unit>

    @GET("api/progress/{mediaItemId}")
    suspend fun getProgress(@Path("mediaItemId") mediaItemId: Int): Response<WatchProgress?>

    @GET("api/progress/{mediaItemId}/{episodeId}")
    suspend fun getEpisodeProgress(
        @Path("mediaItemId") mediaItemId: Int,
        @Path("episodeId") episodeId: Int,
    ): Response<WatchProgress?>

    // --- Admin ---
    @GET("api/admin/system")
    suspend fun getSystemInfo(): Response<SystemInfo>

    @POST("api/admin/users")
    suspend fun createUser(@Body body: Map<String, String>): Response<User>
}
