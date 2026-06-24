import {
  DOCK_ARM_LENGTH,
  DOCK_ARM_HALF_HEIGHT,
  DOCK_ARM_HULL_NOTCH,
  DOCK_PORT_OUTSET,
  DOCK_PORT_FRAME_OFFSET,
  DOCK_PORT_FRAME_WIDTH,
  DOCK_PORT_FRAME_HEIGHT,
  MOTHERSHIP_FIELD_HEIGHT
} from '../constants/asteroids.js'

function buildMothershipLayoutFromBounds (topY, bottomY, leftHullX, rightHullX) {
  const centerY = (topY + bottomY) / 2
  const centerX = (leftHullX + rightHullX) / 2
  const corridorTop = centerY - DOCK_ARM_HALF_HEIGHT
  const corridorBottom = centerY + DOCK_ARM_HALF_HEIGHT
  const corridorLeftX = leftHullX - DOCK_ARM_LENGTH

  return {
    topY,
    bottomY,
    leftHullX,
    rightHullX,
    centerY,
    centerX,
    corridorLeftX,
    corridorTop,
    corridorBottom,
    dockPortX: corridorLeftX - DOCK_PORT_OUTSET,
    dockPortY: centerY - (DOCK_PORT_FRAME_HEIGHT / 2) - 3,
    mothershipRightHullX: rightHullX,
    mothershipCenterY: centerY,
    stationBaseX: rightHullX - 120,
    stationBaseY: centerY
  }
}

function buildLevelMothershipLayout (centerX, centerY, height = MOTHERSHIP_FIELD_HEIGHT) {
  const halfSpan = height / 2
  const topY = centerY - halfSpan + 26
  const bottomY = centerY + halfSpan - 38
  const leftHullX = centerX - 60
  const rightHullX = centerX + 240

  return buildMothershipLayoutFromBounds(topY, bottomY, leftHullX, rightHullX)
}

function buildScreenMothershipLayout (width, height) {
  const topY = 66
  const bottomY = height - 38
  const leftHullX = width - 240
  const rightHullX = width + 42

  return buildMothershipLayoutFromBounds(topY, bottomY, leftHullX, rightHullX)
}

function drawMothershipHull (graphics, layout) {
  const {
    topY,
    bottomY,
    leftHullX,
    rightHullX,
    centerY,
    corridorLeftX,
    corridorTop,
    corridorBottom
  } = layout

  graphics.clear()
  graphics.lineStyle(2, 0x0f1720, 1)

  const hullShape = [
    { x: leftHullX, y: topY + 26 },
    { x: leftHullX + 58, y: topY },
    { x: rightHullX - 78, y: topY + 8 },
    { x: rightHullX, y: centerY - 30 },
    { x: rightHullX + 8, y: centerY + 24 },
    { x: rightHullX - 76, y: bottomY - 8 },
    { x: leftHullX + 66, y: bottomY + 8 },
    { x: leftHullX, y: bottomY - 18 }
  ]

  graphics.fillStyle(0x3f5773, 0.96)
  graphics.fillPoints(hullShape, true)
  graphics.strokePoints(hullShape, true)

  graphics.fillStyle(0x2f4257, 0.92)
  graphics.fillRect(leftHullX + 34, topY + 44, 186, 56)
  graphics.fillRect(leftHullX + 44, centerY - 26, 212, 72)
  graphics.fillRect(leftHullX + 36, bottomY - 112, 194, 56)
  graphics.strokeRect(leftHullX + 34, topY + 44, 186, 56)
  graphics.strokeRect(leftHullX + 44, centerY - 26, 212, 72)
  graphics.strokeRect(leftHullX + 36, bottomY - 112, 194, 56)

  graphics.fillStyle(0x8fcbe8, 0.88)
  graphics.fillRoundedRect(rightHullX - 150, topY + 26, 92, 26, 8)
  graphics.strokeRoundedRect(rightHullX - 150, topY + 26, 92, 26, 8)

  graphics.fillStyle(0x1d2731, 1)
  graphics.fillCircle(rightHullX - 18, centerY - 48, 18)
  graphics.fillCircle(rightHullX - 10, centerY, 22)
  graphics.fillCircle(rightHullX - 20, centerY + 52, 18)
  graphics.strokeCircle(rightHullX - 18, centerY - 48, 18)
  graphics.strokeCircle(rightHullX - 10, centerY, 22)
  graphics.strokeCircle(rightHullX - 20, centerY + 52, 18)

  graphics.fillStyle(0x3f5773, 0.95)
  graphics.fillRect(corridorLeftX, corridorTop, DOCK_ARM_LENGTH, corridorBottom - corridorTop)
  graphics.strokeRect(corridorLeftX, corridorTop, DOCK_ARM_LENGTH, corridorBottom - corridorTop)
  graphics.fillTriangle(leftHullX, corridorTop, leftHullX + DOCK_ARM_HULL_NOTCH, centerY - 5, leftHullX, corridorBottom)
  graphics.strokeTriangle(leftHullX, corridorTop, leftHullX + DOCK_ARM_HULL_NOTCH, centerY - 5, leftHullX, corridorBottom)

  graphics.fillStyle(0x1a2530, 1)
  graphics.fillRoundedRect(
    corridorLeftX - DOCK_PORT_FRAME_OFFSET,
    centerY - (DOCK_PORT_FRAME_HEIGHT / 2),
    DOCK_PORT_FRAME_WIDTH,
    DOCK_PORT_FRAME_HEIGHT,
    6
  )
  graphics.strokeRoundedRect(
    corridorLeftX - DOCK_PORT_FRAME_OFFSET,
    centerY - (DOCK_PORT_FRAME_HEIGHT / 2),
    DOCK_PORT_FRAME_WIDTH,
    DOCK_PORT_FRAME_HEIGHT,
    6
  )

  graphics.fillStyle(0xd35d5d, 0.95)
  graphics.fillTriangle(corridorLeftX - 22, centerY - 9, corridorLeftX - 15, centerY - 4, corridorLeftX - 15, centerY - 14)
  graphics.fillTriangle(corridorLeftX - 22, centerY + 9, corridorLeftX - 15, centerY + 14, corridorLeftX - 15, centerY + 4)
  graphics.strokeTriangle(corridorLeftX - 22, centerY - 9, corridorLeftX - 15, centerY - 4, corridorLeftX - 15, centerY - 14)
  graphics.strokeTriangle(corridorLeftX - 22, centerY + 9, corridorLeftX - 15, centerY + 14, corridorLeftX - 15, centerY + 4)
}

export {
  buildMothershipLayoutFromBounds,
  buildLevelMothershipLayout,
  buildScreenMothershipLayout,
  drawMothershipHull
}
