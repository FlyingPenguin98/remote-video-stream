package com.streamio.android.ui.tv

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.streamio.android.ui.screens.login.LoginScreen
import com.streamio.android.ui.screens.setup.SetupScreen

@Composable
fun TvNavGraph(
    hasServerUrl: Boolean,
    isLoggedIn: Boolean,
) {
    val navController = rememberNavController()
    val startDestination = when {
        !hasServerUrl -> "setup"
        !isLoggedIn -> "login"
        else -> "tv_home"
    }

    NavHost(navController = navController, startDestination = startDestination) {
        composable("setup") {
            SetupScreen(onSetupComplete = {
                navController.navigate("login") {
                    popUpTo("setup") { inclusive = true }
                }
            })
        }

        composable("login") {
            LoginScreen(onLoginSuccess = {
                navController.navigate("tv_home") {
                    popUpTo("login") { inclusive = true }
                }
            })
        }

        composable("tv_home") {
            TvHomeScreen(
                onMovieClick = { id -> navController.navigate("player/movie/$id") },
                onShowClick = { id -> navController.navigate("tv_browse/$id") },
                onEpisodeClick = { episodeId, showId ->
                    navController.navigate("player/episode/$episodeId/$showId")
                },
                onBrowseMovies = { navController.navigate("tv_browse/movies") },
                onBrowseShows = { navController.navigate("tv_browse/shows") },
                onSettings = { navController.navigate("tv_settings") },
            )
        }

        composable("tv_browse/movies") {
            TvBrowseScreen(
                type = "movies",
                onItemClick = { id -> navController.navigate("player/movie/$id") },
                onBack = { navController.popBackStack() },
            )
        }

        composable("tv_browse/shows") {
            TvBrowseScreen(
                type = "shows",
                onItemClick = { id -> navController.navigate("tv_show/$id") },
                onBack = { navController.popBackStack() },
            )
        }

        composable(
            route = "tv_show/{showId}",
            arguments = listOf(navArgument("showId") { type = NavType.IntType }),
        ) {
            TvShowDetailScreen(
                onEpisodeClick = { episodeId, showId ->
                    navController.navigate("player/episode/$episodeId/$showId")
                },
                onBack = { navController.popBackStack() },
            )
        }

        composable(
            route = "player/movie/{mediaItemId}",
            arguments = listOf(navArgument("mediaItemId") { type = NavType.IntType }),
        ) {
            TvPlayerScreen(onBack = { navController.popBackStack() })
        }

        composable(
            route = "player/episode/{episodeId}/{showId}",
            arguments = listOf(
                navArgument("episodeId") { type = NavType.IntType },
                navArgument("showId") { type = NavType.IntType },
            ),
        ) {
            TvPlayerScreen(onBack = { navController.popBackStack() })
        }

        composable("tv_settings") {
            com.streamio.android.ui.screens.settings.SettingsScreen(
                onLoggedOut = {
                    navController.navigate("login") {
                        popUpTo(0) { inclusive = true }
                    }
                },
            )
        }
    }
}
