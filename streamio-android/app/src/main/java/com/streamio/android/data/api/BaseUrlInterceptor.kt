package com.streamio.android.data.api

import com.streamio.android.data.preferences.AppPreferences
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BaseUrlInterceptor @Inject constructor(
    private val prefs: AppPreferences,
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val serverUrl = runBlocking { prefs.serverUrl.first() } ?: "http://localhost:3000"
        val base = serverUrl.toHttpUrlOrNull()
            ?: return chain.proceed(chain.request())
        val original = chain.request()
        val newUrl = original.url.newBuilder()
            .scheme(base.scheme)
            .host(base.host)
            .port(base.port)
            .build()
        return chain.proceed(original.newBuilder().url(newUrl).build())
    }
}
