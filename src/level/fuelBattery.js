import {
  PLAYER_FUEL_MAX_DEFAULT,
  FUEL_LOST_GRACE_MS,
  BATTERY_DRAIN_TRACTOR_PER_SEC,
  BATTERY_SCAN_PULSE_DRAIN_MULT,
  BATTERY_RECHARGE_PCT_PER_SEC
} from '../constants/player.js'
import { MOTHERSHIP_SHIELD_RADIUS } from '../constants/asteroids.js'
import { consumeBattery, getScannerBatteryDrainRate, getNanobotBatteryDrainRate } from '../state/ship.js'
import { getBatteryRechargeFuelPerPct, getGrappleBatteryDrainRate } from '../utils/upgrades.js'
import {
  getDockClosureInfo,
  getFuelLostGraceDecayMultiplier,
  applyDistressTow
} from '../utils/fuelRescue.js'

export const fuelBatteryMethods = {
  updateFuelState (delta) {
    const fuel = window.gameState.fuelCurrent ?? 0

    if (fuel > 0 || this.isReturningToMothership) {
      this.fuelLostGraceMs = 0
      this.fuelRescueApproachFactor = 0
      this.fuelRescueDistressTowActive = false
      return
    }

    if (this.fuelLostGraceMs <= 0) {
      this.fuelLostGraceMs = FUEL_LOST_GRACE_MS
    }

    let graceDecay = delta
    this.fuelRescueDistressTowActive = false

    if (this.player?.active) {
      const dockX = this.dockingPortX ?? this.worldCenterX
      const dockY = this.dockingPortY ?? this.worldCenterY
      const closure = getDockClosureInfo(
        this.player.x,
        this.player.y,
        this.player.body?.velocity?.x ?? 0,
        this.player.body?.velocity?.y ?? 0,
        dockX,
        dockY
      )

      this.fuelRescueApproachFactor = closure.approachFactor
      graceDecay = delta * getFuelLostGraceDecayMultiplier(closure.approachFactor)

      if (this.fuelLostGraceMs > 0) {
        const towStrength = applyDistressTow(
          this.player,
          dockX,
          dockY,
          this.mothershipShieldRadius ?? MOTHERSHIP_SHIELD_RADIUS,
          delta
        )
        this.fuelRescueDistressTowActive = towStrength > 0
      }
    } else {
      this.fuelRescueApproachFactor = 0
    }

    this.fuelLostGraceMs = Math.max(0, this.fuelLostGraceMs - graceDecay)

    if (this.fuelLostGraceMs <= 0) {
      this.triggerLostInSpace()
    }
  },

  updateBattery (delta) {
    if (this.isReturningToMothership) {
      return
    }

    let drainPerSec = 0

    if (this.grappleState !== 'idle') {
      drainPerSec += getGrappleBatteryDrainRate(window.gameState.grappleLevel ?? 0)
    }

    if (this.isTractorBeamActive) {
      drainPerSec += BATTERY_DRAIN_TRACTOR_PER_SEC
    }

    if (this.nanobotsActive) {
      drainPerSec += getNanobotBatteryDrainRate(window.gameState.nanobotLevel ?? 0)
    }

    const scannerLevel = window.gameState.scannerLevel ?? 0
    if (scannerLevel > 0) {
      const scannerDrain = getScannerBatteryDrainRate(scannerLevel)

      if (this.scanPulseActive) {
        drainPerSec += scannerDrain * BATTERY_SCAN_PULSE_DRAIN_MULT
      } else if (this.keyQ?.isDown) {
        drainPerSec += scannerDrain
      }
    }

    if (drainPerSec > 0) {
      consumeBattery(delta, drainPerSec)

      if (this.tweenBatteryChanged) {
        this.tweenBatteryChanged.restart()
      }

      return
    }

    const battery = window.gameState.batteryCurrent ?? 0
    const batteryMax = window.gameState.batteryMax ?? 100
    const fuel = window.gameState.fuelCurrent ?? 0

    if (battery >= batteryMax || fuel <= 0) {
      return
    }

    const dt = delta / 1000
    const maxRechargePct = BATTERY_RECHARGE_PCT_PER_SEC * dt
    const fuelPerPct = getBatteryRechargeFuelPerPct(window.gameState.supercapacitorLevel ?? 0)
    const maxRechargeByFuel = fuel / fuelPerPct
    const rechargePct = Math.min(maxRechargePct, maxRechargeByFuel, batteryMax - battery)

    if (rechargePct <= 0) {
      return
    }

    window.gameState.fuelCurrent = Math.max(0, fuel - (rechargePct * fuelPerPct))
    window.gameState.batteryCurrent = Math.min(batteryMax, battery + rechargePct)

    if (this.tweenBatteryChanged) {
      this.tweenBatteryChanged.restart()
    }

    if (this.tweenFuelChanged) {
      this.tweenFuelChanged.restart()
    }
  },

  getFuelHudLabel () {
    const fuel = Math.max(0, Math.round(window.gameState.fuelCurrent ?? 0))
    const maxFuel = window.gameState.fuelMax ?? PLAYER_FUEL_MAX_DEFAULT
    let label = 'Fuel: ' + fuel + ' / ' + maxFuel

    if (fuel <= 0 && this.fuelLostGraceMs > 0 && !this.isReturningToMothership) {
      const secondsLeft = Math.ceil(this.fuelLostGraceMs / 1000)

      if (this.fuelRescueDistressTowActive) {
        label += '  — Distress tow'
      } else if ((this.fuelRescueApproachFactor ?? 0) >= 0.35) {
        label += '  — Gliding to dock (' + secondsLeft + 's)'
      } else {
        label += '  — Lost in ' + secondsLeft + 's'
      }
    }

    return label
  },

  getBatteryHudLabel () {
    const charge = Math.max(0, Math.round(window.gameState.batteryCurrent ?? 0))

    return 'Battery: ' + charge + '%'
  }
}
