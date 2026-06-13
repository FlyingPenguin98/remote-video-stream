package com.streamio.android.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Movie
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Tv
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.streamio.android.ui.screens.home.HomeScreen
import com.streamio.android.ui.screens.login.LoginScreen
import com.streamio.android.ui.screens.movies.MoviesScreen
import com.streamio.android.ui.screens.player.PlayerScreen
import com.streamio.android.ui.screens.settings.SettingsScreen
import com.streamio.android.ui.screens.setup.SetupScreen
import com.streamio.android.ui.screens.showdetail.ShowDetailScreen
import com.streamio.android.ui.screens.shows.ShowsScreen

private const val ROUTE_SETUP = "setup"
private const val ROUTE_LOGIN = "login"
private const val ROUTE_HOME = "home"
private const val ROUTE_MOVIES = "movies"
private const val ROUTE_SHOWS = "shows"
private const val ROUTE_SHOW_DETAIL = "shows/{showId}"
private const val ROUTE_PLAYER_MOVIE = "player/movie/{mediaItemId}?title={title}&resumePositionSec={resumePositionSec}"
private const val ROUTE_PLAYER_EPISODE = "player/episode/{episodeId}/{showId}?title={title}&resumePositionSec={resumePositionSec}"
private const val ROUTE_SETTINGS = "settings"

@Composable
fun AppNavGraph(
    hasServerUrl: Boolean,
    isLoggedIn: Boolean,
) {
    val navController = rememberNavController()
    val startDestination = when {
        !hasServerUrl -> ROUTE_SETUP
        !isLoggedIn -> ROUTE_LOGIN
        else -> ROUTE_HOME
    }

    val bottomNavRoutes = listOf(ROUTE_HOME, ROUTE_MOVIES, ROUTE_SHOWS, ROUTE_SETTINGS)
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route

    val showBottomBar = bottomNavRoutes.any { currentRoute?.startsWith(it.substringBefore('/')) == true } ||
        currentRoute in bottomNavRoutes

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    NavigationBarItem(
                        selected = currentRoute == ROUTE_HOME,
                        onClick = {
                            navController.navigate(ROUTE_HOME) {
                                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Icon(Icons.Default.Home, contentDescription = null) },
                        label = { Text("Home") },
                    )
                    NavigationBarItem(
                        selected = currentRoute == ROUTE_MOVIES,
                        onClick = {
                            navController.navigate(ROUTE_MOVIES) {
                                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Icon(Icons.Default.Movie, contentDescription = null) },
                        label = { Text("Movies") },
                    )
                    NavigationBarItem(
                        selected = currentRoute == ROUTE_SHOWS,
                        onClick = {
                            navController.navigate(ROUTE_SHOWS) {
                                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Icon(Icons.Default.Tv, contentDescription = null) },
                        label = { Text("Shows") },
                    )
                    NavigationBarItem(
                        selected = currentRoute == ROUTE_SETTINGS,
                        onClick = {
                            navController.navigate(ROUTE_SETTINGS) {
                                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Icon(Icons.Default.Settings, contentDescription = null) },
                        label = { Text("Settings") },
                    )
                }
            }
        },
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = startDestination,
            modifier = if (showBottomBar) Modifier.padding(innerPadding) else Modifier,
        ) {
            composable(ROUTE_SETUP) {
                SetupScreen(onSetupComplete = {
                    navController.navigate(ROUTE_LOGIN) {
                        popUpTo(ROUTE_SETUP) { inclusive = true }
                    }
                })
            }

            composable(ROUTE_LOGIN) {
                LoginScreen(onLoginSuccess = {
                    navController.navigate(ROUTE_HOME) {
                        popUpTo(ROUTE_LOGIN) { inclusive = true }
                    }
                })
            }

            composable(ROUTE_HOME) {
                HomeScreen(
                    onMovieClick = { id ->
                        navController.navigate("player/movie/$id")
                    },
                    onShowClick = { id ->
                        navController.navigate("shows/$id")
                    },
                    onEpisodeClick = { episodeId, showId ->
                        navController.navigate("player/episode/$episodeId/$showId")
                    },
                )
            }

            composable(ROUTE_MOVIES) {
                MoviesScreen(onMovieClick = { id ->
                    navController.navigate("player/movie/$id")
                })
            }

            composable(ROUTE_SHOWS) {
                ShowsScreen(onShowClick = { id ->
                    navController.navigate("shows/$id")
                })
            }

            composable(
                route = "shows/{showId}",
                arguments = listOf(navArgument("showId") { type = NavType.IntType }),
            ) {
                ShowDetailScreen(
                    onBack = { navController.popBackStack() },
                    onEpisodeClick = { episodeId, showId ->
                        navController.navigate("player/episode/$episodeId/$showId")
                    },
                )
            }

            composable(
                route = "player/movie/{mediaItemId}",
                arguments = listOf(
                    navArgument("mediaItemId") { type = NavType.IntType },
                    navArgument("title") { type = NavType.StringType; defaultValue = "" },
                    navArgument("resumePositionSec") { type = NavType.FloatType; defaultValue = 0f },
                ),
            ) {
                PlayerScreen(onBack = { navController.popBackStack() })
            }

            composable(
                route = "player/episode/{episodeId}/{showId}",
                arguments = listOf(
                    navArgument("episodeId") { type = NavType.IntType },
                    navArgument("showId") { type = NavType.IntType },
                    navArgument("title") { type = NavType.StringType; defaultValue = "" },
                    navArgument("resumePositionSec") { type = NavType.FloatType; defaultValue = 0f },
                ),
            ) {
                PlayerScreen(onBack = { navController.popBackStack() })
            }

            composable(ROUTE_SETTINGS) {
                SettingsScreen(onLoggedOut = {
                    navController.navigate(ROUTE_LOGIN) {
                        popUpTo(0) { inclusive = true }
                    }
                })
            }
        }
    }
}
