import { describe, it, expect } from 'vitest'
import {
  getDockClosureInfo,
  getFuelLostGraceDecayMultiplier,
  getDistressTowStrength
} from '@/utils/fuelRescue.js'
import {
  FUEL_RESCUE_GRACE_DECAY_MIN,
  FUEL_RESCUE_MIN_CLOSURE_SPEED
} from '@/constants/player.js'

describe('fuel rescue helpers', () => {
  it('detects closure toward the docking port', () => {
    const closure = getDockClosureInfo(0, 0, 40, 0, 400, 0)

    expect(closure.dist).toBe(400)
    expect(closure.closureRate).toBe(40)
    expect(closure.approachFactor).toBeGreaterThan(0)
  })

  it('ignores movement away from the dock', () => {
    const closure = getDockClosureInfo(0, 0, -30, 0, 400, 0)

    expect(closure.closureRate).toBe(-30)
    expect(closure.approachFactor).toBe(0)
  })

  it('slows grace decay when gliding toward dock', () => {
    expect(getFuelLostGraceDecayMultiplier(0)).toBe(1)
    expect(getFuelLostGraceDecayMultiplier(1)).toBeCloseTo(FUEL_RESCUE_GRACE_DECAY_MIN, 5)
    expect(getFuelLostGraceDecayMultiplier(0.5)).toBeLessThan(1)
    expect(getFuelLostGraceDecayMultiplier(0.5)).toBeGreaterThan(FUEL_RESCUE_GRACE_DECAY_MIN)
  })

  it('ramps distress tow strength inside the shield', () => {
    expect(getDistressTowStrength(250, 230)).toBe(0)
    expect(getDistressTowStrength(115, 230)).toBeGreaterThan(0)
    expect(getDistressTowStrength(0, 230)).toBe(1)
  })

  it('requires meaningful closure speed before grace relief', () => {
    const closure = getDockClosureInfo(0, 0, FUEL_RESCUE_MIN_CLOSURE_SPEED - 1, 0, 200, 0)

    expect(closure.approachFactor).toBe(0)
  })
})
