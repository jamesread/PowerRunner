import { describe, it, expect } from 'vitest'
import {
  refuelShip,
  rechargeBattery,
  prepareShipForUndock,
  consumeShipFuel,
  consumeBattery,
  getScannerBatteryDrainRate,
  getNanobotBatteryDrainRate,
  getNanobotRepairRate
} from '@/state/ship.js'
import { PLAYER_FUEL_MAX_DEFAULT } from '@/constants/player.js'

describe('ship fuel and battery', () => {
  it('refuels and recharges to max on undock prep', () => {
    window.gameState.fuelCurrent = 0
    window.gameState.batteryCurrent = 0

    prepareShipForUndock()

    expect(window.gameState.fuelCurrent).toBe(PLAYER_FUEL_MAX_DEFAULT)
    expect(window.gameState.batteryCurrent).toBe(100)
  })

  it('consumes fuel over time and reports empty tank', () => {
    window.gameState.fuelCurrent = 1

    const hasFuel = consumeShipFuel(1000, 1)

    expect(hasFuel).toBe(false)
    expect(window.gameState.fuelCurrent).toBe(0)
  })

  it('consumes battery over time', () => {
    window.gameState.batteryCurrent = 10

    consumeBattery(500, 20)

    expect(window.gameState.batteryCurrent).toBe(0)
  })

  it('refuel and recharge restore max values after depletion', () => {
    window.gameState.fuelCurrent = 12
    window.gameState.batteryCurrent = 4

    refuelShip()
    rechargeBattery()

    expect(window.gameState.fuelCurrent).toBe(PLAYER_FUEL_MAX_DEFAULT)
    expect(window.gameState.batteryCurrent).toBe(100)
  })
})

describe('getScannerBatteryDrainRate', () => {
  it('scales with scanner level', () => {
    expect(getScannerBatteryDrainRate(0)).toBeLessThan(getScannerBatteryDrainRate(3))
  })
})

describe('nanobot rates', () => {
  it('returns zero drain and repair at level 0', () => {
    expect(getNanobotBatteryDrainRate(0)).toBe(0)
    expect(getNanobotRepairRate(0)).toBe(0)
  })

  it('scales drain and repair with nanobot level', () => {
    expect(getNanobotBatteryDrainRate(5)).toBeGreaterThan(getNanobotBatteryDrainRate(1))
    expect(getNanobotRepairRate(5)).toBeGreaterThan(getNanobotRepairRate(1))
  })

  it('drains battery faster than it restores hull at level 1', () => {
    expect(getNanobotBatteryDrainRate(1)).toBeGreaterThan(getNanobotRepairRate(1) * 5)
  })
})
