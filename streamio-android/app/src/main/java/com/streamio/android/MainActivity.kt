package com.streamio.android

import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.streamio.android.data.preferences.AppPreferences
import com.streamio.android.ui.navigation.AppNavGraph
import com.streamio.android.ui.theme.StreamioTheme
import com.streamio.android.ui.tv.TvNavGraph
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.first
import javax.inject.Inject

private data class StartupState(val hasServerUrl: Boolean, val isLoggedIn: Boolean)

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var prefs: AppPreferences

    private val isTv by lazy {
        packageManager.hasSystemFeature(PackageManager.FEATURE_LEANBACK)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            StreamioTheme {
                // Wait for the first DataStore read so the start destination is
                // decided once with real values, not the flow's initial null.
                var startup by remember { mutableStateOf<StartupState?>(null) }
                LaunchedEffect(Unit) {
                    val url = prefs.serverUrl.first()
                    val token = prefs.token.first()
                    startup = StartupState(
                        hasServerUrl = !url.isNullOrBlank(),
                        isLoggedIn = !token.isNullOrBlank(),
                    )
                }

                val state = startup
                if (state == null) {
                    Box(
                        Modifier
                            .fillMaxSize()
                            .background(MaterialTheme.colorScheme.background)
                    )
                } else if (isTv) {
                    TvNavGraph(
                        hasServerUrl = state.hasServerUrl,
                        isLoggedIn = state.isLoggedIn,
                    )
                } else {
                    AppNavGraph(
                        hasServerUrl = state.hasServerUrl,
                        isLoggedIn = state.isLoggedIn,
                    )
                }
            }
        }
    }
}
