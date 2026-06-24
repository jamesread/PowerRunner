import {
  getGrappleMaxRange,
  getGrapplePullSpeed,
  getGrappleHookSpeed,
  getGrappleCooldownMs
} from '../utils/upgrades.js'
import { isCollectOnlyAsteroid } from '../utils/asteroids.js'
import { getAsteroidInteractionRadius } from '../render/asteroid.js'
import { GRAPPLE_ATTACH_DISTANCE, GRAPPLE_DETACH_GRACE_MS } from '../constants/player.js'
import { rotateAsteroidLocalPoint, worldPointToAsteroidLocal } from '../utils/geometry.js'
import {
  applyGrappleDockAssist,
  getBodySpeed,
  shouldSkipGrappleDetachAsteroidPhysics,
  shouldSkipGrappleRideAsteroidPhysics
} from '../utils/grappleDock.js'

export const grappleMethods = {
  getGrappleUpgradeLevel () {
    return window.gameState.grappleLevel ?? 0
  },

  onGrappleHitAsteroid (hook, asteroid) {
    if (!hook?.active || !asteroid?.active || isCollectOnlyAsteroid(asteroid) || this.grappleState !== 'flying') {
      return
    }

    const hitLocal = worldPointToAsteroidLocal(asteroid, hook.x, hook.y)
    const hitDist = Math.hypot(hitLocal.x, hitLocal.y) || 1
    const surfaceDist = getAsteroidInteractionRadius(asteroid) + (this.playerShipMetrics.bodyRadius * 0.85)
    this.grappleAttachLocal = {
      x: (hitLocal.x / hitDist) * surfaceDist,
      y: (hitLocal.y / hitDist) * surfaceDist
    }
    this.grappleTarget = asteroid
    hook.destroy()
    this.grappleHook = null
    this.grappleState = 'pulling'
  },

  releaseGrapple (options = {}) {
    const wasAttached = this.grappleState === 'attached'
    const detachAsteroid = wasAttached ? this.grappleTarget : null
    this.stopDrilling()

    if (this.grappleHook?.active) {
      this.grappleHook.destroy()
    }

    this.grappleHook = null
    this.grappleTarget = null
    this.grappleAttachLocal = null
    this.grappleState = 'idle'

    if (this.grappleLine) {
      this.grappleLine.clear()
    }

    if (wasAttached && detachAsteroid?.active) {
      this.beginGrappleDetachGrace(detachAsteroid)
      this.separatePlayerFromDetachedAsteroid(detachAsteroid)
    }

    if (wasAttached && options.reverseBoost) {
      this.pendingAttachReverseBoost = true
    }

    if (this.player?.body && this.grappleRideBounceX !== undefined) {
      this.player.body.setBounce(this.grappleRideBounceX, this.grappleRideBounceY)
      this.grappleRideBounceX = undefined
      this.grappleRideBounceY = undefined
    }
  },

  beginGrappleDetachGrace (asteroid) {
    this.grappleDetachAsteroid = asteroid
    this.grappleDetachGraceMs = GRAPPLE_DETACH_GRACE_MS
    this.asteroidHitCooldownMs = Math.max(this.asteroidHitCooldownMs ?? 0, GRAPPLE_DETACH_GRACE_MS)
  },

  separatePlayerFromDetachedAsteroid (asteroid) {
    if (!this.player?.active || !asteroid?.active) {
      return
    }

    const hullRadius = getAsteroidInteractionRadius(asteroid)
    const playerRadius = this.playerShipMetrics.bodyRadius
    const minDist = hullRadius + playerRadius + 8
    const dx = this.player.x - asteroid.x
    const dy = this.player.y - asteroid.y
    let dist = Math.hypot(dx, dy)
    let nx
    let ny

    if (dist <= 0.001) {
      nx = -Math.cos(this.shipHeading)
      ny = -Math.sin(this.shipHeading)
      dist = 0
    } else {
      nx = dx / dist
      ny = dy / dist
    }

    if (dist >= minDist) {
      return
    }

    const x = asteroid.x + (nx * minDist)
    const y = asteroid.y + (ny * minDist)
    this.player.setPosition(x, y)
    this.player.body?.updateFromGameObject()
  },

  attachToAsteroid () {
    if (!this.grappleTarget?.active || !this.grappleAttachLocal) {
      this.releaseGrapple()
      return
    }

    this.grappleState = 'attached'
    if (this.player?.body) {
      this.grappleRideBounceX = this.player.body.bounce.x
      this.grappleRideBounceY = this.player.body.bounce.y
      this.player.body.setBounce(0, 0)
    }
    this.syncPlayerToGrappleTarget()
    this.revealAsteroidMinerals(this.grappleTarget)
    this.startDrilling()
  },

  syncPlayerToGrappleTarget () {
    const asteroid = this.grappleTarget
    if (!asteroid?.active || !this.grappleAttachLocal) {
      this.releaseGrapple()
      return
    }

    const pos = rotateAsteroidLocalPoint(asteroid, this.grappleAttachLocal.x, this.grappleAttachLocal.y)
    this.player.setPosition(pos.x, pos.y)
    this.shipHeading = Math.atan2(asteroid.y - pos.y, asteroid.x - pos.x)
    this.player.setRotation(this.shipHeading + (Math.PI / 2))

    if (this.player.body) {
      this.player.body.velocity.x = asteroid.body.velocity.x
      this.player.body.velocity.y = asteroid.body.velocity.y
    }
  },

  shouldPlayerPhysicsCollideWithAsteroid (asteroid) {
    if (!asteroid?.active) {
      return true
    }

    if (shouldSkipGrappleDetachAsteroidPhysics(
      this.grappleDetachGraceMs ?? 0,
      this.grappleDetachAsteroid,
      asteroid
    )) {
      return false
    }

    const rideSpeed = this.grappleTarget?.active
      ? getBodySpeed(this.grappleTarget.body)
      : 0

    return !shouldSkipGrappleRideAsteroidPhysics(
      this.grappleState,
      this.grappleTarget,
      asteroid,
      rideSpeed
    )
  },

  updateGrappleDockAssist (delta) {
    if (this.grappleState !== 'attached' || !this.grappleTarget?.active) {
      return
    }

    const rideSpeed = getBodySpeed(this.grappleTarget.body)
    applyGrappleDockAssist(
      this.grappleTarget,
      this.dockingPortX,
      this.dockingPortY,
      rideSpeed,
      delta
    )
  },

  getGrappleAnchorPoint () {
    if (this.grappleHook?.active) {
      return { x: this.grappleHook.x, y: this.grappleHook.y }
    }

    if (this.grappleTarget?.active && this.grappleAttachLocal) {
      return rotateAsteroidLocalPoint(this.grappleTarget, this.grappleAttachLocal.x, this.grappleAttachLocal.y)
    }

    return null
  },

  renderGrappleLine () {
    if (!this.grappleLine || !this.player || this.grappleState === 'idle') {
      if (this.grappleLine) {
        this.grappleLine.clear()
      }
      return
    }

    const anchor = this.getGrappleAnchorPoint()
    if (!anchor) {
      this.grappleLine.clear()
      return
    }

    const noseOffset = this.playerShipMetrics.noseOffset
    const startX = this.player.x + (Math.cos(this.shipHeading) * noseOffset)
    const startY = this.player.y + (Math.sin(this.shipHeading) * noseOffset)

    this.grappleLine.clear()
    this.grappleLine.lineStyle(2, 0x9fb0bf, 0.95)
    this.grappleLine.beginPath()
    this.grappleLine.moveTo(startX, startY)
    this.grappleLine.lineTo(anchor.x, anchor.y)
    this.grappleLine.strokePath()

    this.grappleLine.fillStyle(0xd35d5d, 1)
    this.grappleLine.fillCircle(anchor.x, anchor.y, 4)
    this.grappleLine.lineStyle(1, 0x0f1720, 1)
    this.grappleLine.strokeCircle(anchor.x, anchor.y, 4)
  },

  updateGrapple (delta) {
    const dt = delta / 1000
    const grappleLevel = this.getGrappleUpgradeLevel()
    const maxRange = getGrappleMaxRange(grappleLevel)
    const pullSpeed = getGrapplePullSpeed(grappleLevel)

    if (this.grappleState === 'flying' && this.grappleHook?.active) {
      const dx = this.grappleHook.x - this.player.x
      const dy = this.grappleHook.y - this.player.y
      if (Math.hypot(dx, dy) > maxRange) {
        this.releaseGrapple()
      }
    }

    if (this.grappleState === 'pulling') {
      if (!this.grappleTarget?.active || !this.grappleAttachLocal) {
        this.releaseGrapple()
      } else {
        const target = rotateAsteroidLocalPoint(this.grappleTarget, this.grappleAttachLocal.x, this.grappleAttachLocal.y)
        const dx = target.x - this.player.x
        const dy = target.y - this.player.y
        const dist = Math.hypot(dx, dy)

        if (dist <= GRAPPLE_ATTACH_DISTANCE) {
          this.attachToAsteroid()
        } else {
          const move = Math.min(pullSpeed * dt, dist)
          this.player.setPosition(this.player.x + ((dx / dist) * move), this.player.y + ((dy / dist) * move))

          if (this.player.body) {
            this.player.body.velocity.x = this.grappleTarget.body.velocity.x
            this.player.body.velocity.y = this.grappleTarget.body.velocity.y
          }
        }
      }
    } else if (this.grappleState === 'attached') {
      this.updateGrappleDockAssist(delta)
      this.syncPlayerToGrappleTarget()
    }

    this.renderGrappleLine()
  },

  fireGrappleHook () {
    if (this.grappleState === 'attached') {
      this.releaseGrapple()
      return
    }

    if (this.grappleState === 'flying' || this.grappleState === 'pulling') {
      return
    }

    const grappleLevel = this.getGrappleUpgradeLevel()
    const hookSpeed = getGrappleHookSpeed(grappleLevel)
    const cooldownMs = getGrappleCooldownMs(grappleLevel)
    const now = this.game.loop.time

    if (now - this.lastGrappleMs < cooldownMs) {
      return
    }
    this.lastGrappleMs = now

    const noseOffset = this.playerShipMetrics.noseOffset
    const hx = this.player.x + (Math.cos(this.shipHeading) * noseOffset)
    const hy = this.player.y + (Math.sin(this.shipHeading) * noseOffset)

    const hook = this.add.circle(hx, hy, 4, 0xd35d5d, 1)
    hook.setStrokeStyle(1, 0x0f1720, 1)
    this.physics.world.enable(hook)
    hook.body.setCircle(4)
    hook.body.setAllowGravity(false)
    hook.body.setVelocity(
      Math.cos(this.shipHeading) * hookSpeed,
      Math.sin(this.shipHeading) * hookSpeed
    )

    this.grappleHook = hook
    this.grappleState = 'flying'

    for (const asteroid of this.asteroids) {
      if (asteroid?.active && !isCollectOnlyAsteroid(asteroid)) {
        this.physics.add.overlap(hook, asteroid, () => {
          this.onGrappleHitAsteroid(hook, asteroid)
        })
      }
    }

    hook.once('destroy', () => {
      if (this.grappleHook === hook) {
        this.grappleHook = null
        if (this.grappleState === 'flying') {
          this.grappleState = 'idle'
        }
      }
    })
  }
}
