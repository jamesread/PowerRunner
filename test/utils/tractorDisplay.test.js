import { describe, it, expect } from 'vitest'
import {
  computeTractorSlowdownPct,
  computeTractorBeamInfluencePct,
  formatTractorSlowdownLabel,
  formatTractorBeamLabel,
  smoothTractorDisplayValue,
  shouldShowTractorSlowdownLabel,
  pixelsPerSecToMetersPerSec
} from '@/utils/tractorDisplay.js'
import { PIXELS_PER_METER } from '@/constants/asteroids.js'

describe('computeTractorSlowdownPct', () => {
  it('returns zero when baseline speed is zero', () => {
    expect(computeTractorSlowdownPct(0, 40)).toBe(0)
  })

  it('computes percent speed removed since entering the beam', () => {
    expect(computeTractorSlowdownPct(100, 42)).toBe(58)
  })

  it('clamps percent at 100', () => {
    expect(computeTractorSlowdownPct(50, 0)).toBe(100)
    expect(computeTractorSlowdownPct(50, 80)).toBe(0)
  })
})

describe('formatTractorSlowdownLabel', () => {
  it('formats slowdown delta and percent for the overlay', () => {
    expect(formatTractorSlowdownLabel(PIXELS_PER_METER * 7, 58)).toBe('−7 m/s (58%)')
  })

  it('never shows negative meters per second in the label', () => {
    expect(formatTractorSlowdownLabel(-20, 10)).toBe('−0 m/s (10%)')
  })
})

describe('computeTractorBeamInfluencePct', () => {
  it('scales with effectiveness and distance falloff', () => {
    expect(computeTractorBeamInfluencePct(0.41, 150, 230)).toBe(14)
    expect(computeTractorBeamInfluencePct(0.61, 80, 230)).toBeGreaterThan(30)
  })
})

describe('formatTractorBeamLabel', () => {
  it('shows slowdown when the asteroid is being slowed', () => {
    expect(formatTractorBeamLabel(PIXELS_PER_METER * 4, 12, 18)).toBe('−4 m/s (12%)')
  })

  it('shows beam strength while pulling without net slowdown', () => {
    expect(formatTractorBeamLabel(1, 0, 18)).toBe('Beam 18%')
  })
})

describe('smoothTractorDisplayValue', () => {
  it('moves toward the next value over time', () => {
    const smoothed = smoothTractorDisplayValue(0, 100, 175, 175)
    expect(smoothed).toBeGreaterThan(50)
    expect(smoothed).toBeLessThan(100)
  })

  it('returns the next value immediately when delta is zero', () => {
    expect(smoothTractorDisplayValue(12, 40, 0)).toBe(40)
  })
})

describe('shouldShowTractorSlowdownLabel', () => {
  it('shows when percent slowdown is meaningful', () => {
    expect(shouldShowTractorSlowdownLabel(0, 12)).toBe(true)
  })

  it('shows when frame slowdown delta is meaningful', () => {
    expect(shouldShowTractorSlowdownLabel(8, 0)).toBe(true)
  })

  it('hides when both percent and delta are negligible', () => {
    expect(shouldShowTractorSlowdownLabel(1, 0)).toBe(false)
  })
})

describe('pixelsPerSecToMetersPerSec', () => {
  it('converts physics speed into display meters per second', () => {
    expect(pixelsPerSecToMetersPerSec(PIXELS_PER_METER * 3)).toBe(3)
  })
})
