package com.expensify.chat

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = AppStartTimeModule.NAME)
class AppStartTimeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        const val NAME = "AppStartTime"
        var appStartTime: Double = 0.0
    }

    override fun getName(): String = NAME

    override fun getConstants(): Map<String, Any> = mapOf("APP_START_TIME" to appStartTime)
}
