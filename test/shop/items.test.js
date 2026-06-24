import { describe, it, expect } from 'vitest'
import {
  ShopItemSpeed,
  ShopItemHealth,
  ShopItemTractorBeam,
  ShopItemRepair,
  ShopItemHullNanobots,
  ShopItemFuelCapacity,
  ShopItemBatteryCapacity,
  ShopItemSupercapacitors,
  ShopItemGrappleWinch,
  ShopItemDrillSpeed,
  ShopItemDrillYield,
  ShopItemCargoHold
} from '@/shop/items.js'

describe('ShopItem prerequisites', () => {
  it('locks tractor beam until speed is purchased', () => {
    const speed = new ShopItemSpeed()
    const tractor = new ShopItemTractorBeam()
    const map = { speed, tractor }

    speed.level = 0
    expect(tractor.isUnlocked(map)).toBe(false)

    speed.level = 1
    expect(tractor.isUnlocked(map)).toBe(true)
  })

  it('returns prerequisite hints for locked items', () => {
    const health = new ShopItemHealth()
    const repair = new ShopItemRepair()
    const map = { health, repair }

    health.level = 0
    expect(repair.getPrerequisiteHint(map)).toContain('Hull Integrity +50')
  })

  it('returns missing prerequisite entries for locked items', () => {
    const speed = new ShopItemSpeed()
    const tractor = new ShopItemTractorBeam()
    const map = { speed, tractor }

    speed.level = 0
    expect(tractor.getMissingPrerequisites(map)).toEqual([
      { techId: 'speed', minLevel: 1, dependency: speed }
    ])
  })
})

describe('ShopItem purchases', () => {
  it('increases player speed on thruster purchase', () => {
    const item = new ShopItemSpeed()
    item.onBuy()
    expect(window.gameState.playerSpeed).toBe(100)
  })

  it('increases tractor level up to the max', () => {
    const item = new ShopItemTractorBeam()
    window.gameState.tractorBeamLevel = 5

    expect(item.canBuy()).toBe(false)
  })

  it('repair cannot be bought at full health', () => {
    const item = new ShopItemRepair()
    window.gameState.playerCurrentHealth = window.gameState.playerMaxHealth

    expect(item.canBuy()).toBe(false)
  })

  it('nanobots require hull upgrades and cap at max level', () => {
    const health = new ShopItemHealth()
    const nanobots = new ShopItemHullNanobots()
    const map = { health, nanobots }

    health.level = 0
    expect(nanobots.isUnlocked(map)).toBe(false)

    health.level = 1
    expect(nanobots.isUnlocked(map)).toBe(true)

    window.gameState.nanobotLevel = 5
    expect(nanobots.canBuy()).toBe(false)
  })

  it('applies capacity and drill upgrades to game state', () => {
    const fuel = new ShopItemFuelCapacity()
    const battery = new ShopItemBatteryCapacity()
    const drill = new ShopItemDrillSpeed()
    const drillYield = new ShopItemDrillYield()
    const cargo = new ShopItemCargoHold()
    const grapple = new ShopItemGrappleWinch()

    window.gameState.fuelCapacityLevel = 0
    window.gameState.batteryCapacityLevel = 0
    window.gameState.drillSpeedLevel = 0
    window.gameState.drillYieldLevel = 0
    window.gameState.cargoHoldLevel = 0
    window.gameState.grappleLevel = 0
    window.gameState.fuelMax = 500
    window.gameState.fuelCurrent = 500
    window.gameState.batteryMax = 100
    window.gameState.batteryCurrent = 100
    window.gameState.cargoMaxUnits = 50

    fuel.onBuy()
    battery.onBuy()
    drill.onBuy()
    drillYield.onBuy()
    cargo.onBuy()
    grapple.onBuy()

    expect(window.gameState.fuelCapacityLevel).toBe(1)
    expect(window.gameState.fuelMax).toBe(600)
    expect(window.gameState.batteryCapacityLevel).toBe(1)
    expect(window.gameState.batteryMax).toBe(120)
    expect(window.gameState.drillSpeedLevel).toBe(1)
    expect(window.gameState.drillYieldLevel).toBe(1)
    expect(window.gameState.cargoHoldLevel).toBe(1)
    expect(window.gameState.cargoMaxUnits).toBe(65)
    expect(window.gameState.grappleLevel).toBe(1)
  })
})
