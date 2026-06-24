import { describe, it, expect } from 'vitest'
import {
  getResourceAmount,
  addResource,
  getCargoTotal,
  addToCargo,
  transferCargoToResources,
  transferCargoUnit,
  canAffordCost,
  spendCost,
  resetCargo
} from '@/state/economy.js'

describe('economy resources', () => {
  it('reads and updates banked resources', () => {
    expect(getResourceAmount('iron')).toBe(18)
    addResource('iron', 5)
    expect(getResourceAmount('iron')).toBe(23)
  })

  it('checks affordability across all resource types', () => {
    expect(canAffordCost({ iron: 10, helium3: 5, crystal: 2 })).toBe(true)
    expect(canAffordCost({ iron: 999, helium3: 0, crystal: 0 })).toBe(false)
  })

  it('spends costs from the bank', () => {
    spendCost({ iron: 3, helium3: 2, crystal: 1 })

    expect(getResourceAmount('iron')).toBe(15)
    expect(getResourceAmount('helium3')).toBe(8)
    expect(getResourceAmount('crystal')).toBe(3)
  })
})

describe('cargo', () => {
  it('adds cargo until the cap is reached', () => {
    window.gameState.cargoMaxUnits = 5

    expect(addToCargo('iron', 3)).toBe(true)
    expect(getCargoTotal()).toBe(3)
    expect(addToCargo('helium3', 3)).toBe(false)
    expect(getCargoTotal()).toBe(3)
  })

  it('transfers cargo into banked resources and clears cargo', () => {
    addToCargo('iron', 2)
    addToCargo('crystal', 1)

    transferCargoToResources()

    expect(getResourceAmount('iron')).toBe(20)
    expect(getResourceAmount('crystal')).toBe(5)
    expect(getCargoTotal()).toBe(0)
  })

  it('transfers one cargo unit at a time', () => {
    addToCargo('iron', 2)

    expect(transferCargoUnit('iron')).toBe(true)
    expect(getResourceAmount('iron')).toBe(19)
    expect(getCargoTotal()).toBe(1)

    expect(transferCargoUnit('iron')).toBe(true)
    expect(getResourceAmount('iron')).toBe(20)
    expect(getCargoTotal()).toBe(0)

    expect(transferCargoUnit('iron')).toBe(false)
  })

  it('resetCargo clears all cargo slots', () => {
    addToCargo('iron', 1)
    resetCargo()
    expect(getCargoTotal()).toBe(0)
  })
})
