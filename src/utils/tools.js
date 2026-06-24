import { Phaser } from '../phaser.js'

import {
  TRACTOR_BEAM_MAX_LEVEL,
  TRACTOR_BEAM_RANGE_BY_LEVEL,
  TRACTOR_BEAM_PULL_BY_LEVEL,
  TRACTOR_BEAM_CONE_RADIANS,
  TRACTOR_HOLD_SURFACE_GAP,
  TRACTOR_COLLECT_SURFACE_GAP,
  SCANNER_MAX_LEVEL,
  SCANNER_RANGE_BY_LEVEL,
  TRACTOR_COLLECT_SIZE_PULL_MAX,
  TRACTOR_COLLECT_SIZE_PULL_MIN
} from '../constants/tools.js'
import { FRAGMENT_RADIUS, PIXELS_PER_METER, SMALL_ASTEROID_RADIUS_MAX } from '../constants/asteroids.js'
import { RESOURCE_COLORS } from '../constants/resources.js'
import { getAsteroidSizeTier } from './asteroids.js'

function worldDistanceToMeters (distancePixels) {
  return Math.max(0, Math.round(distancePixels / PIXELS_PER_METER))
}

function getTractorBeamRange (level) {
  const clamped = Phaser.Math.Clamp(level ?? 0, 0, TRACTOR_BEAM_MAX_LEVEL)
  return TRACTOR_BEAM_RANGE_BY_LEVEL[clamped] ?? 0
}

function getTractorBeamPull (level) {
  const clamped = Phaser.Math.Clamp(level ?? 0, 0, TRACTOR_BEAM_MAX_LEVEL)
  return TRACTOR_BEAM_PULL_BY_LEVEL[clamped] ?? 0
}

function getTractorPower (tractorLevel) {
  const level = Math.max(1, tractorLevel ?? 1)
  return Math.pow(level, 1.45) * 2.85
}

function getTractorMode (asteroidRadius) {
  return getAsteroidSizeTier(asteroidRadius) === 0 ? 'collect' : 'hold'
}

function getTractorEffectiveness (tractorLevel, asteroidRadius) {
  const tier = getAsteroidSizeTier(asteroidRadius)
  const radius = Math.max(FRAGMENT_RADIUS, asteroidRadius)
  const power = getTractorPower(tractorLevel)

  if (tier === 0) {
    const mass = Math.pow(radius / FRAGMENT_RADIUS, 1.35)
    return Phaser.Math.Clamp(power / mass, 0.85, 1.55)
  }

  if (tier === 1) {
    const mass = Math.pow(radius / FRAGMENT_RADIUS, 1.85)
    return Phaser.Math.Clamp(power / mass, 0.28, 1.1)
  }

  if (tier === 2) {
    const mass = Math.pow(radius / FRAGMENT_RADIUS, 2.05)
    return Phaser.Math.Clamp(power / mass, 0.18, 0.95)
  }

  const mass = Math.pow(radius / FRAGMENT_RADIUS, 2.25)
  return Phaser.Math.Clamp(power / mass, 0.12, 0.85)
}

function getTractorCollectForceMult (asteroidRadius) {
  if (getAsteroidSizeTier(asteroidRadius) !== 0) {
    return 1
  }

  const radius = Math.max(FRAGMENT_RADIUS, asteroidRadius)
  const sizeRatio = Phaser.Math.Clamp(
    (radius - FRAGMENT_RADIUS) / Math.max(1, SMALL_ASTEROID_RADIUS_MAX - FRAGMENT_RADIUS),
    0,
    1
  )

  return Phaser.Math.Linear(TRACTOR_COLLECT_SIZE_PULL_MAX, TRACTOR_COLLECT_SIZE_PULL_MIN, sizeRatio)
}

function getScannerRange (level) {
  const clamped = Phaser.Math.Clamp(level ?? 0, 0, SCANNER_MAX_LEVEL)
  return SCANNER_RANGE_BY_LEVEL[clamped] ?? 0
}

function getScannerMarkerColor (asteroid) {
  if (asteroid?.isHazard) {
    return 0xd35d5d
  }

  const resourceType = asteroid?.resourceType ?? 'iron'
  return RESOURCE_COLORS[resourceType] ?? 0x8fcbe8
}

function isAsteroidInTractorCone (
  playerX,
  playerY,
  shipHeading,
  asteroidX,
  asteroidY,
  asteroidRadius,
  range,
  coneRadians = TRACTOR_BEAM_CONE_RADIANS
) {
  const dx = asteroidX - playerX
  const dy = asteroidY - playerY
  const dist = Math.hypot(dx, dy)

  if (dist <= 1 || dist > range + asteroidRadius) {
    return false
  }

  const angleToAsteroid = Math.atan2(dy, dx)
  const headingDelta = Math.abs(Phaser.Math.Angle.Wrap(angleToAsteroid - shipHeading))

  return headingDelta <= (coneRadians / 2)
}

function getTractorTargetPoint (playerX, playerY, shipHeading, shipMetrics, asteroidRadius, mode) {
  const cos = Math.cos(shipHeading)
  const sin = Math.sin(shipHeading)
  const noseOffset = shipMetrics.noseOffset
  const bodyRadius = shipMetrics.bodyRadius

  if (mode === 'collect') {
    const surfaceGap = TRACTOR_COLLECT_SURFACE_GAP
    const noseX = playerX + (cos * noseOffset * 0.2)
    const noseY = playerY + (sin * noseOffset * 0.2)

    return {
      x: noseX,
      y: noseY,
      holdDist: Math.max(10, bodyRadius + (asteroidRadius * 0.65)),
      surfaceGap,
      centerDist: noseOffset + (asteroidRadius * 0.35) + surfaceGap
    }
  }

  const surfaceGap = TRACTOR_HOLD_SURFACE_GAP
  const centerDist = noseOffset + asteroidRadius + surfaceGap

  return {
    x: playerX + (cos * centerDist),
    y: playerY + (sin * centerDist),
    holdDist: Math.max(8, surfaceGap + 5),
    surfaceGap,
    centerDist
  }
}

function getTractorCollectReach (shipMetrics, asteroidRadius) {
  return shipMetrics.bodyRadius + (asteroidRadius * 0.82)
}

export {
  worldDistanceToMeters,
  getTractorBeamRange,
  getTractorBeamPull,
  getTractorPower,
  getTractorMode,
  getTractorEffectiveness,
  getTractorCollectForceMult,
  getTractorTargetPoint,
  getTractorCollectReach,
  getScannerRange,
  getScannerMarkerColor,
  isAsteroidInTractorCone
}
