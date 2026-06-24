import { Phaser } from '../phaser.js'
import { buildLevelMothershipLayout, drawMothershipHull } from '../render/mothership.js'
import { WORLD_SCALE } from '../constants/player.js'
import {
  MOTHERSHIP_SHIELD_RADIUS,
  SHIELD_HIT_COOLDOWN_MS,
  SHIELD_REPEL_SPEED_MIN,
  SHIELD_REPEL_SPEED_MAX,
  DOCK_AUTO_DISTANCE_PX
} from '../constants/asteroids.js'
import {
  applyGrappleDockAssist,
  getBodySpeed,
  getGrappleShieldRepelScale,
  shouldGrappleSoftDockShieldHit
} from '../utils/grappleDock.js'
import { shouldShieldDeflectOnly } from '../utils/asteroids.js'

export const worldMethods = {
  setupWorld () {
    const viewW = this.scale.width || this.sys.game.canvas.width
    const viewH = this.scale.height || this.sys.game.canvas.height
    this.worldWidth = Math.round(viewW * WORLD_SCALE)
    this.worldHeight = Math.round(viewH * WORLD_SCALE)
    this.worldCenterX = this.worldWidth / 2
    this.worldCenterY = this.worldHeight / 2

    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight)
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight)
    this.mothershipCenterX = this.worldCenterX
    this.mothershipCenterY = this.worldCenterY
    this.mothershipLayout = buildLevelMothershipLayout(this.mothershipCenterX, this.mothershipCenterY)
    this.dockingPortX = this.mothershipLayout.dockPortX
    this.dockingPortY = this.mothershipLayout.dockPortY
  },

  createFieldMothership () {
    this.fieldMothership = this.add.graphics()
    this.fieldMothership.setDepth(-2)
    drawMothershipHull(this.fieldMothership, this.mothershipLayout)

    this.mothershipShieldRadius = MOTHERSHIP_SHIELD_RADIUS
    this.shieldPulseTimer = 0
    this.shieldGraphic = this.add.circle(
      this.mothershipCenterX,
      this.mothershipCenterY,
      this.mothershipShieldRadius,
      0x8fcbe8,
      0.05
    )
    this.shieldGraphic.setStrokeStyle(2, 0x8fcbe8, 0.32)
    this.shieldGraphic.setDepth(-1)

    this.mothershipShieldBody = this.add.circle(
      this.mothershipCenterX,
      this.mothershipCenterY,
      this.mothershipShieldRadius,
      0x000000,
      0
    )
    this.mothershipShieldBody.setVisible(false)
    this.physics.world.enable(this.mothershipShieldBody)
    this.mothershipShieldBody.body.setCircle(this.mothershipShieldRadius)
    this.mothershipShieldBody.body.setImmovable(true)
    this.mothershipShieldBody.body.setAllowGravity(false)

    this.dockZone = this.add.circle(this.dockingPortX, this.dockingPortY, DOCK_AUTO_DISTANCE_PX, 0x8fcbe8, 0.12)
    this.dockZone.setStrokeStyle(1, 0x8fcbe8, 0.35)
    this.dockZone.setDepth(-1)
  },

  registerShieldOverlap (asteroid) {
    if (!this.mothershipShieldBody?.body || !asteroid?.body) {
      return
    }

    this.physics.add.overlap(this.mothershipShieldBody, asteroid, () => {
      this.onAsteroidHitShield(asteroid)
    })
  },

  updateMothershipShield (delta) {
    if (!this.shieldGraphic) {
      return
    }

    this.shieldPulseTimer += delta
    const pulse = 0.24 + (((Math.sin(this.shieldPulseTimer * 0.0035) + 1) / 2) * 0.22)
    this.shieldGraphic.setStrokeStyle(2, 0x8fcbe8, pulse)
  },

  repelAsteroidFromShield (asteroid, angle, speedScale = 1) {
    if (!asteroid?.active || !asteroid.body) {
      return
    }

    const scale = Phaser.Math.Clamp(speedScale, 0.08, 1)
    const speedMin = Math.max(18, Math.round(SHIELD_REPEL_SPEED_MIN * scale))
    const speedMax = Math.max(speedMin + 8, Math.round(SHIELD_REPEL_SPEED_MAX * scale))
    const speed = Phaser.Math.Between(speedMin, speedMax)
    asteroid.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
    asteroid.shieldHitCooldownMs = SHIELD_HIT_COOLDOWN_MS
  },

  repelAsteroidFromCollision (asteroid, fromAsteroid) {
    if (!asteroid?.active || !fromAsteroid?.active || (asteroid.shieldHitCooldownMs ?? 0) > 0) {
      return
    }

    const dx = asteroid.x - fromAsteroid.x
    const dy = asteroid.y - fromAsteroid.y
    const dist = Math.hypot(dx, dy)
    if (dist <= 0) {
      return
    }

    this.repelAsteroidFromShield(asteroid, Math.atan2(dy, dx))
  },

  onAsteroidHitShield (asteroid) {
    if (!asteroid?.active || (asteroid.shieldHitCooldownMs ?? 0) > 0) {
      return
    }

    const dx = asteroid.x - this.mothershipCenterX
    const dy = asteroid.y - this.mothershipCenterY
    const dist = Math.hypot(dx, dy)
    if (dist <= 0) {
      return
    }

    const repelAngle = Math.atan2(dy, dx)
    const rideSpeed = getBodySpeed(asteroid.body)
    const dockDistance = Math.hypot(
      this.dockingPortX - asteroid.x,
      this.dockingPortY - asteroid.y
    )
    const isGrappleRide = this.grappleTarget === asteroid &&
      (this.grappleState === 'attached' || this.grappleState === 'pulling')
    const repelScale = isGrappleRide
      ? getGrappleShieldRepelScale(rideSpeed, dockDistance)
      : 1

    if (shouldGrappleSoftDockShieldHit(
      this.grappleState,
      this.grappleTarget,
      asteroid,
      rideSpeed,
      dockDistance
    )) {
      asteroid.shieldHitCooldownMs = 180
      applyGrappleDockAssist(asteroid, this.dockingPortX, this.dockingPortY, rideSpeed, 16)
      return
    }

    if (isGrappleRide) {
      this.releaseGrapple()
    }

    if ((asteroid.spawnSettleMs ?? 0) > 0) {
      this.repelAsteroidFromShield(asteroid, repelAngle, repelScale)
      return
    }

    if (shouldShieldDeflectOnly(asteroid)) {
      this.repelAsteroidFromShield(asteroid, repelAngle, repelScale)
      return
    }

    asteroid.shieldHitCooldownMs = SHIELD_HIT_COOLDOWN_MS

    const fractured = this.fractureAsteroid(asteroid, repelAngle, {
      speedMin: Math.round(SHIELD_REPEL_SPEED_MIN * repelScale),
      speedMax: Math.round(SHIELD_REPEL_SPEED_MAX * repelScale),
      shieldCenter: { x: this.mothershipCenterX, y: this.mothershipCenterY },
      shieldRadius: MOTHERSHIP_SHIELD_RADIUS
    })

    if (!fractured) {
      this.repelAsteroidFromShield(asteroid, repelAngle, repelScale)
    }
  }
}
