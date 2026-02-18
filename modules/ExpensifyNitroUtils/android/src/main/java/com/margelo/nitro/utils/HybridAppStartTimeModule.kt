package com.margelo.nitro.utils

import android.content.Context
import com.margelo.nitro.NitroModules

class HybridAppStartTimeModule : HybridAppStartTimeModuleSpec() {
    override val memorySize: Long = 16L

    override fun recordAppStartTime() {
        val context = NitroModules.applicationContext ?: return
        val prefs = context.getSharedPreferences("AppStartTime", Context.MODE_PRIVATE)
        prefs.edit().putLong("AppStartTime", System.currentTimeMillis()).apply()
    }

    override val appStartTime: Double
        get() {
            val context = NitroModules.applicationContext ?: return 0.0
            val prefs = context.getSharedPreferences("AppStartTime", Context.MODE_PRIVATE)
            return prefs.getLong("AppStartTime", 0L).toDouble()
        }
}
