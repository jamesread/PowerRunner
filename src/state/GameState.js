import { PLAYER_FUEL_MAX_DEFAULT } from '../constants/player.js'

class GameState {
  constructor () {
    this.level = 1
    this.resources = {
      iron: 18,
      helium3: 10,
      crystal: 4
    }
    this.endGirderCount = 1
    this.playerSpeed = 70
    this.playerMaxHealth = 100
    this.playerCurrentHealth = this.playerMaxHealth
    this.fuelMax = PLAYER_FUEL_MAX_DEFAULT
    this.fuelCurrent = this.fuelMax
    this.batteryMax = 100
    this.batteryCurrent = this.batteryMax
    this.deathReason = null
    this.cargoMaxUnits = 50
    this.cargo = {
      iron: 0,
      helium3: 0,
      crystal: 0
    }
    this.fuelCapacityLevel = 0
    this.batteryCapacityLevel = 0
    this.drillSpeedLevel = 0
    this.drillYieldLevel = 0
    this.cargoHoldLevel = 0
    this.supercapacitorLevel = 0
    this.grappleLevel = 0
    this.tractorBeamLevel = 0
    this.scannerLevel = 0
    this.nanobotLevel = 0
    this.explosiveCharges = 0
  }
}

export { GameState }
