import { Phaser } from '../phaser.js'
import { SHIP_DESTRUCTION_MS } from '../constants/player.js'
import { drawPlayerShipDebrisShard, SHIP_DEBRIS_SHARDS } from '../render/player.js'

export const destructionMethods = {
  beginShipDestruction () {
    if (this.isShipDestroying || !this.player?.active) {
      return
    }

    this.isShipDestroying = true
    window.gameState.playerCurrentHealth = 0

    this.releaseGrapple()
    this.clearPlacedCharges()
    this.stopDrilling()
    this.isTractorBeamActive = false
    this.tractoredAsteroids = []
    this.nanobotsActive = false
    this.isThrusting = false
    this.isReverseThrusting = false

    const x = this.player.x
    const y = this.player.y
    const heading = this.shipHeading ?? 0
    const rotation = this.player.rotation
    const scale = this.playerShipMetrics?.scale ?? 0.45
    const velX = this.player.body?.velocity?.x ?? 0
    const velY = this.player.body?.velocity?.y ?? 0

    this.shipDestructionDrift = { vx: velX * 0.4, vy: velY * 0.4 }

    if (this.player.body) {
      this.player.body.setVelocity(0, 0)
      this.player.body.enable = false
    }

    this.player.setVisible(false)
    this.playerThrusters?.clear()
    this.playerDamageFx?.clear()
    this.tractorBeamFx?.clear()
    this.grappleLine?.clear()
    this.drillArm?.clear()
    this.cameras.main.stopFollow()

    this.shipDestructionFlash = this.add.circle(x, y, 16, 0xff6868, 0.9)
    this.shipDestructionFlash.setDepth(20)
    this.tweens.add({
      targets: this.shipDestructionFlash,
      scale: 4.5,
      alpha: 0,
      duration: 520,
      ease: 'Cubic.Out'
    })

    this.cameras.main.shake(320, 0.014)

    this.shipDebris = []
    const cos = Math.cos(heading)
    const sin = Math.sin(heading)

    for (const spec of SHIP_DEBRIS_SHARDS) {
      const gfx = this.add.graphics()
      gfx.setDepth(19)
      drawPlayerShipDebrisShard(gfx, spec.id, scale)

      const localX = spec.localX * scale
      const localY = spec.localY * scale
      const worldOffsetX = (localX * cos) - (localY * sin)
      const worldOffsetY = (localX * sin) + (localY * cos)
      const launchAngle = heading + (spec.launchAngle ?? 0)
      const speed = spec.speed ?? 120

      gfx.setPosition(x + worldOffsetX, y + worldOffsetY)
      gfx.setRotation(rotation + (spec.rotationOffset ?? 0))

      this.shipDebris.push({
        gfx,
        vx: velX * 0.35 + (Math.cos(launchAngle) * speed),
        vy: velY * 0.35 + (Math.sin(launchAngle) * speed),
        spin: spec.spin ?? Phaser.Math.FloatBetween(-4, 4),
        fade: spec.fade ?? 1.4,
        life: 1
      })
    }

    this.shipDestructionSparks = []
    for (let i = 0; i < 14; i++) {
      const spark = this.add.circle(
        x + Phaser.Math.Between(-8, 8),
        y + Phaser.Math.Between(-8, 8),
        Phaser.Math.FloatBetween(1.2, 2.8),
        Phaser.Math.RND.pick([0xffd36d, 0xf36b2b, 0xff6868, 0xd6ecff]),
        Phaser.Math.FloatBetween(0.7, 1)
      )
      spark.setDepth(21)
      const angle = heading + Phaser.Math.FloatBetween(-Math.PI, Math.PI)
      const speed = Phaser.Math.FloatBetween(80, 220)
      this.shipDestructionSparks.push({
        gfx: spark,
        vx: velX * 0.25 + (Math.cos(angle) * speed),
        vy: velY * 0.25 + (Math.sin(angle) * speed),
        fade: Phaser.Math.FloatBetween(1.4, 2.2),
        life: 1
      })
    }

    this.shipDestructionRemainingMs = SHIP_DESTRUCTION_MS
  },

  updateShipDestruction (delta) {
    if (!this.isShipDestroying) {
      return
    }

    const dt = delta / 1000
    this.shipDestructionRemainingMs -= delta

    for (const piece of this.shipDebris ?? []) {
      piece.gfx.x += piece.vx * dt
      piece.gfx.y += piece.vy * dt
      piece.gfx.rotation += piece.spin * dt
      piece.vx *= 0.992
      piece.vy *= 0.992
      piece.life -= piece.fade * dt
      piece.gfx.setAlpha(Math.max(0, piece.life))
    }

    for (const spark of this.shipDestructionSparks ?? []) {
      spark.gfx.x += spark.vx * dt
      spark.gfx.y += spark.vy * dt
      spark.vx *= 0.985
      spark.vy *= 0.985
      spark.life -= spark.fade * dt
      spark.gfx.setAlpha(Math.max(0, spark.life))
    }

    if (this.shipDestructionRemainingMs <= 0) {
      this.finishShipDestruction()
    }
  },

  finishShipDestruction () {
    if (!this.isShipDestroying) {
      return
    }

    for (const piece of this.shipDebris ?? []) {
      piece.gfx?.destroy()
    }
    for (const spark of this.shipDestructionSparks ?? []) {
      spark.gfx?.destroy()
    }

    this.shipDebris = []
    this.shipDestructionSparks = []
    this.shipDestructionFlash?.destroy()
    this.shipDestructionFlash = null
    this.isShipDestroying = false
    this.scene.start('death')
  }
}
