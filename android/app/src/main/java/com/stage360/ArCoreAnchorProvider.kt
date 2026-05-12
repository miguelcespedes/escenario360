package com.stage360

import android.content.Context
import com.google.ar.core.Anchor
import com.google.ar.core.Plane
import com.google.ar.core.Pose
import com.google.ar.core.Session
import com.google.ar.core.TrackingState

class ArCoreAnchorProvider(private val context: Context) : ArWorldAnchorProvider {
  private var session: Session? = null
  private var anchors: MutableList<Anchor> = mutableListOf()
  private var lastScanState = RoomScanState(false, false, "initializing")
  private var floorY: Double = 0.0
  private var hasRoomBounds = false
  private var roomMinX = 0.0
  private var roomMaxX = 0.0
  private var roomMinZ = 0.0
  private var roomMaxZ = 0.0

  private fun buildRectanglePerimeterPoints(count: Int, y: Double): List<AnchorPoint3D> {
    if (!hasRoomBounds || count <= 0) {
      return emptyList()
    }

    val minX = roomMinX
    val maxX = roomMaxX
    val minZ = roomMinZ
    val maxZ = roomMaxZ
    val width = (maxX - minX).coerceAtLeast(0.4)
    val depth = (maxZ - minZ).coerceAtLeast(0.4)
    val perimeter = 2.0 * (width + depth)
    if (perimeter <= 0.0) {
      return emptyList()
    }

    val step = perimeter / count.toDouble()
    return (0 until count).map { i ->
      val distance = i * step
      val d = distance % perimeter
      when {
        d <= width -> AnchorPoint3D(minX + d, y, minZ)
        d <= width + depth -> AnchorPoint3D(maxX, y, minZ + (d - width))
        d <= (2 * width) + depth -> AnchorPoint3D(maxX - (d - (width + depth)), y, maxZ)
        else -> AnchorPoint3D(minX, y, maxZ - (d - ((2 * width) + depth)))
      }
    }
  }

  override fun isAvailable(): Boolean {
    return context.packageManager.hasSystemFeature("com.google.ar.core")
  }

  override fun start(): Boolean {
    if (!isAvailable()) {
      return false
    }

    return try {
      if (session == null) {
        session = Session(context)
        session?.resume()
      }
      lastScanState = RoomScanState(false, false, "scanning")
      true
    } catch (_: Exception) {
      lastScanState = RoomScanState(false, false, "unavailable")
      false
    }
  }

  override fun stop() {
    anchors.forEach { anchor ->
      anchor.detach()
    }
    anchors.clear()
    try {
      session?.pause()
    } catch (_: Exception) {
    }
    session?.close()
    session = null
    lastScanState = RoomScanState(false, false, "idle")
    hasRoomBounds = false
  }

  override fun getScanState(): RoomScanState {
    val activeSession = session ?: return lastScanState
    return try {
      val frame = activeSession.update()
      var floorDetected = false
      var wallsDetected = false
      var minX = Double.POSITIVE_INFINITY
      var maxX = Double.NEGATIVE_INFINITY
      var minZ = Double.POSITIVE_INFINITY
      var maxZ = Double.NEGATIVE_INFINITY
      frame.getUpdatedTrackables(Plane::class.java).forEach { plane ->
        if (plane.trackingState != TrackingState.TRACKING) {
          return@forEach
        }
        when (plane.type) {
          Plane.Type.HORIZONTAL_UPWARD_FACING -> {
            floorDetected = true
            floorY = plane.centerPose.ty().toDouble()
          }
          Plane.Type.VERTICAL -> {
            wallsDetected = true
            val cx = plane.centerPose.tx().toDouble()
            val cz = plane.centerPose.tz().toDouble()
            if (cx < minX) minX = cx
            if (cx > maxX) maxX = cx
            if (cz < minZ) minZ = cz
            if (cz > maxZ) maxZ = cz
          }
          else -> Unit
        }
      }

      if (wallsDetected && minX.isFinite() && maxX.isFinite() && minZ.isFinite() && maxZ.isFinite()) {
        val padding = 0.2
        roomMinX = minX - padding
        roomMaxX = maxX + padding
        roomMinZ = minZ - padding
        roomMaxZ = maxZ + padding
        hasRoomBounds = true
      }

      val quality =
        if (floorDetected && wallsDetected) "ready"
        else if (floorDetected || wallsDetected) "scanning"
        else "initializing"

      lastScanState = RoomScanState(floorDetected, wallsDetected, quality)
      lastScanState
    } catch (_: Exception) {
      lastScanState = RoomScanState(false, false, "scanning")
      lastScanState
    }
  }

  override fun createEquatorAnchors(count: Int, radiusMeters: Double): List<AnchorPoint3D> {
    val activeSession = session ?: return emptyList()
    if (count <= 0 || radiusMeters <= 0.0) {
      return emptyList()
    }

    anchors.forEach { anchor ->
      anchor.detach()
    }
    anchors.clear()

    val baseY = floorY + 1.6
    val perimeterPoints = buildRectanglePerimeterPoints(count = count, y = baseY)
    val points = if (perimeterPoints.isNotEmpty()) {
      perimeterPoints
    } else {
      val step = 360.0 / count.toDouble()
      (0 until count).map { i ->
        val radians = Math.toRadians(i * step)
        val x = radiusMeters * kotlin.math.cos(radians)
        val z = radiusMeters * kotlin.math.sin(radians)
        AnchorPoint3D(x = x, y = baseY, z = z)
      }
    }

    val result = points.map { p ->
      val pose = Pose(
        floatArrayOf(p.x.toFloat(), p.y.toFloat(), p.z.toFloat()),
        floatArrayOf(0f, 0f, 0f, 1f),
      )
      anchors.add(activeSession.createAnchor(pose))
      p
    }
    return result
  }
}
