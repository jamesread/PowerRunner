import { describe, it, expect } from 'vitest'
import {
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
} from '@/utils/upgrades.js'
import { PLAYER_FUEL_MAX_DEFAULT, BATTERY_FUEL_PER_PCT, BATTERY_DRAIN_GRAPPLE_PER_SEC } from '@/constants/player.js'
import { DRILL_MS_PER_UNIT } from '@/constants/asteroids.js'

describe('capacity upgrades', () => {
  it('starts at default capacities at level 0', () => {
    expect(getFuelCapacityMax(0)).toBe(PLAYER_FUEL_MAX_DEFAULT)
    expect(getBatteryCapacityMax(0)).toBe(100)
    expect(getCargoHoldMax(0)).toBe(50)
  })

  it('increases capacities with level', () => {
    expect(getFuelCapacityMax(3)).toBeGreaterThan(getFuelCapacityMax(1))
    expect(getBatteryCapacityMax(5)).toBeGreaterThan(getBatteryCapacityMax(2))
    expect(getCargoHoldMax(4)).toBeGreaterThan(getCargoHoldMax(1))
  })

  it('clamps drill speed to the configured minimum multiplier', () => {
    expect(getDrillMsPerUnit(0)).toBe(DRILL_MS_PER_UNIT)
    expect(getDrillMsPerUnit(5)).toBe(Math.round(DRILL_MS_PER_UNIT * 0.5))
    expect(getDrillMsPerUnit(99)).toBe(getDrillMsPerUnit(5))
  })
})

describe('supercapacitor recharge efficiency', () => {
  it('uses base fuel cost with no supercapacitors', () => {
    expect(getBatteryRechargeFuelPerPct(0)).toBe(BATTERY_FUEL_PER_PCT)
  })

  it('reduces fuel cost per recharge percent as level increases', () => {
    expect(getBatteryRechargeFuelPerPct(3)).toBeLessThan(getBatteryRechargeFuelPerPct(1))
    expect(getBatteryRechargeFuelPerPct(5)).toBeLessThan(BATTERY_FUEL_PER_PCT * 0.45)
  })
})

describe('grapple upgrades', () => {
  it('improves range, pull, hook speed, and cooldown with level', () => {
    expect(getGrappleMaxRange(3)).toBeGreaterThan(getGrappleMaxRange(0))
    expect(getGrapplePullSpeed(3)).toBeGreaterThan(getGrapplePullSpeed(0))
    expect(getGrappleHookSpeed(3)).toBeGreaterThan(getGrappleHookSpeed(0))
    expect(getGrappleCooldownMs(3)).toBeLessThan(getGrappleCooldownMs(0))
  })

  it('reduces grapple battery drain at higher levels', () => {
    expect(getGrappleBatteryDrainRate(5)).toBeLessThan(BATTERY_DRAIN_GRAPPLE_PER_SEC)
  })
})

describe('drill yield upgrades', () => {
  it('starts at one unit per drill cycle', () => {
    expect(getDrillUnitsPerCycle(0)).toBe(1)
  })

  it('extracts more units per cycle at higher levels', () => {
    expect(getDrillUnitsPerCycle(5)).toBeGreaterThan(getDrillUnitsPerCycle(0))
  })
})
