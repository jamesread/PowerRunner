import { Phaser } from '../phaser.js'

import { DRILL_MS_PER_UNIT } from '../constants/asteroids.js'
import {
  PLAYER_FUEL_MAX_DEFAULT,
  BATTERY_FUEL_PER_PCT,
  BATTERY_DRAIN_GRAPPLE_PER_SEC
} from '../constants/player.js'
import {
  CAPACITY_UPGRADE_MAX_LEVEL,
  FUEL_CAPACITY_BONUS_PER_LEVEL,
  BATTERY_CAPACITY_BONUS_PER_LEVEL,
  CARGO_HOLD_BONUS_PER_LEVEL,
  DRILL_SPEED_REDUCTION_PER_LEVEL,
  DRILL_SPEED_MIN_MULT,
  SUPERCAPACITOR_MAX_LEVEL,
  SUPERCAPACITOR_FUEL_REDUCTION_PER_LEVEL,
  SUPERCAPACITOR_FUEL_MULT_MIN,
  GRAPPLE_UPGRADE_MAX_LEVEL,
  GRAPPLE_RANGE_BY_LEVEL,
  GRAPPLE_PULL_BY_LEVEL,
  GRAPPLE_HOOK_SPEED_BY_LEVEL,
  GRAPPLE_COOLDOWN_MS_BY_LEVEL,
  GRAPPLE_BATTERY_DRAIN_REDUCTION_PER_LEVEL,
  GRAPPLE_BATTERY_DRAIN_MULT_MIN,
  DRILL_YIELD_UNITS_BONUS_PER_LEVEL
} from '../constants/tools.js'

const DEFAULT_BATTERY_MAX = 100
const DEFAULT_CARGO_MAX_UNITS = 50

function clampUpgradeLevel (level, maxLevel) {
  return Phaser.Math.Clamp(level ?? 0, 0, maxLevel)
}

function getFuelCapacityMax (fuelCapacityLevel = 0) {
  const level = clampUpgradeLevel(fuelCapacityLevel, CAPACITY_UPGRADE_MAX_LEVEL)

  return PLAYER_FUEL_MAX_DEFAULT + (level * FUEL_CAPACITY_BONUS_PER_LEVEL)
}

function getBatteryCapacityMax (batteryCapacityLevel = 0) {
  const level = clampUpgradeLevel(batteryCapacityLevel, CAPACITY_UPGRADE_MAX_LEVEL)

  return DEFAULT_BATTERY_MAX + (level * BATTERY_CAPACITY_BONUS_PER_LEVEL)
}

function getCargoHoldMax (cargoHoldLevel = 0) {
  const level = clampUpgradeLevel(cargoHoldLevel, CAPACITY_UPGRADE_MAX_LEVEL)

  return DEFAULT_CARGO_MAX_UNITS + (level * CARGO_HOLD_BONUS_PER_LEVEL)
}

function getDrillMsPerUnit (drillSpeedLevel = 0) {
  const level = clampUpgradeLevel(drillSpeedLevel, CAPACITY_UPGRADE_MAX_LEVEL)
  const speedMult = Math.max(
    DRILL_SPEED_MIN_MULT,
    1 - (level * DRILL_SPEED_REDUCTION_PER_LEVEL)
  )

  return Math.round(DRILL_MS_PER_UNIT * speedMult)
}

function getDrillUnitsPerCycle (drillYieldLevel = 0) {
  const level = clampUpgradeLevel(drillYieldLevel, CAPACITY_UPGRADE_MAX_LEVEL)

  return Math.max(1, Math.round(1 + (level * DRILL_YIELD_UNITS_BONUS_PER_LEVEL)))
}

function getBatteryRechargeFuelPerPct (supercapacitorLevel = 0) {
  const level = clampUpgradeLevel(supercapacitorLevel, SUPERCAPACITOR_MAX_LEVEL)
  const fuelMult = Math.max(
    SUPERCAPACITOR_FUEL_MULT_MIN,
    1 - (level * SUPERCAPACITOR_FUEL_REDUCTION_PER_LEVEL)
  )

  return BATTERY_FUEL_PER_PCT * fuelMult
}

function getGrappleMaxRange (grappleLevel = 0) {
  const level = clampUpgradeLevel(grappleLevel, GRAPPLE_UPGRADE_MAX_LEVEL)

  return GRAPPLE_RANGE_BY_LEVEL[level] ?? GRAPPLE_RANGE_BY_LEVEL[0]
}

function getGrapplePullSpeed (grappleLevel = 0) {
  const level = clampUpgradeLevel(grappleLevel, GRAPPLE_UPGRADE_MAX_LEVEL)

  return GRAPPLE_PULL_BY_LEVEL[level] ?? GRAPPLE_PULL_BY_LEVEL[0]
}

function getGrappleHookSpeed (grappleLevel = 0) {
  const level = clampUpgradeLevel(grappleLevel, GRAPPLE_UPGRADE_MAX_LEVEL)

  return GRAPPLE_HOOK_SPEED_BY_LEVEL[level] ?? GRAPPLE_HOOK_SPEED_BY_LEVEL[0]
}

function getGrappleCooldownMs (grappleLevel = 0) {
  const level = clampUpgradeLevel(grappleLevel, GRAPPLE_UPGRADE_MAX_LEVEL)

  return GRAPPLE_COOLDOWN_MS_BY_LEVEL[level] ?? GRAPPLE_COOLDOWN_MS_BY_LEVEL[0]
}

function getGrappleBatteryDrainRate (grappleLevel = 0) {
  const level = clampUpgradeLevel(grappleLevel, GRAPPLE_UPGRADE_MAX_LEVEL)
  const drainMult = Math.max(
    GRAPPLE_BATTERY_DRAIN_MULT_MIN,
    1 - (level * GRAPPLE_BATTERY_DRAIN_REDUCTION_PER_LEVEL)
  )

  return BATTERY_DRAIN_GRAPPLE_PER_SEC * drainMult
}

export {
  DEFAULT_BATTERY_MAX,
  DEFAULT_CARGO_MAX_UNITS,
  getFuelCapacityMax,
  getBatteryCapacityMax,
  getCargoHoldMax,
  getDrillMsPerUnit,
  getDrillUnitsPerCycle,
  getBatteryRechargeFuelPerPct,
  getGrappleMaxRange,
  getGrapplePullSpeed,
  getGrappleHookSpeed,
  getGrappleCooldownMs,
  getGrappleBatteryDrainRate
}
