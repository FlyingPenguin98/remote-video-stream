package com.streamio.android

import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.streamio.android.data.preferences.AppPreferences
import com.streamio.android.ui.navigation.AppNavGraph
import com.streamio.android.ui.theme.StreamioTheme
import com.streamio.android.ui.tv.TvNavGraph
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

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
                val serverUrl by prefs.serverUrl.collectAsState(initial = null)
                val token by prefs.token.collectAsState(initial = null)

                if (isTv) {
                    TvNavGraph(
                        hasServerUrl = !serverUrl.isNullOrBlank(),
                        isLoggedIn = !token.isNullOrBlank(),
                    )
                } else {
                    AppNavGraph(
                        hasServerUrl = !serverUrl.isNullOrBlank(),
                        isLoggedIn = !token.isNullOrBlank(),
                    )
                }
            }
        }
    }
}
