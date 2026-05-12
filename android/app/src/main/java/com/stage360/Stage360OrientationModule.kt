package com.stage360

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class Stage360OrientationModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), SensorEventListener {

  private val sensorManager =
    reactContext.getSystemService(Context.SENSOR_SERVICE) as SensorManager
  private val rotationSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)

  override fun getName(): String = "Stage360Orientation"

  @ReactMethod
  fun start() {
    rotationSensor?.let {
      sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
    }
  }

  @ReactMethod
  fun stop() {
    sensorManager.unregisterListener(this)
  }

  @ReactMethod
  fun addListener(eventName: String) {
  }

  @ReactMethod
  fun removeListeners(count: Int) {
  }

  override fun onSensorChanged(event: SensorEvent?) {
    if (event == null || event.sensor.type != Sensor.TYPE_ROTATION_VECTOR) {
      return
    }

    val rotationMatrix = FloatArray(9)
    SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values)
    val orientation = FloatArray(3)
    SensorManager.getOrientation(rotationMatrix, orientation)

    val yaw = Math.toDegrees(orientation[0].toDouble()).toFloat()
    val pitch = Math.toDegrees(orientation[1].toDouble()).toFloat()
    val roll = Math.toDegrees(orientation[2].toDouble()).toFloat()

    val normalizedYaw = ((yaw + 360f) % 360f)
    val payload = Arguments.createMap().apply {
      putDouble("yaw", normalizedYaw.toDouble())
      putDouble("pitch", pitch.toDouble())
      putDouble("roll", roll.toDouble())
    }

    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("stage360_orientation", payload)
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
  }
}
