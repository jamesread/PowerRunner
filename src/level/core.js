import { Phaser } from '../phaser.js'
import { createParallaxStarfield, renderParallaxStarfield } from '../render/starfield.js'
import { getActiveGamepad, isGamepadPausePressed } from '../input/gamepad.js'
import { getCargoAmount, getCargoTotal } from '../state/economy.js'
import {
  syncHudTextBox,
  applyHullIntegrityHudStyle,
  applyFuelHudStyle,
  applyBatteryHudStyle
} from '../ui/hud.js'
import { updateResourceHudBoxes } from '../ui/resourceHud.js'
import { PLAYER_FUEL_MAX_DEFAULT } from '../constants/player.js'

export const coreMethods = {
  create () {
    this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    this.keyEsc.on('down', () => {
      this.togglePause()
    })
    this.keyPause = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P)
    this.keyPause.on('down', () => {
      this.togglePause()
    })
    this.starfield = createParallaxStarfield(this)
    renderParallaxStarfield(this, this.starfield)
    if (this.starfield.bg) {
      this.starfield.bg.setScrollFactor(0)
    }
    if (this.starfield.starsGraphics) {
      this.starfield.starsGraphics.setScrollFactor(0)
    }

    this.setupWorld()
    this.createFieldMothership()
    this.createPlayer()
    this.setupInput()

    this.createHud()
    this.createDevMenu()
    this.createPauseMenu()
    this.registerLevelResizeHandler()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.clearTransitionFx()
    })
    this.initDirectorState()
    this.initMiningRun()

    if (this.shipTransitionData?.type === 'undock') {
      this.beginUndockTransition(this.shipTransitionData)
    }
  },

  setupInput () {
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    })
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F)
    this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q)
    this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z)
    this.keyT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T)
    this.gamepadPauseWasDown = false
    this.gamepadGrappleWasDown = false
    this.gamepadNanobotWasDown = false
    this.lastGrappleMs = 0
    this.asteroidHitCooldownMs = 0
  },

  update (_, delta) {
    const pad = getActiveGamepad(this)

    if (this.isShipTransitionActive) {
      renderParallaxStarfield(this, this.starfield)
      return
    }

    const pausePressed = isGamepadPausePressed(pad)
    if (pausePressed && !this.gamepadPauseWasDown) {
      this.togglePause()
    }
    this.gamepadPauseWasDown = pausePressed

    if (this.isPaused) {
      renderParallaxStarfield(this, this.starfield)
      this.updatePauseMenu(delta, pad)
      return
    }

    if (this.isShipDestroying) {
      const drift = this.shipDestructionDrift ?? { vx: 0, vy: 0 }
      renderParallaxStarfield(this, this.starfield, { movement: { vx: drift.vx, vy: drift.vy, delta } })
      drift.vx *= 0.985
      drift.vy *= 0.985
      this.updateShipDestruction(delta)
      return
    }

    const vx = this.player?.body?.velocity?.x ?? 0
    const vy = this.player?.body?.velocity?.y ?? 0
    renderParallaxStarfield(this, this.starfield, { movement: { vx, vy, delta } })

    if (this.asteroidHitCooldownMs > 0) {
      this.asteroidHitCooldownMs = Math.max(0, this.asteroidHitCooldownMs - delta)
    }
    if (this.grappleDetachGraceMs > 0) {
      this.grappleDetachGraceMs = Math.max(0, this.grappleDetachGraceMs - delta)
      if (this.grappleDetachGraceMs <= 0 || !this.grappleDetachAsteroid?.active) {
        this.grappleDetachAsteroid = null
      }
    }
    if (this.attachReleaseBoostPulseMs > 0) {
      this.attachReleaseBoostPulseMs = Math.max(0, this.attachReleaseBoostPulseMs - delta)
    }
    for (const asteroid of this.asteroids) {
      if ((asteroid.shieldHitCooldownMs ?? 0) > 0) {
        asteroid.shieldHitCooldownMs = Math.max(0, asteroid.shieldHitCooldownMs - delta)
      }
      if ((asteroid.collisionFractureCooldownMs ?? 0) > 0) {
        asteroid.collisionFractureCooldownMs = Math.max(0, asteroid.collisionFractureCooldownMs - delta)
      }
      if ((asteroid.spawnSettleMs ?? 0) > 0) {
        asteroid.spawnSettleMs = Math.max(0, asteroid.spawnSettleMs - delta)
      }
    }
    this.updateMothershipShield(delta)
    this.updatePlayerMovement(delta, pad)
    this.updateFuelState(delta)
    this.updateGrapple(delta)
    this.updateDrilling(delta)
    this.updateTractorBeam(delta)
    this.updateScanner(delta)
    this.updateBattery(delta)
    this.updateNanobots(delta)
    this.updateExplosiveCharges(delta)
    this.updateAsteroidMineralLabels()

    if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      this.fireGrappleHook()
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
      this.placeExplosiveCharge()
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyT)) {
      this.toggleNanobots()
    }
    if (pad?.X && !this.gamepadGrappleWasDown) {
      this.fireGrappleHook()
    }
    this.gamepadGrappleWasDown = pad?.X ?? false

    if (pad?.Y && !this.gamepadNanobotWasDown) {
      this.toggleNanobots()
    }
    this.gamepadNanobotWasDown = pad?.Y ?? false

    this.renderPlayerThrusters(this.isThrusting, this.isReverseThrusting)
    this.collectorPincerTimer += delta
    let pincerOpen = 0.25 + (((Math.sin(this.collectorPincerTimer * 0.011) + 1) / 2) * 0.7)
    if (this.collectorGrabPulseMs > 0) {
      this.collectorGrabPulseMs = Math.max(0, this.collectorGrabPulseMs - delta)
      pincerOpen = 0.08 + (Math.abs(Math.sin(this.collectorPincerTimer * 0.06)) * 0.42)
    }
    this.renderPlayerShip(pincerOpen)
    this.renderPlayerDamageOverlay(delta)
    this.renderNanobotFx(delta)

    updateResourceHudBoxes(this.resourceHudBoxes, getCargoAmount)
    this.txtLevel.setText('Level: ' + this.level)
    syncHudTextBox(this.txtLevel)
    this.txtCargo.setText('Cargo: ' + getCargoTotal() + ' / ' + window.gameState.cargoMaxUnits)
    syncHudTextBox(this.txtCargo)
    const chargeCount = window.gameState.explosiveCharges ?? 0
    let chargeLabel = 'Charges: ' + chargeCount
    if (chargeCount > 0 && this.grappleState === 'attached') {
      chargeLabel += ' (Z)'
    }
    this.txtCharges.setText(chargeLabel)
    syncHudTextBox(this.txtCharges)
    this.txtHp.setText(this.getHullHudLabel())
    syncHudTextBox(this.txtHp)
    applyHullIntegrityHudStyle(this, this.txtHp, window.gameState.playerCurrentHealth, window.gameState.playerMaxHealth)
    if (this.txtFuel) {
      this.txtFuel.setText(this.getFuelHudLabel())
      syncHudTextBox(this.txtFuel)
      applyFuelHudStyle(this, this.txtFuel, window.gameState.fuelCurrent ?? 0, window.gameState.fuelMax ?? PLAYER_FUEL_MAX_DEFAULT)
    }
    if (this.txtBattery) {
      this.txtBattery.setText(this.getBatteryHudLabel())
      syncHudTextBox(this.txtBattery)
      applyBatteryHudStyle(this, this.txtBattery, window.gameState.batteryCurrent ?? 0, window.gameState.batteryMax ?? 100)
    }
    this.updateLevelHudLayout()
    this.checkAutoDock()
    this.updateDockingNavHud()
  }
}
