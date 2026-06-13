package com.streamio.android.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val StreamioRed = Color(0xFFE50914)
val StreamioRedDark = Color(0xFFB20710)
val StreamioBg = Color(0xFF111111)
val StreamioSurface = Color(0xFF1E1E1E)
val StreamioSurface2 = Color(0xFF2A2A2A)

private val DarkColorScheme = darkColorScheme(
    primary = StreamioRed,
    onPrimary = Color.White,
    secondary = StreamioRed,
    background = StreamioBg,
    surface = StreamioSurface,
    onBackground = Color.White,
    onSurface = Color.White,
    onSurfaceVariant = Color(0xFFAAAAAA),
    outline = Color(0xFF333333),
    error = Color(0xFFFF6B6B),
)

@Composable
fun StreamioTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content,
    )
}
