package com.stage360

data class AnchorPoint3D(
  val x: Double,
  val y: Double,
  val z: Double,
)

data class RoomScanState(
  val floorDetected: Boolean,
  val wallsDetected: Boolean,
  val quality: String,
)

interface ArWorldAnchorProvider {
  fun isAvailable(): Boolean
  fun start(): Boolean
  fun stop()
  fun getScanState(): RoomScanState
  fun createEquatorAnchors(count: Int, radiusMeters: Double = 1.0): List<AnchorPoint3D>
}

class SyntheticAnchorProvider : ArWorldAnchorProvider {
  override fun isAvailable(): Boolean = true

  override fun start(): Boolean = true

  override fun stop() {
  }

  override fun getScanState(): RoomScanState {
    return RoomScanState(
      floorDetected = true,
      wallsDetected = true,
      quality = "ready",
    )
  }

  override fun createEquatorAnchors(count: Int, radiusMeters: Double): List<AnchorPoint3D> {
    if (count <= 0) {
      return emptyList()
    }

    val step = 360.0 / count.toDouble()
    return (0 until count).map { i ->
      val radians = Math.toRadians(i * step)
      val x = radiusMeters * kotlin.math.cos(radians)
      val y = 0.0
      val z = radiusMeters * kotlin.math.sin(radians)
      AnchorPoint3D(x = x, y = y, z = z)
    }
  }
}
