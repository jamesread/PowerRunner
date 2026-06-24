import { Phaser } from '../phaser.js'
import { getMiningFieldParams, shouldSmallAsteroidDeflectOffLarge, getFieldAsteroidSpawnRadius, canAsteroidFracture, getFractureChildCount } from '../utils/asteroids.js'
import { clampPointOutsideCircle } from '../utils/geometry.js'
import {
  ASTEROID_SAFE_RADIUS,
  MOTHERSHIP_SAFE_RADIUS,
  MEDIUM_RADIUS,
  MEDIUM_ASTEROID_RADIUS_MAX,
  LARGE_RADIUS,
  FRAGMENT_RADIUS,
  SMALL_ASTEROID_RADIUS_MAX,
  DEPLETED_ASTEROID_COLORS,
  ASTEROID_COLLISION_FRACTURE_COOLDOWN_MS,
  ASTEROID_FRACTURE_IMPACT_SPEED_MIN,
  ASTEROID_SPAWN_SETTLE_MS,
  ASTEROID_SPAWN_MIN_GAP,
  HUGE_ASTEROID_FRACTURE_IMPACT_MIN,
  ASTEROID_FIELD_MAX_COUNT
} from '../constants/asteroids.js'
import {
  drawAsteroid,
  getAsteroidColorsForResource,
  getRandomAsteroidResourceType,
  getAsteroidMineralCapacity,
  getAsteroidHullRadius,
  getAsteroidInteractionRadius,
  getAsteroidMaxHullRadius
} from '../render/asteroid.js'

