package com.streamio.android.data.mock

import com.streamio.android.data.api.models.*

internal object MockDataSource {

    private val movie1 = MediaItem(
        id = 1, type = "movie", title = "Interstellar", year = 2014, tmdbId = 157336,
        overview = "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
        posterUrl = null, backdropUrl = null, rating = 8.6,
        genres = listOf("Science Fiction", "Adventure"),
        durationSec = 10140, isDirectPlay = true, scannedAt = 0L,
        watchProgress = WatchProgressBrief(1800.0, 10140.0, false),
    )

    private val movie2 = MediaItem(
        id = 2, type = "movie", title = "The Dark Knight", year = 2008, tmdbId = 155,
        overview = "When the Joker unleashes chaos on Gotham, Batman faces the greatest psychological and physical test of his ability to fight injustice.",
        posterUrl = null, backdropUrl = null, rating = 9.0,
        genres = listOf("Action", "Crime", "Drama"),
        durationSec = 9120, isDirectPlay = true, scannedAt = 0L, watchProgress = null,
    )

    private val movie3 = MediaItem(
        id = 3, type = "movie", title = "Inception", year = 2010, tmdbId = 27205,
        overview = "A thief who steals corporate secrets through dream-sharing technology is tasked with planting an idea into a CEO's mind.",
        posterUrl = null, backdropUrl = null, rating = 8.8,
        genres = listOf("Action", "Science Fiction", "Thriller"),
        durationSec = 8880, isDirectPlay = true, scannedAt = 0L, watchProgress = null,
    )

    val movies: List<MediaItem> = listOf(movie1, movie2, movie3)

    val breakingBad: ShowDetail = ShowDetail(
        id = 4, type = "series", title = "Breaking Bad", year = 2008, tmdbId = 1396,
        overview = "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing methamphetamine to secure his family's future.",
        posterUrl = null, backdropUrl = null, rating = 9.5,
        genres = listOf("Drama", "Crime"),
        seasons = listOf(
            Season(
                id = 10, seasonNumber = 1, title = "Season 1", overview = null, posterUrl = null,
                airDate = "2008-01-20",
                episodes = listOf(
                    Episode(101, 4, 1, 1, "Pilot", "Walter White discovers he has cancer and decides to cook meth.", null, "2008-01-20", 3300, true, WatchProgressBrief(3300.0, 3300.0, true)),
                    Episode(102, 4, 1, 2, "Cat's in the Bag", null, null, "2008-01-27", 2760, true, WatchProgressBrief(2760.0, 2760.0, true)),
                    Episode(103, 4, 1, 3, "...And the Bag's in the River", null, null, "2008-02-10", 2820, true, WatchProgressBrief(900.0, 2820.0, false)),
                    Episode(104, 4, 1, 4, "Cancer Man", null, null, "2008-02-17", 2880, true, null),
                    Episode(105, 4, 1, 5, "Gray Matter", null, null, "2008-02-24", 2760, true, null),
                    Episode(106, 4, 1, 6, "Crazy Handful of Nothin'", null, null, "2008-03-02", 2880, true, null),
                    Episode(107, 4, 1, 7, "A No-Rough-Stuff-Type Deal", null, null, "2008-03-09", 2880, true, null),
                ),
            ),
            Season(
                id = 20, seasonNumber = 2, title = "Season 2", overview = null, posterUrl = null,
                airDate = "2009-03-08",
                episodes = listOf(
                    Episode(201, 4, 2, 1, "Seven Thirty-Seven", null, null, "2009-03-08", 2940, true, null),
                    Episode(202, 4, 2, 2, "Grilled", null, null, "2009-03-15", 2880, true, null),
                    Episode(203, 4, 2, 3, "Bit by a Dead Bee", null, null, "2009-03-22", 2940, true, null),
                ),
            ),
        ),
    )

    val breakingBadItem = MediaItem(
        id = 4, type = "series", title = breakingBad.title, year = breakingBad.year,
        tmdbId = breakingBad.tmdbId, overview = breakingBad.overview,
        posterUrl = null, backdropUrl = null, rating = breakingBad.rating,
        genres = breakingBad.genres, durationSec = null, isDirectPlay = true, scannedAt = 0L,
        watchProgress = null,
    )

    val continueWatching: List<ContinueWatchingItem> = listOf(
        ContinueWatchingItem(movie1, null, 1800.0, 10140.0, System.currentTimeMillis()),
        ContinueWatchingItem(breakingBadItem, breakingBad.seasons[0].episodes[2], 900.0, 2820.0, System.currentTimeMillis()),
    )

    val recentlyAdded: List<MediaItem> = listOf(breakingBadItem) + movies

    val demoSession = StreamSession(
        sessionId = "demo-session-000",
        manifestUrl = "",
        fileUrl = null,
        isDirect = true,
    )

    fun findMovie(id: Int): MediaItem? = movies.find { it.id == id }
    fun findShow(id: Int): ShowDetail? = if (id == breakingBad.id) breakingBad else null
}
