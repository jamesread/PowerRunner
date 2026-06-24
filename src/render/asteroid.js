import { RESOURCE_COLORS } from '../constants/resources.js'
import {
  MEDIUM_RADIUS,
  SMALL_ASTEROID_RADIUS_MAX,
  LARGE_RADIUS
} from '../constants/asteroids.js'

function getRandomAsteroidResourceType () {
  const roll = Math.random()
  if (roll < 0.38) {
    return 'iron'
  }

  if (roll < 0.9) {
    return 'helium3'
  }

  return 'crystal'
}

function shadeHexColor (hexColor, factor) {
  const clamp255 = (value) => Math.max(0, Math.min(255, Math.round(value)))
  const r = (hexColor >> 16) & 0xff
  const g = (hexColor >> 8) & 0xff
  const b = hexColor & 0xff

  const shadeChannel = (channel) => {
    if (factor >= 1) {
      return clamp255(channel + ((255 - channel) * (factor - 1)))
    }

    return clamp255(channel * factor)
  }

  const sr = shadeChannel(r)
  const sg = shadeChannel(g)
  const sb = shadeChannel(b)

  return ((sr << 16) | (sg << 8) | sb) >>> 0
}

function getAsteroidColorsForResource (resourceType) {
  const key = RESOURCE_COLORS[resourceType] ? resourceType : 'iron'
  const resourceColor = RESOURCE_COLORS[key]

  return {
    base: shadeHexColor(resourceColor, 0.92),
    edge: shadeHexColor(resourceColor, 0.5),
    crater: shadeHexColor(resourceColor, 1.3)
  }
}

const ASTEROID_WOBBLE_MIN = 0.78
const ASTEROID_WOBBLE_AMPLITUDE = 0.42

function getAsteroidPointCount (radius) {
  return radius >= LARGE_RADIUS ? 12 : 9
}

function getAsteroidWobble (pointIndex, seedOffset = 0) {
  return ASTEROID_WOBBLE_MIN + (Math.abs(Math.sin((pointIndex + 1 + seedOffset) * 1.9)) * ASTEROID_WOBBLE_AMPLITUDE)
}

function getAsteroidOutlinePoints (x, y, radius, seedOffset = 0) {
  const pointCount = getAsteroidPointCount(radius)
  const points = []

  for (let i = 0; i < pointCount; i++) {
    const angle = ((Math.PI * 2) / pointCount) * i
    const wobble = getAsteroidWobble(i, seedOffset)
    points.push({
      x: x + (Math.cos(angle) * radius * wobble),
      y: y + (Math.sin(angle) * radius * wobble)
    })
  }

  return points
}

function getAsteroidHullRadius (radius, seedOffset = 0) {
  if (radius <= 0) {
    return 0
  }

  let hullRadius = 0

  for (const point of getAsteroidOutlinePoints(0, 0, radius, seedOffset)) {
    const dist = Math.hypot(point.x, point.y)
    if (dist > hullRadius) {
      hullRadius = dist
    }
  }

  return hullRadius
}

function getAsteroidMaxHullRadius (radius) {
  if (radius <= 0) {
    return 0
  }

  return radius * (ASTEROID_WOBBLE_MIN + ASTEROID_WOBBLE_AMPLITUDE)
}

function getAsteroidInteractionRadius (asteroid) {
  if (!asteroid) {
    return 0
  }

  if (typeof asteroid.hullRadius === 'number' && asteroid.hullRadius > 0) {
    return asteroid.hullRadius
  }

  return getAsteroidHullRadius(asteroid.radius ?? 0, asteroid.seedOffset ?? 0)
}

function getAsteroidMineralCapacity (radius, isHazard, isFragment) {
  if (isHazard || isFragment || radius <= SMALL_ASTEROID_RADIUS_MAX) {
    return 0
  }

  const scaled = radius * 0.38

  if (radius >= LARGE_RADIUS) {
    return Math.max(10, Math.round(scaled * 1.35))
  }

  if (radius >= MEDIUM_RADIUS) {
    return Math.max(4, Math.round(scaled))
  }

  return Math.max(2, Math.round(scaled * 0.85))
}

function drawAsteroid (graphics, x, y, radius, colors, seedOffset = 0) {
  const points = getAsteroidOutlinePoints(x, y, radius, seedOffset)

  graphics.fillStyle(colors.base, 1)
  graphics.fillPoints(points, true)
  graphics.lineStyle(2, colors.edge, 0.9)
  graphics.strokePoints(points, true)

  graphics.fillStyle(colors.crater, 0.85)
  graphics.fillCircle(x - (radius * 0.18), y - (radius * 0.12), radius * 0.24)
  graphics.fillCircle(x + (radius * 0.2), y + (radius * 0.1), radius * 0.16)
}

export {
  ASTEROID_WOBBLE_MIN,
  ASTEROID_WOBBLE_AMPLITUDE,
  getRandomAsteroidResourceType,
  shadeHexColor,
  getAsteroidColorsForResource,
  getAsteroidPointCount,
  getAsteroidWobble,
  getAsteroidOutlinePoints,
  getAsteroidHullRadius,
  getAsteroidMaxHullRadius,
  getAsteroidInteractionRadius,
  getAsteroidMineralCapacity,
  drawAsteroid
}
