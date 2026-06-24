import { describe, it, expect } from 'vitest'
import { GameState } from '@/state/GameState.js'
import { PLAYER_FUEL_MAX_DEFAULT } from '@/constants/player.js'

describe('GameState', () => {
  it('initializes with default run resources and full tanks', () => {
    const state = new GameState()

    expect(state.level).toBe(1)
    expect(state.resources.iron).toBe(18)
    expect(state.fuelCurrent).toBe(PLAYER_FUEL_MAX_DEFAULT)
    expect(state.batteryCurrent).toBe(100)
    expect(state.cargoMaxUnits).toBe(50)
    expect(state.tractorBeamLevel).toBe(0)
    expect(state.nanobotLevel).toBe(0)
  })
})
