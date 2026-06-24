import { Phaser } from '../phaser.js'
import { resetCargo } from '../state/economy.js'
import { prepareShipForUndock } from '../state/ship.js'
import { startMothershipTransition } from '../game/transitions.js'

export const runMethods = {
  initDirectorState () {
    const runProgress = Math.max(0, (window.gameState.level - 1) * 0.012)
    const storedPressure = window.gameState.directorPressure
    const baseline = Phaser.Math.Clamp(0.22 + runProgress, 0.15, 0.82)
    this.directorPressure = Phaser.Math.Clamp(
      typeof storedPressure === 'number' ? storedPressure : baseline,
      0.1,
      0.88
    )
  },

  returnToMothership () {
    if (this.isReturningToMothership || this.isShipTransitionActive) {
      return
    }

    this.beginReturnShipTransition((mothershipStart) => {
      startMothershipTransition(this, 'level', {
        flyInStartX: mothershipStart.x,
        flyInStartY: mothershipStart.y
      })
    })
  },

  quitLevel () {
    this.returnToMothership()
  },

  initMiningRun () {
    resetCargo()
    prepareShipForUndock()
    this.isReturningToMothership = false
    this.canAutoDock = false
    this.fuelLostGraceMs = 0
    this.level = window.gameState.level
    window.gameState.level++

    if (this.starfield) {
      this.starfield.parallaxOffsetX = 0
      this.starfield.parallaxOffsetY = 0
    }

    this.clearAsteroids()
    this.releaseGrapple()
    this.resetScannerState()
    this.clearPlacedCharges()
    this.initMiningField()
    this.fixHudToCamera()
  },

  getDirectorWaveBalance () {
    const levelPressure = 1 - Math.exp(-(this.level / 18))
    const pressure = Phaser.Math.Clamp((this.directorPressure * 0.65) + (levelPressure * 0.35), 0, 1)

    return {
      asteroidCount: Math.max(6, Math.round((this.level * 1.5) + (Math.sqrt(this.level) * 2) + (pressure * 8))),
      badChance: Phaser.Math.Clamp(0.2 + (pressure * 0.35), 0.18, 0.62)
    }
  },

  nudgeDirectorPressure (delta) {
    this.directorPressure = Phaser.Math.Clamp(this.directorPressure + delta, 0.1, 0.88)
    window.gameState.directorPressure = this.directorPressure
  }
}
