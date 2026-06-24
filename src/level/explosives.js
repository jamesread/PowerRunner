import { Phaser } from '../phaser.js'
import {
  CHARGE_FUSE_MS,
  CHARGE_BLAST_RADIUS,
  CHARGE_BLAST_DAMAGE_MAX,
  CHARGE_BLAST_DAMAGE_MIN
} from '../constants/tools.js'
import { rotateAsteroidLocalPoint } from '../utils/geometry.js'

export const explosivesMethods = {
  clearPlacedCharges () {
    if (!this.placedCharges) {
      this.placedCharges = []
      return
    }

    for (const charge of this.placedCharges) {
      charge.marker?.destroy()
    }

    this.placedCharges = []
  },

  removePlacedCharge (charge) {
    charge.marker?.destroy()
    const index = this.placedCharges.indexOf(charge)

    if (index >= 0) {
      this.placedCharges.splice(index, 1)
    }
  },

  placeExplosiveCharge () {
    if (this.grappleState !== 'attached' || !this.grappleTarget?.active) {
      return
    }

    if ((window.gameState.explosiveCharges ?? 0) <= 0) {
      return
    }

    const asteroid = this.grappleTarget

    if (this.placedCharges.some((charge) => charge.asteroid === asteroid)) {
      return
    }

    window.gameState.explosiveCharges -= 1
    this.stopDrilling()

    const charge = {
      asteroid,
      localX: this.grappleAttachLocal.x,
      localY: this.grappleAttachLocal.y,
      fuseMs: CHARGE_FUSE_MS,
      marker: this.add.graphics()
    }
    charge.marker.setDepth(9)
    this.placedCharges.push(charge)

    this.releaseGrapple()
  },

  renderChargeMarker (charge, worldX, worldY) {
    if (!charge.marker?.active) {
      return
    }

    const fuseRatio = Phaser.Math.Clamp(charge.fuseMs / CHARGE_FUSE_MS, 0, 1)
    const urgency = 1 - fuseRatio
    const pulse = 0.5 + (0.5 * Math.sin(this.time.now * 0.01 * (1 + (urgency * 5))))
    const radius = 5 + (urgency * 3) + (pulse * 1.5)

    charge.marker.clear()
    charge.marker.fillStyle(0xff6b2b, 0.75 + (pulse * 0.2))
    charge.marker.fillCircle(worldX, worldY, radius)
    charge.marker.lineStyle(2, urgency > 0.75 ? 0xff2a2a : 0xffcc88, 0.95)
    charge.marker.strokeCircle(worldX, worldY, radius + 2)
  },

  spawnChargeBlastFx (x, y) {
    const ring = this.add.circle(x, y, CHARGE_BLAST_RADIUS, 0xff8844, 0.42)
    ring.setDepth(7)
    ring.setScale(0.08)

    this.tweens.add({
      targets: ring,
      scale: 1,
      alpha: 0,
      duration: 420,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        ring.destroy()
      }
    })

    this.cameras.main.shake(180, 0.008)
  },

  applyChargeBurstDamage (blastX, blastY) {
    if (!this.player?.active) {
      return
    }

    const dx = this.player.x - blastX
    const dy = this.player.y - blastY
    const dist = Math.hypot(dx, dy)

    if (dist > CHARGE_BLAST_RADIUS) {
      return
    }

    const falloff = 1 - (dist / CHARGE_BLAST_RADIUS)
    const damage = Math.round(
      CHARGE_BLAST_DAMAGE_MIN + ((CHARGE_BLAST_DAMAGE_MAX - CHARGE_BLAST_DAMAGE_MIN) * falloff)
    )

    this.triggerShipDamageFeedback()
    this.changeHealth(-damage)
    if (this.isShipDestroying) {
      return
    }
    this.nudgeDirectorPressure(-Math.min(0.12, 0.03 + (damage / 120)))

    const push = 140 * falloff
    const pushDist = Math.max(1, dist)
    this.player.body.velocity.x += (dx / pushDist) * push
    this.player.body.velocity.y += (dy / pushDist) * push
  },

  detonateCharge (charge) {
    const asteroid = charge.asteroid
    let blastX = charge.lastWorldX ?? 0
    let blastY = charge.lastWorldY ?? 0

    if (asteroid?.active) {
      const pos = rotateAsteroidLocalPoint(asteroid, charge.localX, charge.localY)
      blastX = pos.x
      blastY = pos.y
    }

    this.removePlacedCharge(charge)
    this.spawnChargeBlastFx(blastX, blastY)
    this.applyChargeBurstDamage(blastX, blastY)

    if (this.grappleTarget === asteroid && (this.grappleState === 'attached' || this.grappleState === 'pulling')) {
      this.releaseGrapple()
    }

    if (!asteroid?.active) {
      return
    }

    if (asteroid.isScanned) {
      this.scannedAsteroids = this.scannedAsteroids.filter((entry) => entry !== asteroid)
    }

    const hitAngle = Math.atan2(asteroid.y - blastY, asteroid.x - blastX)
    this.fractureAsteroid(asteroid, hitAngle, {
      speedMin: 90,
      speedMax: 180
    })
  },

  updateExplosiveCharges (delta) {
    if (!this.placedCharges?.length) {
      return
    }

    for (let i = this.placedCharges.length - 1; i >= 0; i--) {
      const charge = this.placedCharges[i]
      const asteroid = charge.asteroid

      if (!asteroid?.active) {
        this.removePlacedCharge(charge)
        continue
      }

      const pos = rotateAsteroidLocalPoint(asteroid, charge.localX, charge.localY)
      charge.lastWorldX = pos.x
      charge.lastWorldY = pos.y
      charge.fuseMs -= delta
      this.renderChargeMarker(charge, pos.x, pos.y)

      if (charge.fuseMs <= 0) {
        this.detonateCharge(charge)
      }
    }
  }
}