export const asteroidFieldMethods = {
  initMiningField () {
    const balance = this.getDirectorWaveBalance()
    const fieldParams = getMiningFieldParams(this.level)
    this.miningFieldParams = fieldParams
    this.currentBadChance = balance.badChance

    for (let i = 0; i < fieldParams.asteroidCount; i++) {
      const radius = getFieldAsteroidSpawnRadius(fieldParams.minRadius, fieldParams.maxRadius)
      const pos = this.pickAsteroidSpawnPosition(radius + 8, fieldParams, radius)
      const isHazard = Math.random() < balance.badChance
      this.spawnAsteroid(pos.x, pos.y, radius, {
        isHazard,
        resourceType: isHazard ? null : getRandomAsteroidResourceType(),
        spinDurationMin: fieldParams.spinDurationMin,
        spinDurationMax: fieldParams.spinDurationMax
      })
    }
  },

  isAsteroidSpawnPositionClear (x, y, radius) {
    const hullRadius = getAsteroidMaxHullRadius(radius)

    for (const asteroid of this.asteroids) {
      if (!asteroid?.active) {
        continue
      }

      const minDist = hullRadius + getAsteroidInteractionRadius(asteroid) + ASTEROID_SPAWN_MIN_GAP
      const dx = x - asteroid.x
      const dy = y - asteroid.y

      if ((dx * dx) + (dy * dy) < minDist * minDist) {
        return false
      }
    }

    return true
  },

  pickAsteroidSpawnPosition (padding, fieldParams = null, spawnRadius = padding) {
    const params = fieldParams ?? getMiningFieldParams(this.level ?? 1)
    const avoidX = this.dockingPortX ?? this.worldCenterX
    const avoidY = this.dockingPortY ?? this.worldCenterY
    const safeRadius = Math.max(ASTEROID_SAFE_RADIUS, MOTHERSHIP_SAFE_RADIUS)
    const halfDiag = Math.hypot(this.worldWidth, this.worldHeight) / 2
    const maxDist = halfDiag * params.maxSpawnDistFraction
    const minDist = Math.max(params.minSpawnDistFromOrigin, safeRadius + padding)

    for (let attempt = 0; attempt < 50; attempt++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)
      const distSpan = Math.max(40, maxDist - minDist)
      const dist = minDist + (Math.random() * distSpan * params.clusterTightness)
      let x = avoidX + (Math.cos(angle) * dist)
      let y = avoidY + (Math.sin(angle) * dist)
      x = Phaser.Math.Clamp(x, padding, this.worldWidth - padding)
      y = Phaser.Math.Clamp(y, padding, this.worldHeight - padding)

      const dx = x - avoidX
      const dy = y - avoidY
      if ((dx * dx) + (dy * dy) >= safeRadius * safeRadius &&
          this.isAsteroidSpawnPositionClear(x, y, spawnRadius)) {
        return { x, y }
      }
    }

    return {
      x: Phaser.Math.Between(padding, this.worldWidth - padding),
      y: Phaser.Math.Between(padding, this.worldHeight - padding)
    }
  },

  clearAsteroids () {
    for (const collider of this.asteroidColliders) {
      collider.destroy()
    }
    this.asteroidColliders = []

    for (const asteroid of this.asteroids) {
      if (asteroid?.destroy) {
        asteroid.destroy()
      }
    }
    this.asteroids = []
  },

  registerAsteroidAsteroidColliders (asteroid) {
    if (!asteroid?.body) {
      return
    }

    for (const other of this.asteroids) {
      if (other === asteroid || !other?.active || !other.body) {
        continue
      }

      const collider = this.physics.add.collider(asteroid, other, (a, b) => {
        this.onAsteroidsCollide(a, b)
      })
      this.asteroidColliders.push(collider)
    }
  },

  onAsteroidsCollide (asteroidA, asteroidB) {
    if (!asteroidA?.active || !asteroidB?.active) {
      return
    }

    const dvx = (asteroidA.body?.velocity?.x ?? 0) - (asteroidB.body?.velocity?.x ?? 0)
    const dvy = (asteroidA.body?.velocity?.y ?? 0) - (asteroidB.body?.velocity?.y ?? 0)
    const impactSpeed = Math.hypot(dvx, dvy)

    if (impactSpeed < ASTEROID_FRACTURE_IMPACT_SPEED_MIN) {
      return
    }

    if (shouldSmallAsteroidDeflectOffLarge(asteroidA, asteroidB)) {
      this.repelAsteroidFromCollision(asteroidA, asteroidB)
      return
    }

    if (shouldSmallAsteroidDeflectOffLarge(asteroidB, asteroidA)) {
      this.repelAsteroidFromCollision(asteroidB, asteroidA)
      return
    }

    const fractureTarget = asteroidA.radius <= asteroidB.radius ? asteroidA : asteroidB
    const other = fractureTarget === asteroidA ? asteroidB : asteroidA
    this.tryFractureAsteroidFromCollision(fractureTarget, other, impactSpeed)
  },

  tryFractureAsteroidFromCollision (asteroid, other, impactSpeed = null) {
    if (!asteroid?.active || !other?.active) {
      return
    }

    if ((asteroid.collisionFractureCooldownMs ?? 0) > 0 ||
        (asteroid.spawnSettleMs ?? 0) > 0 ||
        asteroid.isFragment) {
      return
    }

    if (!canAsteroidFracture(asteroid, this.asteroids?.length ?? 0, ASTEROID_FIELD_MAX_COUNT)) {
      return
    }

    if (shouldSmallAsteroidDeflectOffLarge(other, asteroid)) {
      return
    }

    const resolvedImpactSpeed = impactSpeed ?? Math.hypot(
      (asteroid.body?.velocity?.x ?? 0) - (other.body?.velocity?.x ?? 0),
      (asteroid.body?.velocity?.y ?? 0) - (other.body?.velocity?.y ?? 0)
    )

    if (asteroid.radius > LARGE_RADIUS + 8 && resolvedImpactSpeed < HUGE_ASTEROID_FRACTURE_IMPACT_MIN) {
      return
    }

    asteroid.collisionFractureCooldownMs = ASTEROID_COLLISION_FRACTURE_COOLDOWN_MS
    const hitAngle = Math.atan2(asteroid.y - other.y, asteroid.x - other.x)
    const fractureImpactSpeed = resolvedImpactSpeed

    this.fractureAsteroid(asteroid, hitAngle, {
      speedMin: Phaser.Math.Clamp(35 + (fractureImpactSpeed * 0.2), 35, 85),
      speedMax: Phaser.Math.Clamp(70 + (fractureImpactSpeed * 0.35), 70, 150)
    })
  },

  getFractureChildSpawnPoint (centerX, centerY, parentRadius, childRadius, hitAngle, index, count) {
    const spread = hitAngle + ((index - ((count - 1) / 2)) * 0.7)
    const separation = (parentRadius * 0.48) + childRadius + 12

    return {
      x: centerX + (Math.cos(spread) * separation),
      y: centerY + (Math.sin(spread) * separation),
      angle: spread
    }
  },

  resolveFractureSpawnPoint (spawn, childRadius, options = {}) {
    if (!options.shieldCenter || options.shieldRadius == null) {
      return spawn
    }

    const clamped = clampPointOutsideCircle(
      spawn.x,
      spawn.y,
      childRadius,
      options.shieldCenter.x,
      options.shieldCenter.y,
      options.shieldRadius,
      16
    )

    return {
      ...spawn,
      x: clamped.x,
      y: clamped.y
    }
  },

  removeAsteroidFromField (asteroid) {
    const idx = this.asteroids.indexOf(asteroid)
    if (idx >= 0) {
      this.asteroids.splice(idx, 1)
    }
  },

  prepareAsteroidForFracture (asteroid) {
    if (this.grappleTarget === asteroid && (this.grappleState === 'attached' || this.grappleState === 'pulling')) {
      this.releaseGrapple()
    }

    if (asteroid.isScanned) {
      this.scannedAsteroids = this.scannedAsteroids.filter((entry) => entry !== asteroid)
    }

    if (this.placedCharges?.length) {
      for (let i = this.placedCharges.length - 1; i >= 0; i--) {
        if (this.placedCharges[i].asteroid === asteroid) {
          this.removePlacedCharge(this.placedCharges[i])
        }
      }
    }
  },

  registerGrappleOverlap (asteroid) {
    if (this.grappleHook?.active && this.grappleState === 'flying') {
      this.physics.add.overlap(this.grappleHook, asteroid, () => {
        this.onGrappleHitAsteroid(this.grappleHook, asteroid)
      })
    }
  },

  spawnAsteroid (x, y, radius, options = {}) {
    const isHazard = options.isHazard === true
    const isFragment = options.isFragment === true
    const resourceType = options.resourceType ?? null
    const resourceUnits = options.resourceUnits ?? (isFragment ? 1 : 0)
    const seedOffset = options.seedOffset ?? Math.random() * 10
    const colors = isHazard
      ? { base: 0xb63a2f, edge: 0x4b0f0f, crater: 0xe06a3d }
      : getAsteroidColorsForResource(resourceType ?? 'iron')

    const asteroid = this.add.graphics()
    asteroid.radius = radius
    asteroid.isHazard = isHazard
    asteroid.isFragment = isFragment
    asteroid.resourceType = resourceType
    asteroid.resourceUnits = resourceUnits
    asteroid.collisionDamage = isHazard
      ? Math.max(8, Math.round(radius * 0.55))
      : Math.max(4, Math.round(radius * 0.35))
    asteroid.seedOffset = seedOffset
    asteroid.hullRadius = getAsteroidHullRadius(radius, seedOffset)
    asteroid.asteroidColors = colors
    asteroid.mineralsTotal = getAsteroidMineralCapacity(radius, isHazard, isFragment)
    asteroid.mineralsRemaining = asteroid.mineralsTotal
    asteroid.isDepleted = false
    asteroid.isScanned = false
    asteroid.mineralsRevealed = false

    drawAsteroid(asteroid, 0, 0, radius, colors, seedOffset)
    this.physics.world.enable(asteroid)
    asteroid.setPosition(x, y)
    asteroid.body.setCircle(asteroid.hullRadius, -asteroid.hullRadius, -asteroid.hullRadius)
    asteroid.body.setBounce(1, 1)
    asteroid.body.setCollideWorldBounds(true)

    const speed = options.speed ?? Phaser.Math.Between(18, 52)
    const angle = options.angle ?? Phaser.Math.FloatBetween(0, Math.PI * 2)
    asteroid.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
    asteroid.spawnSettleMs = options.spawnSettleMs ?? ASTEROID_SPAWN_SETTLE_MS

    const spinDirection = Math.random() < 0.5 ? -1 : 1
    const spinDurationMin = options.spinDurationMin ?? 2600
    const spinDurationMax = options.spinDurationMax ?? 4800
    const spinDuration = Phaser.Math.Between(spinDurationMin, spinDurationMax)
    const spinTween = this.tweens.add({
      targets: asteroid,
      angle: spinDirection > 0 ? '+=360' : '-=360',
      duration: spinDuration,
      repeat: -1,
      ease: 'Linear'
    })
    asteroid.spinTween = spinTween
    asteroid.spinDirection = spinDirection
    asteroid.once('destroy', () => {
      spinTween.stop()
      if (asteroid.mineralLabel?.active) {
        asteroid.mineralLabel.destroy()
      }
      if (asteroid.tractorSlowdownLabel?.active) {
        asteroid.tractorSlowdownLabel.destroy()
      }
    })

    if (isFragment) {
      this.physics.add.overlap(this.player, asteroid, () => {
        if (asteroid?.active && !asteroid.isCollecting) {
          this.collectFragment(asteroid)
        }
      })
    } else {
      this.physics.add.collider(this.player, asteroid, () => {
        if (asteroid?.active) {
          this.onAsteroidHitPlayer(asteroid)
        }
      }, () => this.shouldPlayerPhysicsCollideWithAsteroid(asteroid))
    }

    this.registerGrappleOverlap(asteroid)
    this.registerShieldOverlap(asteroid)

    this.asteroids.push(asteroid)
    this.registerAsteroidAsteroidColliders(asteroid)
    return asteroid
  },

  fractureAsteroid (asteroid, hitAngle, options = {}) {
    if (!asteroid?.active) {
      return false
    }

    const radius = asteroid.radius
    const isHazard = asteroid.isHazard
    const childCount = getFractureChildCount(
      radius,
      isHazard,
      this.asteroids.length,
      ASTEROID_FIELD_MAX_COUNT
    )

    if (childCount <= 0) {
      return false
    }

    this.prepareAsteroidForFracture(asteroid)

    const x = asteroid.x
    const y = asteroid.y
    const resourceType = asteroid.resourceType
    const speedMin = options.speedMin ?? 40
    const speedMax = options.speedMax ?? 120
    const fractureSettleMs = 900
    const spinOpts = this.miningFieldParams
      ? {
          spinDurationMin: this.miningFieldParams.spinDurationMin,
          spinDurationMax: this.miningFieldParams.spinDurationMax
        }
      : {}

    this.removeAsteroidFromField(asteroid)
    asteroid.destroy()

    if (radius > LARGE_RADIUS + 8) {
      for (let i = 0; i < childCount; i++) {
        const childRadius = Phaser.Math.Between(LARGE_RADIUS - 8, LARGE_RADIUS + 6)
        const spawn = this.resolveFractureSpawnPoint(
          this.getFractureChildSpawnPoint(x, y, radius, childRadius, hitAngle, i, childCount),
          childRadius,
          options
        )
        this.spawnAsteroid(spawn.x, spawn.y, childRadius, {
          isHazard,
          resourceType,
          angle: spawn.angle,
          speed: Phaser.Math.Between(speedMin, speedMax),
          spawnSettleMs: fractureSettleMs,
          ...spinOpts
        })
      }
      return true
    }

    if (radius > MEDIUM_ASTEROID_RADIUS_MAX) {
      for (let i = 0; i < childCount; i++) {
        const childRadius = Phaser.Math.Between(MEDIUM_RADIUS - 2, MEDIUM_ASTEROID_RADIUS_MAX)
        const spawn = this.resolveFractureSpawnPoint(
          this.getFractureChildSpawnPoint(x, y, radius, childRadius, hitAngle, i, childCount),
          childRadius,
          options
        )
        this.spawnAsteroid(spawn.x, spawn.y, childRadius, {
          isHazard,
          resourceType,
          angle: spawn.angle,
          speed: Phaser.Math.Between(speedMin, speedMax),
          spawnSettleMs: fractureSettleMs,
          ...spinOpts
        })
      }
      return true
    }

    if (radius > SMALL_ASTEROID_RADIUS_MAX) {
      const maxChildRadius = Math.max(SMALL_ASTEROID_RADIUS_MAX + 1, radius - 4)

      for (let i = 0; i < childCount; i++) {
        if (maxChildRadius <= SMALL_ASTEROID_RADIUS_MAX) {
          const fragmentRadius = Phaser.Math.Between(FRAGMENT_RADIUS - 2, FRAGMENT_RADIUS + 3)
          const spawn = this.resolveFractureSpawnPoint(
            this.getFractureChildSpawnPoint(x, y, radius, fragmentRadius, hitAngle, i, childCount),
            fragmentRadius,
            options
          )
          this.spawnAsteroid(spawn.x, spawn.y, fragmentRadius, {
            isFragment: !isHazard,
            isHazard: false,
            resourceType: isHazard ? null : (resourceType ?? getRandomAsteroidResourceType()),
            resourceUnits: isHazard ? 0 : 1,
            angle: spawn.angle,
            speed: Phaser.Math.Between(speedMin, speedMax),
            spawnSettleMs: fractureSettleMs,
            ...spinOpts
          })
          continue
        }

        const childRadius = Phaser.Math.Between(SMALL_ASTEROID_RADIUS_MAX + 1, maxChildRadius)
        const spawn = this.resolveFractureSpawnPoint(
          this.getFractureChildSpawnPoint(x, y, radius, childRadius, hitAngle, i, childCount),
          childRadius,
          options
        )
        this.spawnAsteroid(spawn.x, spawn.y, childRadius, {
          isHazard,
          resourceType,
          angle: spawn.angle,
          speed: Phaser.Math.Between(speedMin, speedMax),
          spawnSettleMs: fractureSettleMs,
          ...spinOpts
        })
      }
      return true
    }

    if (radius > FRAGMENT_RADIUS + 3) {
      for (let i = 0; i < childCount; i++) {
        const childRadius = Phaser.Math.Between(FRAGMENT_RADIUS - 2, FRAGMENT_RADIUS + 3)
        const spawn = this.resolveFractureSpawnPoint(
          this.getFractureChildSpawnPoint(x, y, radius, childRadius, hitAngle, i, childCount),
          childRadius,
          options
        )
        this.spawnAsteroid(spawn.x, spawn.y, childRadius, {
          isFragment: !isHazard,
          isHazard: false,
          resourceType: isHazard ? null : (resourceType ?? getRandomAsteroidResourceType()),
          resourceUnits: isHazard ? 0 : 1,
          angle: spawn.angle,
          speed: Phaser.Math.Between(speedMin, speedMax),
          spawnSettleMs: fractureSettleMs,
          ...spinOpts
        })
      }
      return true
    }

    const spawn = this.resolveFractureSpawnPoint(
      { x, y, angle: hitAngle },
      FRAGMENT_RADIUS,
      options
    )
    this.spawnAsteroid(spawn.x, spawn.y, FRAGMENT_RADIUS, {
      isFragment: true,
      resourceType: resourceType ?? getRandomAsteroidResourceType(),
      resourceUnits: 1,
      angle: spawn.angle,
      speed: Phaser.Math.Between(Math.min(speedMin, 60), Math.min(speedMax, 100)),
      spawnSettleMs: fractureSettleMs
    })
    return true
  },

  refreshAsteroidVisual (asteroid) {
    if (!asteroid?.active) {
      return
    }

    const colors = asteroid.isDepleted ? DEPLETED_ASTEROID_COLORS : asteroid.asteroidColors
    drawAsteroid(asteroid, 0, 0, asteroid.radius, colors, asteroid.seedOffset ?? 0)
  },

  ensureAsteroidMineralLabel (asteroid) {
    if (asteroid.mineralsTotal <= 0 || asteroid.mineralLabel?.active) {
      return
    }

    asteroid.mineralLabel = this.add.text(asteroid.x, asteroid.y - getAsteroidInteractionRadius(asteroid) - 16, '', {
      fontFamily: 'sans-serif',
      fontSize: 13,
      color: '#dee3e7',
      stroke: '#0f1720',
      strokeThickness: 3
    })
    asteroid.mineralLabel.setOrigin(0.5, 1)
    asteroid.mineralLabel.setDepth(12)
    asteroid.mineralLabel.setVisible(false)
  },

  revealAsteroidMinerals (asteroid) {
    if (!asteroid || asteroid.mineralsTotal <= 0) {
      return
    }

    asteroid.mineralsRevealed = true
    this.ensureAsteroidMineralLabel(asteroid)
    this.updateAsteroidMineralLabel(asteroid)
  },

  shouldShowAsteroidMineralLabel (asteroid) {
    return asteroid.mineralsTotal > 0 &&
      !asteroid.isDepleted &&
      asteroid.mineralsRemaining > 0 &&
      asteroid.mineralsRevealed
  },

  shouldShowScannedAsteroidNav (asteroid) {
    if (!asteroid?.active || !asteroid.isScanned) {
      return false
    }

    if (asteroid.mineralsTotal > 0 && (asteroid.isDepleted || asteroid.mineralsRemaining <= 0)) {
      return false
    }

    return true
  },

  removeScannedAsteroidMarker (asteroid) {
    if (!asteroid) {
      return
    }

    asteroid.isScanned = false
    this.scannedAsteroids = (this.scannedAsteroids ?? []).filter((entry) => entry !== asteroid)
  },

  updateAsteroidMineralLabel (asteroid) {
    if (!this.shouldShowAsteroidMineralLabel(asteroid)) {
      if (asteroid?.mineralLabel?.active) {
        asteroid.mineralLabel.setVisible(false)
      }
      return
    }

    this.ensureAsteroidMineralLabel(asteroid)
    asteroid.mineralLabel.setPosition(asteroid.x, asteroid.y - getAsteroidInteractionRadius(asteroid) - 12)
    asteroid.mineralLabel.setText(String(Math.max(0, Math.ceil(asteroid.mineralsRemaining))))
    asteroid.mineralLabel.setVisible(true)
  },

  updateAsteroidMineralLabels () {
    for (const asteroid of this.asteroids) {
      if (asteroid?.mineralsTotal > 0) {
        this.updateAsteroidMineralLabel(asteroid)
      }
    }
  }
}
