import { Phaser } from '../phaser.js'

import {
  FRAGMENT_RADIUS,
  MEDIUM_RADIUS,
  SMALL_ASTEROID_RADIUS_MAX,
  MEDIUM_ASTEROID_RADIUS_MAX,
  LARGE_RADIUS,
  HUGE_ASTEROID_RADIUS_MAX,
  MINING_LEVEL_SCALE_MAX
} from '../constants/asteroids.js'

function getAsteroidSizeTier (radius) {
  if (radius <= SMALL_ASTEROID_RADIUS_MAX) {
    return 0
  }

  if (radius <= MEDIUM_ASTEROID_RADIUS_MAX) {
    return 1
  }

  if (radius <= LARGE_RADIUS + 8) {
    return 2
  }

  return 3
}

function isCollectOnlyRadius (radius) {
  return (radius ?? 0) <= SMALL_ASTEROID_RADIUS_MAX
}

function isCollectOnlyAsteroid (asteroid) {
  if (!asteroid) {
    return false
  }

  if (asteroid.isFragment) {
    return true
  }

  return isCollectOnlyRadius(asteroid.radius)
}

function isDrillableAsteroid (asteroid) {
  if (!asteroid?.active || asteroid.isHazard || isCollectOnlyAsteroid(asteroid)) {
    return false
  }

  if (asteroid.isDepleted || (asteroid.mineralsRemaining ?? 0) <= 0) {
    return false
  }

  return (asteroid.mineralsTotal ?? 0) > 0
}

function shouldSmallAsteroidDeflectOffLarge (small, large) {
  if (!small?.active || !large?.active) {
    return false
  }

  return getAsteroidSizeTier(small.radius) === 0 && getAsteroidSizeTier(large.radius) >= 1
}

function getFieldAsteroidSpawnRadius (minRadius, maxRadius) {
  const hugeMin = Math.max(LARGE_RADIUS + 12, minRadius)

  if (Math.random() < 0.12 && maxRadius >= hugeMin) {
    return Phaser.Math.Between(hugeMin, maxRadius)
  }

  const largeMin = Math.max(minRadius, MEDIUM_ASTEROID_RADIUS_MAX + 2)
  const largeMax = Math.min(maxRadius, LARGE_RADIUS + 8)

  if (Math.random() < 0.42 && largeMax >= largeMin) {
    return Phaser.Math.Between(largeMin, largeMax)
  }

  const mediumMax = Math.min(maxRadius, MEDIUM_ASTEROID_RADIUS_MAX + 4)

  return Phaser.Math.Between(minRadius, Math.max(minRadius, mediumMax))
}

function getMiningFieldProgress (level) {
  return Phaser.Math.Clamp((Math.max(1, level) - 1) / MINING_LEVEL_SCALE_MAX, 0, 1)
}

function getFractureAvailableSlots (fieldCount, maxCount) {
  return Math.max(0, maxCount - fieldCount + 1)
}

function shouldShieldDeflectOnly (asteroid) {
  if (!asteroid) {
    return true
  }

  if (asteroid.isFragment) {
    return true
  }

  return (asteroid.radius ?? 0) <= FRAGMENT_RADIUS + 3
}

function canAsteroidFracture (asteroid, fieldCount, maxCount) {
  if (!asteroid) {
    return false
  }

  const available = getFractureAvailableSlots(fieldCount, maxCount)
  if (available <= 0) {
    return false
  }

  const radius = asteroid.radius ?? 0
  if (radius > FRAGMENT_RADIUS + 3) {
    return true
  }

  return !asteroid.isHazard
}

function getFractureChildCount (radius, isHazard, fieldCount, maxCount) {
  const available = getFractureAvailableSlots(fieldCount, maxCount)
  if (available <= 0) {
    return 0
  }

  if (radius > FRAGMENT_RADIUS + 3) {
    return Math.min(Phaser.Math.Between(2, 3), available)
  }

  if (!isHazard) {
    return 1
  }

  return 0
}

function getMiningFieldParams (level) {
  const progress = getMiningFieldProgress(level)

  const minRadius = Math.round(Phaser.Math.Linear(MEDIUM_RADIUS, MEDIUM_RADIUS + 4, progress))
  const maxRadius = Math.round(Phaser.Math.Linear(HUGE_ASTEROID_RADIUS_MAX, LARGE_RADIUS + 10, progress))

  const spinDurationMin = Math.round(Phaser.Math.Linear(10000, 1600, progress))
  const spinDurationMax = Math.round(Phaser.Math.Linear(16000, 3600, progress))

  const baseCount = Phaser.Math.Linear(10, 6, progress)
  const levelBonus = Math.sqrt(Math.max(1, level)) * Phaser.Math.Linear(0.75, 0.2, progress)
  const asteroidCount = Math.max(4, Math.round(baseCount + levelBonus))

  const minSpawnDistFromOrigin = Math.round(Phaser.Math.Linear(200, 420, progress))
  const maxSpawnDistFraction = Phaser.Math.Linear(0.4, 0.98, progress)
  const clusterTightness = Phaser.Math.Linear(0.55, 1, progress)

  return {
    progress,
    minRadius,
    maxRadius,
    spinDurationMin,
    spinDurationMax,
    asteroidCount,
    minSpawnDistFromOrigin,
    maxSpawnDistFraction,
    clusterTightness
  }
}

export {
  getAsteroidSizeTier,
  isCollectOnlyRadius,
  isCollectOnlyAsteroid,
  isDrillableAsteroid,
  shouldSmallAsteroidDeflectOffLarge,
  getFieldAsteroidSpawnRadius,
  getFractureAvailableSlots,
  shouldShieldDeflectOnly,
  canAsteroidFracture,
  getFractureChildCount,
  getMiningFieldProgress,
  getMiningFieldParams
}
