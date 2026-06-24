import { getNanobotRepairRate } from '../state/ship.js'

export const nanobotMethods = {
  initNanobots () {
    this.nanobotsActive = false
    this.nanobotPulseMs = 0
    this.nanobotRepairFx = this.add.graphics()
    this.nanobotRepairFx.setDepth(2)
  },

  canActivateNanobots () {
    const level = window.gameState.nanobotLevel ?? 0

    if (level <= 0 || this.isShipDestroying || this.isReturningToMothership) {
      return false
    }

    if (window.gameState.playerCurrentHealth >= window.gameState.playerMaxHealth) {
      return false
    }

    return (window.gameState.batteryCurrent ?? 0) > 0
  },

  toggleNanobots () {
    if (this.nanobotsActive) {
      this.nanobotsActive = false
      return
    }

    if (this.canActivateNanobots()) {
      this.nanobotsActive = true
    }
  },

  updateNanobots (delta) {
    if (!this.nanobotsActive) {
      return
    }

    const level = window.gameState.nanobotLevel ?? 0

    if (level <= 0) {
      this.nanobotsActive = false
      return
    }

    if (window.gameState.playerCurrentHealth >= window.gameState.playerMaxHealth) {
      this.nanobotsActive = false
      return
    }

    if ((window.gameState.batteryCurrent ?? 0) <= 0) {
      this.nanobotsActive = false
      return
    }

    const repair = getNanobotRepairRate(level) * (delta / 1000)

    if (repair <= 0) {
      return
    }

    const before = window.gameState.playerCurrentHealth
    window.gameState.playerCurrentHealth = Math.min(
      window.gameState.playerMaxHealth,
      before + repair
    )

    if (window.gameState.playerCurrentHealth > before && this.tweenHpChanged) {
      this.tweenHpChanged.restart()
    }

    if (window.gameState.playerCurrentHealth >= window.gameState.playerMaxHealth) {
      this.nanobotsActive = false
    }
  },

  renderNanobotFx (delta) {
    if (!this.nanobotRepairFx) {
      return
    }

    this.nanobotRepairFx.clear()

    if (!this.nanobotsActive || !this.player?.visible) {
      return
    }

    this.nanobotPulseMs += delta
    const pulse = (Math.sin(this.nanobotPulseMs * 0.022) + 1) / 2
    const alpha = 0.14 + (pulse * 0.22)
    const scale = this.playerShipMetrics?.scale ?? 0.45
    const c = (value) => (value - 35) * scale

    this.nanobotRepairFx.setPosition(this.player.x, this.player.y)
    this.nanobotRepairFx.setRotation(this.player.rotation)
    this.nanobotRepairFx.fillStyle(0x6fd492, alpha)
    this.nanobotRepairFx.fillTriangle(c(35), c(0), c(69), c(60), c(1), c(60))
    this.nanobotRepairFx.fillStyle(0xb8f0c8, alpha * 0.85)
    this.nanobotRepairFx.fillCircle(c(35), c(26), scale * 5)

    for (let i = 0; i < 4; i++) {
      const angle = (this.nanobotPulseMs * 0.004) + (i * (Math.PI / 2))
      const orbit = scale * (10 + (pulse * 4))
      this.nanobotRepairFx.fillStyle(0xd6ffe0, alpha * 0.9)
      this.nanobotRepairFx.fillCircle(
        c(35) + (Math.cos(angle) * orbit),
        c(30) + (Math.sin(angle) * orbit),
        scale * 1.4
      )
    }
  },

  getHullHudLabel () {
    const current = Math.round(window.gameState.playerCurrentHealth)
    const max = window.gameState.playerMaxHealth
    let label = 'Hull Integrity: ' + current + ' / ' + max
    const nanobotLevel = window.gameState.nanobotLevel ?? 0

    if (nanobotLevel > 0) {
      label += this.nanobotsActive ? '  | Nanobots ON (T)' : '  | Nanobots OFF (T)'
    }

    return label
  }
}
