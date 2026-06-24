import { Phaser } from '../phaser.js'
import { addToCargo, resetCargo } from '../state/economy.js'
import {
  PLAYER_MAX_SPEED,
  PLAYER_ROT_SPEED,
  ATTACH_RELEASE_REVERSE_BOOST,
  EMERGENCY_THRUST_MULT,
  BATTERY_DRAIN_EMERGENCY_THRUST_PER_SEC
} from '../constants/player.js'
import { consumeShipFuel, consumeBattery } from '../state/ship.js'
import { GAMEPAD_DEAD_ZONE } from '../constants/theme.js'
import { drawPlayerShipIcon, getPlayerShipMetrics } from '../render/player.js'
import {
  getBodySpeed,
  getGrappleRideCollisionDamageScale
} from '../utils/grappleDock.js'

export const playerMethods = {
  onAsteroidHitPlayer (asteroid) {
    if (!asteroid?.active || this.asteroidHitCooldownMs > 0) {
      return
    }

    if (this.grappleDetachGraceMs > 0 && asteroid === this.grappleDetachAsteroid) {
      return
    }

    if (this.grappleState === 'attached' && this.grappleTarget === asteroid) {
      return
    }

    this.asteroidHitCooldownMs = 450
    this.triggerShipDamageFeedback()

    let impactDamage = asteroid.collisionDamage ?? 10
    if (this.grappleState === 'attached' && this.grappleTarget?.active) {
      const rideSpeed = getBodySpeed(this.grappleTarget.body)
      impactDamage = Math.max(1, Math.round(impactDamage * getGrappleRideCollisionDamageScale(rideSpeed)))
    }

    this.changeHealth(-impactDamage)
    if (this.isShipDestroying) {
      return
    }
    this.nudgeDirectorPressure(-Math.min(0.16, 0.04 + (impactDamage / 100)))

    const dx = this.player.x - asteroid.x
    const dy = this.player.y - asteroid.y
    const dist = Math.max(1, Math.hypot(dx, dy))
    let knockback = 80
    if (this.grappleState === 'attached' && this.grappleTarget?.active) {
      const rideSpeed = getBodySpeed(this.grappleTarget.body)
      knockback *= getGrappleRideCollisionDamageScale(rideSpeed)
    }
    this.player.body.velocity.x += (dx / dist) * knockback
    this.player.body.velocity.y += (dy / dist) * knockback
  },

  triggerShipDamageFeedback () {
    this.damagePulseMs = 260
    this.cameras.main.shake(120, 0.004)
  },

  createPlayer () {
    this.playerShipMetrics = getPlayerShipMetrics(0.45)
    const half = this.playerShipMetrics.half

    this.playerGraphics = this.add.graphics()
    this.playerGraphics.setPosition(-half, -half)
    this.renderPlayerShip(0.45)

    this.player = this.add.container(this.dockingPortX, this.dockingPortY, [
      this.playerGraphics
    ])
    this.player.setSize(this.playerShipMetrics.size, this.playerShipMetrics.size)

    this.shipHeading = -Math.PI / 2
    this.collectorPincerTimer = 0
    this.collectorGrabPulseMs = 0
    this.damagePulseMs = 0
    this.isThrusting = false
    this.isReverseThrusting = false
    this.pendingAttachReverseBoost = false
    this.attachReleaseBoostPulseMs = 0
    this.fuelLostGraceMs = 0
    this.fuelRescueApproachFactor = 0
    this.fuelRescueDistressTowActive = false
    this.isEmergencyThrusting = false
    this.lastPincerOpen = null
    this.playerThrusters = this.add.graphics()
    this.playerThrusters.setDepth(-1)
    this.playerDamageFx = this.add.graphics()
    this.playerDamageFx.setDepth(3)
    this.grappleLine = this.add.graphics()
    this.grappleLine.setDepth(4)
    this.grappleState = 'idle'
    this.grappleTarget = null
    this.grappleHook = null
    this.grappleAttachLocal = null
    this.grappleDetachAsteroid = null
    this.grappleDetachGraceMs = 0
    this.isDrilling = false
    this.drillProgressMs = 0
    this.drillPulseTimer = 0
    this.drillArm = this.add.graphics()
    this.drillArm.setDepth(5)
    this.tractorBeamFx = this.add.graphics()
    this.tractorBeamFx.setDepth(3)
    this.isTractorBeamActive = false
    this.tractoredAsteroids = []
    this.tractorBeamPulseTimer = 0

    this.physics.world.enable(this.player)

    this.player.body.setAllowGravity(false)
    this.player.body.setCircle(
      this.playerShipMetrics.bodyRadius,
      this.playerShipMetrics.bodyOffset,
      this.playerShipMetrics.bodyOffset
    )
    this.player.body.setCollideWorldBounds(true)
    this.player.body.onWorldBounds = true
    this.player.body.setBounce(0.35, 0.35)
    this.player.body.setDrag(0, 0)
    this.player.body.setMaxVelocity(PLAYER_MAX_SPEED, PLAYER_MAX_SPEED)
    this.player.setRotation(this.shipHeading + (Math.PI / 2))

    this.cameras.main.startFollow(this.player, true, 1, 1)
    this.cameras.main.setRoundPixels(true)
    this.initNanobots()
  },

  renderPlayerThrusters (isThrusting, isReverseThrusting) {
    if (!this.playerThrusters) {
      return
    }

    this.playerThrusters.clear()
    this.playerThrusters.setPosition(this.player.x, this.player.y)
    this.playerThrusters.setRotation(this.player.rotation)

    const scale = this.playerShipMetrics.scale
    const outerLength = 16 + Phaser.Math.Between(0, 6)
    const innerLength = outerLength - 6

    if (isThrusting) {
      const nozzleY = 27 * scale
      this.playerThrusters.fillStyle(0xf36b2b, 0.92)
      this.playerThrusters.fillTriangle(-7, nozzleY, 7, nozzleY, 0, nozzleY + outerLength)
      this.playerThrusters.fillStyle(0xffd36d, 0.92)
      this.playerThrusters.fillTriangle(-4, nozzleY + 1, 4, nozzleY + 1, 0, nozzleY + innerLength)
    }

    if (isReverseThrusting) {
      const nozzleY = -27 * scale
      const reverseOuter = outerLength + (this.attachReleaseBoostPulseMs > 0 ? 8 : 0)
      const reverseInner = reverseOuter - 6
      this.playerThrusters.fillStyle(0x8fcbe8, 0.92)
      this.playerThrusters.fillTriangle(-6, nozzleY, 6, nozzleY, 0, nozzleY - reverseOuter)
      this.playerThrusters.fillStyle(0xd6ecff, 0.92)
      this.playerThrusters.fillTriangle(-3, nozzleY - 1, 3, nozzleY - 1, 0, nozzleY - reverseInner)
    }
  },

  renderPlayerShip (pincerOpen) {
    if (!this.playerGraphics) {
      return
    }

    if (this.lastPincerOpen !== null && Math.abs(this.lastPincerOpen - pincerOpen) < 0.02) {
      return
    }

    this.lastPincerOpen = pincerOpen
    this.playerGraphics.clear()
    drawPlayerShipIcon(this.playerGraphics, { scale: 0.45, pincerOpen, centered: true })
  },

  collectFragment (fragment) {
    if (!fragment?.active || !fragment.isFragment || fragment.isCollecting) {
      return
    }

    const resourceType = fragment.resourceType ?? 'iron'
    const units = fragment.resourceUnits ?? 1
    if (!this.addCollectedCargo(resourceType, units)) {
      return
    }

    fragment.isCollecting = true
    fragment.body.checkCollision.none = true
    fragment.body.enable = false
    this.collectorGrabPulseMs = 220
    this.lastPincerOpen = null

    this.tweens.add({
      targets: fragment,
      x: this.player.x,
      y: this.player.y,
      scaleX: 0.2,
      scaleY: 0.2,
      alpha: 0.2,
      duration: 160,
      ease: 'Cubic.In',
      onComplete: () => {
        fragment.destroy()
      }
    })
  },

  renderPlayerDamageOverlay (delta) {
    if (!this.playerDamageFx) {
      return
    }

    this.playerDamageFx.clear()
    if (this.damagePulseMs <= 0) {
      return
    }

    this.damagePulseMs = Math.max(0, this.damagePulseMs - delta)
    const pulse = (Math.sin(this.collectorPincerTimer * 0.045) + 1) / 2
    const alpha = 0.22 + (pulse * 0.26)

    this.playerDamageFx.setPosition(this.player.x, this.player.y)
    this.playerDamageFx.setRotation(this.player.rotation)
    const c = (value) => (value - 35) * this.playerShipMetrics.scale
    this.playerDamageFx.fillStyle(0xde2f2f, alpha)
    this.playerDamageFx.fillTriangle(c(35), c(0), c(69), c(60), c(1), c(60))
    this.playerDamageFx.fillTriangle(c(29), c(60), c(41), c(60), c(35), c(70))

    this.playerDamageFx.lineStyle(2, 0xffd36d, alpha * 0.9)
    this.playerDamageFx.strokeLineShape(new Phaser.Geom.Line(c(26), c(28), c(42), c(20)))
    this.playerDamageFx.strokeLineShape(new Phaser.Geom.Line(c(44), c(34), c(30), c(46)))
  },

  updatePlayerMovement (delta, pad) {
    const dt = delta / 1000
    let rotateDir = 0
    let thrusting = this.cursors.up.isDown || this.wasd.up.isDown
    let reverseThrusting = this.cursors.down.isDown || this.wasd.down.isDown

    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      rotateDir -= 1
    }
    if (this.cursors.right.isDown || this.wasd.right.isDown) {
      rotateDir += 1
    }

    if (pad) {
      const stickX = Math.abs(pad.leftStick.x) >= GAMEPAD_DEAD_ZONE ? pad.leftStick.x : 0
      if (stickX !== 0) {
        rotateDir = Phaser.Math.Clamp(stickX, -1, 1)
      } else if (pad.left) {
        rotateDir = -1
      } else if (pad.right) {
        rotateDir = 1
      }

      if (pad.up) {
        thrusting = true
      }
      if (pad.down) {
        reverseThrusting = true
      }
      if (pad.R2 > 0.35) {
        thrusting = true
      }
      if (pad.L2 > 0.35) {
        reverseThrusting = true
      }
    }

    if (thrusting && reverseThrusting) {
      reverseThrusting = false
    }

    if (this.grappleState === 'attached') {
      if (reverseThrusting) {
        this.releaseGrapple({ reverseBoost: true })
      } else {
        return
      }
    }

    if (this.grappleState === 'pulling') {
      return
    }

    this.shipHeading += rotateDir * PLAYER_ROT_SPEED * dt
    this.player.setRotation(this.shipHeading + (Math.PI / 2))

    this.isThrusting = thrusting
    this.isReverseThrusting = reverseThrusting

    const baseThrust = window.gameState.playerSpeed * 4 * dt
    const hasFuel = (window.gameState.fuelCurrent ?? 0) > 0
    let burningFuel = false

    if (this.pendingAttachReverseBoost) {
      this.pendingAttachReverseBoost = false
      if (hasFuel) {
        burningFuel = true
        consumeShipFuel(delta, ATTACH_RELEASE_REVERSE_BOOST)
        const boostThrust = baseThrust * ATTACH_RELEASE_REVERSE_BOOST
        this.player.body.velocity.x -= Math.cos(this.shipHeading) * boostThrust
        this.player.body.velocity.y -= Math.sin(this.shipHeading) * boostThrust
        this.isReverseThrusting = true
        this.attachReleaseBoostPulseMs = 180
      }
    } else if (reverseThrusting && hasFuel) {
      burningFuel = true
      consumeShipFuel(delta)
      this.player.body.velocity.x -= Math.cos(this.shipHeading) * baseThrust
      this.player.body.velocity.y -= Math.sin(this.shipHeading) * baseThrust
    }

    if (thrusting && hasFuel) {
      burningFuel = true
      consumeShipFuel(delta)
      this.player.body.velocity.x += Math.cos(this.shipHeading) * baseThrust
      this.player.body.velocity.y += Math.sin(this.shipHeading) * baseThrust
    }

    if (burningFuel && this.tweenFuelChanged) {
      this.tweenFuelChanged.restart()
    }

    this.isEmergencyThrusting = false

    if (!hasFuel) {
      const hasBattery = (window.gameState.batteryCurrent ?? 0) > 0
      const canEmergencyThrust = hasBattery &&
        this.grappleState !== 'attached' &&
        this.grappleState !== 'pulling'

      if (canEmergencyThrust) {
        const emergencyThrust = baseThrust * EMERGENCY_THRUST_MULT

        if (reverseThrusting && consumeBattery(delta, BATTERY_DRAIN_EMERGENCY_THRUST_PER_SEC)) {
          this.player.body.velocity.x -= Math.cos(this.shipHeading) * emergencyThrust
          this.player.body.velocity.y -= Math.sin(this.shipHeading) * emergencyThrust
          this.isReverseThrusting = true
          this.isEmergencyThrusting = true

          if (this.tweenBatteryChanged) {
            this.tweenBatteryChanged.restart()
          }
        } else if (thrusting && consumeBattery(delta, BATTERY_DRAIN_EMERGENCY_THRUST_PER_SEC)) {
          this.player.body.velocity.x += Math.cos(this.shipHeading) * emergencyThrust
          this.player.body.velocity.y += Math.sin(this.shipHeading) * emergencyThrust
          this.isThrusting = true
          this.isEmergencyThrusting = true

          if (this.tweenBatteryChanged) {
            this.tweenBatteryChanged.restart()
          }
        }
      }

      if (!this.isEmergencyThrusting) {
        this.isThrusting = false
        this.isReverseThrusting = false
      }
    }

    const speed = Math.hypot(this.player.body.velocity.x, this.player.body.velocity.y)
    if (speed > PLAYER_MAX_SPEED) {
      const scale = PLAYER_MAX_SPEED / speed
      this.player.body.velocity.x *= scale
      this.player.body.velocity.y *= scale
    }
  },

  addCollectedCargo (resourceType, amount = 1) {
    if (!addToCargo(resourceType, amount)) {
      return false
    }

    this.activeResourcePulseKey = resourceType
    this.tweenResourcesChanged.restart()
    return true
  },

  changeHealth (x) {
    if (this.isShipDestroying) {
      return
    }

    window.gameState.playerCurrentHealth += x
    window.gameState.playerCurrentHealth = Math.max(0, window.gameState.playerCurrentHealth)

    if (window.gameState.playerCurrentHealth <= 0) {
      window.gameState.deathReason = 'hull'
      resetCargo()
      this.tweenHpChanged.restart()
      this.beginShipDestruction()
      return
    }

    this.tweenHpChanged.restart()
  },

  triggerLostInSpace () {
    if (this.isReturningToMothership) {
      return
    }

    window.gameState.deathReason = 'lost'
    resetCargo()
    this.scene.start('death')
  }
}
