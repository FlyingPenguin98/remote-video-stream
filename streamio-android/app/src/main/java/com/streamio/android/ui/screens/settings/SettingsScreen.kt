package com.streamio.android.ui.screens.settings

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.streamio.android.ui.theme.StreamioRed

@Composable
fun SettingsScreen(
    onLoggedOut: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(state.loggedOut) {
        if (state.loggedOut) onLoggedOut()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text("Settings", style = MaterialTheme.typography.headlineMedium)

        HorizontalDivider()

        // Account section
        Text("Account", style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)

        if (state.username.isNotEmpty()) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Username", style = MaterialTheme.typography.bodyLarge)
                Text(state.username, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        if (state.role.isNotEmpty()) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Role", style = MaterialTheme.typography.bodyLarge)
                Text(state.role, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }

        HorizontalDivider()

        // Server section
        Text("Server", style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)

        if (state.editingServerUrl) {
            OutlinedTextField(
                value = state.newServerUrl,
                onValueChange = viewModel::onNewServerUrlChanged,
                label = { Text("Server URL") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                isError = state.error != null,
                supportingText = state.error?.let { { Text(it, color = MaterialTheme.colorScheme.error) } },
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = viewModel::cancelEditingServerUrl, enabled = !state.validating) {
                    Text("Cancel")
                }
                Button(onClick = viewModel::saveServerUrl, enabled = !state.validating) {
                    if (state.validating) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                    } else {
                        Text("Save")
                    }
                }
            }
        } else {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column {
                    Text("Server URL", style = MaterialTheme.typography.bodyLarge)
                    Text(
                        state.serverUrl.ifEmpty { "Not configured" },
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                TextButton(onClick = viewModel::startEditingServerUrl) { Text("Change") }
            }
        }

        HorizontalDivider()

        Spacer(Modifier.weight(1f))

        Button(
            onClick = viewModel::logout,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = StreamioRed),
        ) {
            Text("Sign out")
        }
    }
}
