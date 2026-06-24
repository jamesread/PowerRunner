import { Phaser } from '../phaser.js'

function rotateAsteroidLocalPoint (asteroid, localX, localY) {
  const rad = Phaser.Math.DegToRad(asteroid.angle)
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  return {
    x: asteroid.x + (localX * cos - localY * sin),
    y: asteroid.y + (localX * sin + localY * cos)
  }
}

function worldPointToAsteroidLocal (asteroid, worldX, worldY) {
  const dx = worldX - asteroid.x
  const dy = worldY - asteroid.y
  const rad = -Phaser.Math.DegToRad(asteroid.angle)
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  return {
    x: (dx * cos) - (dy * sin),
    y: (dx * sin) + (dy * cos)
  }
}

function getScreenEdgePointFromAngle (width, height, angle, margin = 48) {
  const cx = width / 2
  const cy = height / 2
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const hw = (width / 2) - margin
  const hh = (height / 2) - margin
  let t = Infinity

  if (Math.abs(cos) > 0.001) {
    t = Math.min(t, hw / Math.abs(cos))
  }
  if (Math.abs(sin) > 0.001) {
    t = Math.min(t, hh / Math.abs(sin))
  }

  return {
    x: cx + (cos * t),
    y: cy + (sin * t)
  }
}

function worldToScreenPoint (camera, worldX, worldY) {
  return {
    x: worldX - camera.scrollX,
    y: worldY - camera.scrollY
  }
}

function isScreenPointVisible (x, y, width, height, margin = 16) {
  return x >= margin && x <= (width - margin) && y >= margin && y <= (height - margin)
}

function clampPointOutsideCircle (x, y, pointRadius, centerX, centerY, circleRadius, padding = 16) {
  const dx = x - centerX
  const dy = y - centerY
  const dist = Math.hypot(dx, dy)
  const minDist = circleRadius + pointRadius + padding

  if (dist >= minDist) {
    return { x, y }
  }

  const angle = dist > 0 ? Math.atan2(dy, dx) : 0

  return {
    x: centerX + (Math.cos(angle) * minDist),
    y: centerY + (Math.sin(angle) * minDist)
  }
}

export {
  rotateAsteroidLocalPoint,
  worldPointToAsteroidLocal,
  getScreenEdgePointFromAngle,
  worldToScreenPoint,
  isScreenPointVisible,
  clampPointOutsideCircle
}
