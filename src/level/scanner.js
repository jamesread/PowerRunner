import {
  SCANNER_HOLD_MS,
  SCANNER_PULSE_MS
} from '../constants/tools.js'
import { getActiveGamepad, isGamepadScannerHeld } from '../input/gamepad.js'
import { getScannerRange, getScannerMarkerColor } from '../utils/tools.js'
import { worldToScreenPoint, isScreenPointVisible, getScreenEdgePointFromAngle } from '../utils/geometry.js'
import { SPACE_ACCENT_COLOR } from '../constants/theme.js'

export const scannerMethods = {
  createScannerHud () {
    const depth = 560

    this.scanTargetNav = this.add.graphics()
    this.scanTargetNav.setDepth(depth)
    this.scanTargetNav.setScrollFactor(0)

    this.scanPulseGraphics = this.add.graphics()
    this.scanPulseGraphics.setDepth(6)

    this.scannerChargeBg = this.add.rectangle(0, 0, 196, 18, 0x0f1720, 0.88)
    this.scannerChargeBg.setStrokeStyle(1, SPACE_ACCENT_COLOR, 0.75)
    this.scannerChargeBg.setOrigin(0.5, 0.5)
    this.scannerChargeBg.setDepth(depth)
    this.scannerChargeBg.setScrollFactor(0)
    this.scannerChargeBg.setVisible(false)

    this.scannerChargeFill = this.add.rectangle(0, 0, 0, 12, 0x8fcbe8, 0.95)
    this.scannerChargeFill.setOrigin(0, 0.5)
    this.scannerChargeFill.setDepth(depth + 1)
    this.scannerChargeFill.setScrollFactor(0)
    this.scannerChargeFill.setVisible(false)

    this.scannerChargeText = this.add.text(0, 0, 'Scanner', {
      fontFamily: 'sans-serif',
      fontSize: 12,
      color: '#dee3e7'
    })
    this.scannerChargeText.setOrigin(0.5, 0.5)
    this.scannerChargeText.setDepth(depth + 2)
    this.scannerChargeText.setScrollFactor(0)
    this.scannerChargeText.setVisible(false)

    this.scannedAsteroids = []
    this.scannerHoldMs = 0
    this.scanPulseActive = false
    this.scanPulseMs = 0
    this.scanPulseRange = 0
    this.scanRevealRadius = 0

    this.updateScannerHudLayout()
  },

  updateScannerHudLayout () {
    if (!this.scannerChargeBg) {
      return
    }

    const width = this.scale.width || this.sys.game.canvas.width
    const height = this.scale.height || this.sys.game.canvas.height
    const cx = width / 2
    const barY = height - 42
    const labelY = barY - 18
    const fillMaxWidth = 188
    const progress = Math.min(1, this.scannerHoldMs / SCANNER_HOLD_MS)

    this.scannerChargeBg.setPosition(cx, barY)
    this.scannerChargeText.setPosition(cx, labelY)
    this.scannerChargeFill.setPosition(cx - (fillMaxWidth / 2), barY)
    this.scannerChargeFill.width = Math.max(0, fillMaxWidth * progress)
  },

  resetScannerCharge () {
    this.scannerHoldMs = 0
    this.updateScannerChargeHud(false)
  },

  resetScannerState () {
    this.resetScannerCharge()
    this.scanPulseActive = false
    this.scanPulseMs = 0
    this.scanPulseRange = 0
    this.scanRevealRadius = 0
    this.scannedAsteroids = []

    if (this.scanPulseGraphics) {
      this.scanPulseGraphics.clear()
    }

    if (this.scanTargetNav) {
      this.scanTargetNav.clear()
    }
  },

  updateScannerChargeHud (visible) {
    if (!this.scannerChargeBg) {
      return
    }

    this.scannerChargeBg.setVisible(visible)
    this.scannerChargeFill.setVisible(visible)
    this.scannerChargeText.setVisible(visible)

    if (visible) {
      this.updateScannerHudLayout()
    }
  },

  beginScanPulse (scannerLevel) {
    this.scanPulseActive = true
    this.scanPulseMs = 0
    this.scanPulseRange = getScannerRange(scannerLevel)
    this.scanRevealRadius = 0
    this.scannedAsteroids = []

    for (const asteroid of this.asteroids) {
      if (asteroid) {
        asteroid.isScanned = false
      }
    }
  },

  renderScanPulseRing (progress) {
    if (!this.scanPulseGraphics || !this.player) {
      return
    }

    this.scanPulseGraphics.clear()
    const radius = this.scanPulseRange * progress
    const alpha = 0.55 * (1 - progress)

    this.scanPulseGraphics.lineStyle(3, 0x8fcbe8, alpha)
    this.scanPulseGraphics.strokeCircle(this.player.x, this.player.y, radius)
    this.scanPulseGraphics.lineStyle(1.5, 0xd6ecff, alpha * 0.8)
    this.scanPulseGraphics.strokeCircle(this.player.x, this.player.y, Math.max(0, radius - 8))
  },

  updateScanPulse (delta) {
    if (!this.scanPulseActive || !this.player) {
      return
    }

    this.scanPulseMs += delta
    const progress = Math.min(1, this.scanPulseMs / SCANNER_PULSE_MS)
    this.scanRevealRadius = this.scanPulseRange * progress

    for (const asteroid of this.asteroids) {
      if (!asteroid?.active || asteroid.isScanned) {
        continue
      }

      const dist = Math.hypot(asteroid.x - this.player.x, asteroid.y - this.player.y)
      if (dist <= this.scanRevealRadius) {
        asteroid.isScanned = true
        this.revealAsteroidMinerals(asteroid)
        this.scannedAsteroids.push(asteroid)
      }
    }

    this.renderScanPulseRing(progress)

    if (progress >= 1) {
      this.scanPulseActive = false
      this.scanPulseGraphics.clear()
    }
  },

  updateScannedAsteroidNav () {
    if (!this.scanTargetNav || !this.player) {
      return
    }

    this.scanTargetNav.clear()

    if (!this.scannedAsteroids?.length) {
      return
    }

    const width = this.scale.width || this.sys.game.canvas.width
    const height = this.scale.height || this.sys.game.canvas.height
    const camera = this.cameras.main
    const playerScreen = worldToScreenPoint(camera, this.player.x, this.player.y)
    const playerOnScreen = isScreenPointVisible(playerScreen.x, playerScreen.y, width, height)

    for (const asteroid of this.scannedAsteroids) {
      if (!this.shouldShowScannedAsteroidNav(asteroid)) {
        continue
      }

      const dx = asteroid.x - this.player.x
      const dy = asteroid.y - this.player.y
      const angle = Math.atan2(dy, dx)
      const color = getScannerMarkerColor(asteroid)
      const asteroidScreen = worldToScreenPoint(camera, asteroid.x, asteroid.y)
      const asteroidOnScreen = isScreenPointVisible(asteroidScreen.x, asteroidScreen.y, width, height)
      const useBorderIndicator = !asteroidOnScreen || !playerOnScreen

      let arrowX
      let arrowY
      let arrowAngle

      if (useBorderIndicator) {
        const edge = getScreenEdgePointFromAngle(width, height, angle, 52)
        arrowX = edge.x
        arrowY = edge.y
        arrowAngle = angle
      } else {
        arrowAngle = angle
        const tipOffset = 12
        arrowX = asteroidScreen.x - (Math.cos(arrowAngle) * tipOffset)
        arrowY = asteroidScreen.y - (Math.sin(arrowAngle) * tipOffset)
      }

      this.scanTargetNav.lineStyle(1.5, 0x0f1720, 1)
      this.scanTargetNav.fillStyle(color, 0.95)
      this.scanTargetNav.fillTriangle(
        arrowX + (Math.cos(arrowAngle) * 12),
        arrowY + (Math.sin(arrowAngle) * 12),
        arrowX + (Math.cos(arrowAngle + 2.4) * 8),
        arrowY + (Math.sin(arrowAngle + 2.4) * 8),
        arrowX + (Math.cos(arrowAngle - 2.4) * 8),
        arrowY + (Math.sin(arrowAngle - 2.4) * 8)
      )
      this.scanTargetNav.strokeTriangle(
        arrowX + (Math.cos(arrowAngle) * 12),
        arrowY + (Math.sin(arrowAngle) * 12),
        arrowX + (Math.cos(arrowAngle + 2.4) * 8),
        arrowY + (Math.sin(arrowAngle + 2.4) * 8),
        arrowX + (Math.cos(arrowAngle - 2.4) * 8),
        arrowY + (Math.sin(arrowAngle - 2.4) * 8)
      )
    }

    this.scannedAsteroids = this.scannedAsteroids.filter((asteroid) => this.shouldShowScannedAsteroidNav(asteroid))
  },

  updateScanner (delta) {
    this.updateScanPulse(delta)
    this.updateScannedAsteroidNav()

    const scannerLevel = window.gameState.scannerLevel ?? 0
    if (scannerLevel <= 0 || !this.player || this.isReturningToMothership) {
      this.resetScannerCharge()
      return
    }

    if (this.scanPulseActive) {
      this.updateScannerChargeHud(false)
      return
    }

    const pad = getActiveGamepad(this)
    if (this.keyQ?.isDown || isGamepadScannerHeld(pad)) {
      this.scannerHoldMs += delta
      this.updateScannerChargeHud(true)

      if (this.scannerHoldMs >= SCANNER_HOLD_MS) {
        this.beginScanPulse(scannerLevel)
        this.resetScannerCharge()
      }
      return
    }

    this.resetScannerCharge()
  }
}
