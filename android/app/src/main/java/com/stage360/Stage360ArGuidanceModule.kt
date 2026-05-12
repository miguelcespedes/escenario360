package com.stage360

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class Stage360ArGuidanceModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var sessionActive = false
  private var totalAnchors = 0
  private var activeAnchorIndex = 0
  private var anchorYaw = 0.0
  private var anchorPitch = 0.0
  private var anchorPoints: List<Pair<Double, Double>> = emptyList()
  private var anchorPointsWorld: List<AnchorPoint3D> = emptyList()
  private val syntheticProvider: ArWorldAnchorProvider = SyntheticAnchorProvider()
  private val arCoreProvider: ArWorldAnchorProvider = ArCoreAnchorProvider(reactContext)
  private var anchorMode = "synthetic"
  private var worldAnchorsSupported = false
  private var modeReason = "World anchors pendientes de implementacion"
  private var floorDetected = false
  private var wallsDetected = false
  private var sessionQuality = "initializing"

  private fun normalizeYaw(yaw: Double): Double {
    val normalized = yaw % 360.0
    return if (normalized < 0) normalized + 360.0 else normalized
  }

  private fun refreshScanState() {
    if (!sessionActive) {
      return
    }

    val provider = if (anchorMode == "world" && arCoreProvider.isAvailable()) arCoreProvider else syntheticProvider
    val scan = provider.getScanState()
    floorDetected = scan.floorDetected
    wallsDetected = scan.wallsDetected
    sessionQuality = scan.quality
  }

  override fun getName(): String = "Stage360ArGuidance"

  @ReactMethod
  fun isSupported(promise: Promise) {
    val hasArFeature = reactContext.packageManager.hasSystemFeature("com.google.ar.core")
    promise.resolve(hasArFeature)
  }

  @ReactMethod
  fun startSession(promise: Promise) {
    val hasArFeature = reactContext.packageManager.hasSystemFeature("com.google.ar.core")
    if (!hasArFeature) {
      sessionActive = false
      worldAnchorsSupported = false
      modeReason = "ARCore no disponible en este dispositivo"
      emitStatus()
      promise.resolve(false)
      return
    }

    val started = arCoreProvider.start()
    if (!started) {
      sessionActive = false
      worldAnchorsSupported = false
      modeReason = "No se pudo iniciar sesion ARCore"
      emitStatus()
      promise.resolve(false)
      return
    }

    sessionActive = true
    anchorMode = "world"
    worldAnchorsSupported = true
    modeReason = "ARCore detectado"
    floorDetected = false
    wallsDetected = false
    sessionQuality = "scanning"
    emitStatus()
    promise.resolve(true)
  }

  @ReactMethod
  fun stopSession(promise: Promise) {
    sessionActive = false
    totalAnchors = 0
    activeAnchorIndex = 0
    anchorPoints = emptyList()
    anchorPointsWorld = emptyList()
    anchorMode = "synthetic"
    worldAnchorsSupported = false
    modeReason = "Sesion cerrada"
    floorDetected = false
    wallsDetected = false
    sessionQuality = "idle"
    arCoreProvider.stop()
    syntheticProvider.stop()
    emitStatus()
    promise.resolve(null)
  }

  @ReactMethod
  fun setAnchorMode(mode: String, promise: Promise) {
    anchorMode = if (mode == "world") {
      if (arCoreProvider.isAvailable()) {
        worldAnchorsSupported = true
        modeReason = "Modo world activo con provider ARCore"
        sessionQuality = "scanning"
        "world"
      } else {
        worldAnchorsSupported = false
        modeReason = "ARCore no disponible"
        sessionQuality = "unavailable"
        "world"
      }
    } else {
      worldAnchorsSupported = false
      modeReason = "Modo AR requerido: world"
      sessionQuality = "unavailable"
      "world"
    }
    emitStatus()
    promise.resolve(anchorMode)
  }

  @ReactMethod
  fun createEquatorAnchors(count: Int, baseYaw: Double, basePitch: Double, promise: Promise) {
    if (!sessionActive || count <= 0 || !worldAnchorsSupported) {
      promise.resolve(false)
      return
    }

    refreshScanState()
    if (!floorDetected || !wallsDetected) {
      modeReason = "Escaneo incompleto: detecta suelo y paredes"
      emitStatus()
      promise.resolve(false)
      return
    }

    totalAnchors = count
    activeAnchorIndex = 1
    anchorYaw = baseYaw
    anchorPitch = basePitch
    val step = 360.0 / count.toDouble()
    anchorPoints = (0 until count).map { i ->
      Pair(normalizeYaw(baseYaw + i * step), basePitch)
    }
    val provider = if (anchorMode == "world" && arCoreProvider.isAvailable()) arCoreProvider else syntheticProvider
    anchorPointsWorld = provider.createEquatorAnchors(count = count, radiusMeters = 1.0)
    if (anchorPointsWorld.isNotEmpty()) {
      sessionQuality = "ready"
    }
    emitStatus()
    promise.resolve(true)
  }

  @ReactMethod
  fun getAnchors(promise: Promise) {
    val array = Arguments.createArray()
    anchorPoints.forEachIndexed { index, pair ->
      val world = anchorPointsWorld.getOrNull(index)
      val item = Arguments.createMap().apply {
        putInt("index", index + 1)
        putDouble("yaw", pair.first)
        putDouble("pitch", pair.second)
        if (world != null) {
          putDouble("x", world.x)
          putDouble("y", world.y)
          putDouble("z", world.z)
        }
      }
      array.pushMap(item)
    }
    promise.resolve(array)
  }

  @ReactMethod
  fun advanceToNextAnchor(promise: Promise) {
    if (!sessionActive || totalAnchors <= 0) {
      promise.resolve(false)
      return
    }

    if (activeAnchorIndex < totalAnchors) {
      activeAnchorIndex += 1
      emitStatus()
      promise.resolve(true)
      return
    }

    emitStatus()
    promise.resolve(false)
  }

  @ReactMethod
  fun getStatus(promise: Promise) {
    refreshScanState()
    val currentTarget =
      if (activeAnchorIndex in 1..anchorPoints.size) anchorPoints[activeAnchorIndex - 1] else null
    val currentWorld =
      if (activeAnchorIndex in 1..anchorPointsWorld.size) anchorPointsWorld[activeAnchorIndex - 1] else null

    val payload = Arguments.createMap().apply {
      putBoolean("sessionActive", sessionActive)
      putInt("activeAnchorIndex", activeAnchorIndex)
      putInt("totalAnchors", totalAnchors)
      putDouble("anchorYaw", anchorYaw)
      putDouble("anchorPitch", anchorPitch)
      putString("anchorMode", anchorMode)
      putBoolean("worldAnchorsSupported", worldAnchorsSupported)
      putString("modeReason", modeReason)
      putBoolean("floorDetected", floorDetected)
      putBoolean("wallsDetected", wallsDetected)
      putString("sessionQuality", sessionQuality)
      if (currentTarget != null) {
        putDouble("targetYaw", currentTarget.first)
        putDouble("targetPitch", currentTarget.second)
      }
      if (currentWorld != null) {
        putDouble("targetX", currentWorld.x)
        putDouble("targetY", currentWorld.y)
        putDouble("targetZ", currentWorld.z)
      }
    }
    promise.resolve(payload)
  }

  @ReactMethod
  fun addListener(eventName: String) {
  }

  @ReactMethod
  fun removeListeners(count: Int) {
  }

  private fun emitStatus() {
    refreshScanState()
    val currentTarget =
      if (activeAnchorIndex in 1..anchorPoints.size) anchorPoints[activeAnchorIndex - 1] else null
    val currentWorld =
      if (activeAnchorIndex in 1..anchorPointsWorld.size) anchorPointsWorld[activeAnchorIndex - 1] else null

    val payload = Arguments.createMap().apply {
      putBoolean("sessionActive", sessionActive)
      putInt("activeAnchorIndex", activeAnchorIndex)
      putInt("totalAnchors", totalAnchors)
      putDouble("anchorYaw", anchorYaw)
      putDouble("anchorPitch", anchorPitch)
      putString("anchorMode", anchorMode)
      putBoolean("worldAnchorsSupported", worldAnchorsSupported)
      putString("modeReason", modeReason)
      putBoolean("floorDetected", floorDetected)
      putBoolean("wallsDetected", wallsDetected)
      putString("sessionQuality", sessionQuality)
      if (currentTarget != null) {
        putDouble("targetYaw", currentTarget.first)
        putDouble("targetPitch", currentTarget.second)
      }
      if (currentWorld != null) {
        putDouble("targetX", currentWorld.x)
        putDouble("targetY", currentWorld.y)
        putDouble("targetZ", currentWorld.z)
      }
    }

    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("stage360_ar_status", payload)
  }
}
