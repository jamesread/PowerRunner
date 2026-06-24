import {
  PLAYER_FUEL_MAX_DEFAULT,
  FUEL_BURN_PER_SEC,
  BATTERY_DRAIN_SCANNER_BASE_PER_SEC,
  BATTERY_DRAIN_SCANNER_PER_LEVEL
} from '../constants/player.js'
import {
  NANOBOT_BATTERY_DRAIN_BASE_PER_SEC,
  NANOBOT_BATTERY_DRAIN_PER_LEVEL,
  NANOBOT_REPAIR_HP_PER_SEC_BASE,
  NANOBOT_REPAIR_HP_PER_LEVEL
} from '../constants/tools.js'

function refuelShip () {
  window.gameState.fuelCurrent = window.gameState.fuelMax ?? PLAYER_FUEL_MAX_DEFAULT
}

function rechargeBattery () {
  window.gameState.batteryCurrent = window.gameState.batteryMax ?? 100
}

function prepareShipForUndock () {
  refuelShip()
  rechargeBattery()
}

function consumeShipFuel (deltaMs, multiplier = 1) {
  const burn = FUEL_BURN_PER_SEC * (deltaMs / 1000) * multiplier

  window.gameState.fuelCurrent = Math.max(0, (window.gameState.fuelCurrent ?? 0) - burn)

  return window.gameState.fuelCurrent > 0
}

function consumeBattery (deltaMs, drainPerSec) {
  const drain = drainPerSec * (deltaMs / 1000)

  window.gameState.batteryCurrent = Math.max(0, (window.gameState.batteryCurrent ?? 0) - drain)

  return window.gameState.batteryCurrent > 0
}

function getScannerBatteryDrainRate (scannerLevel) {
  return BATTERY_DRAIN_SCANNER_BASE_PER_SEC + (scannerLevel * BATTERY_DRAIN_SCANNER_PER_LEVEL)
}

function getNanobotBatteryDrainRate (nanobotLevel) {
  const level = Math.max(0, nanobotLevel ?? 0)

  if (level <= 0) {
    return 0
  }

  return NANOBOT_BATTERY_DRAIN_BASE_PER_SEC + (level * NANOBOT_BATTERY_DRAIN_PER_LEVEL)
}

function getNanobotRepairRate (nanobotLevel) {
  const level = Math.max(0, nanobotLevel ?? 0)

  if (level <= 0) {
    return 0
  }

  return NANOBOT_REPAIR_HP_PER_SEC_BASE + (level * NANOBOT_REPAIR_HP_PER_LEVEL)
}

export {
  refuelShip,
  rechargeBattery,
  prepareShipForUndock,
  consumeShipFuel,
  consumeBattery,
  getScannerBatteryDrainRate,
  getNanobotBatteryDrainRate,
  getNanobotRepairRate
}
