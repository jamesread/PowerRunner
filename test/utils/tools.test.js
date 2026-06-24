import { describe, it, expect } from 'vitest'
import {
  worldDistanceToMeters,
  getTractorBeamRange,
  getTractorBeamPull,
  getTractorPower,
  getTractorMode,
  getTractorEffectiveness,
  getTractorCollectForceMult,
  getTractorTargetPoint,
  getTractorCollectReach,
  getScannerRange,
  getScannerMarkerColor,
  isAsteroidInTractorCone
} from '@/utils/tools.js'
import { FRAGMENT_RADIUS, MEDIUM_RADIUS, SMALL_ASTEROID_RADIUS_MAX, LARGE_RADIUS, HUGE_ASTEROID_RADIUS_MAX } from '@/constants/asteroids.js'
import { PIXELS_PER_METER } from '@/constants/asteroids.js'
import { RESOURCE_COLORS } from '@/constants/resources.js'
import { TRACTOR_HOLD_SURFACE_GAP, TRACTOR_COLLECT_SURFACE_GAP } from '@/constants/tools.js'

describe('worldDistanceToMeters', () => {
  it('converts pixels to meters', () => {
    expect(worldDistanceToMeters(PIXELS_PER_METER * 5)).toBe(5)
  })

  it('never returns negative values', () => {
    expect(worldDistanceToMeters(-10)).toBe(0)
  })
})

describe('tractor and scanner levels', () => {
  it('returns zero range and pull at level 0', () => {
    expect(getTractorBeamRange(0)).toBe(0)
    expect(getTractorBeamPull(0)).toBe(0)
    expect(getScannerRange(0)).toBe(0)
  })

  it('increases tractor range with level', () => {
    expect(getTractorBeamRange(3)).toBeGreaterThan(getTractorBeamRange(1))
  })

  it('clamps tractor level above max', () => {
    expect(getTractorBeamRange(99)).toBe(getTractorBeamRange(5))
  })
})

describe('getTractorMode', () => {
  it('uses collect mode for small asteroids', () => {
    expect(getTractorMode(FRAGMENT_RADIUS)).toBe('collect')
    expect(getTractorMode(SMALL_ASTEROID_RADIUS_MAX)).toBe('collect')
  })

  it('uses hold mode for medium, large, and huge asteroids', () => {
    expect(getTractorMode(MEDIUM_RADIUS)).toBe('hold')
    expect(getTractorMode(LARGE_RADIUS)).toBe('hold')
    expect(getTractorMode(HUGE_ASTEROID_RADIUS_MAX)).toBe('hold')
  })
})

describe('getTractorEffectiveness', () => {
  it('is weaker on larger asteroids', () => {
    const medium = getTractorEffectiveness(3, MEDIUM_RADIUS)
    const large = getTractorEffectiveness(3, LARGE_RADIUS)

    expect(medium).toBeGreaterThan(large)
  })

  it('collects small fragments effectively at level 1', () => {
    expect(getTractorEffectiveness(1, FRAGMENT_RADIUS)).toBeGreaterThanOrEqual(0.85)
  })

  it('pulls fragments harder than small-tier rocks at the edge of collect size', () => {
    expect(getTractorCollectForceMult(FRAGMENT_RADIUS)).toBeGreaterThan(
      getTractorCollectForceMult(SMALL_ASTEROID_RADIUS_MAX)
    )
    expect(getTractorCollectForceMult(FRAGMENT_RADIUS)).toBeGreaterThan(2.3)
  })

  it('holds large asteroids weakly at level 1 but strongly at max level', () => {
    const levelOneLarge = getTractorEffectiveness(1, LARGE_RADIUS)
    const maxLevelLarge = getTractorEffectiveness(5, LARGE_RADIUS)

    expect(levelOneLarge).toBeLessThan(0.35)
    expect(maxLevelLarge).toBeGreaterThan(levelOneLarge * 2)
  })

  it('rewards tractor upgrades with more power', () => {
    expect(getTractorPower(5)).toBeGreaterThan(getTractorPower(1) * 3)
  })
})

describe('getScannerMarkerColor', () => {
  it('uses hazard color for hazard asteroids', () => {
    expect(getScannerMarkerColor({ isHazard: true })).toBe(0xd35d5d)
  })

  it('uses resource color for mineable asteroids', () => {
    expect(getScannerMarkerColor({ resourceType: 'iron' })).toBe(RESOURCE_COLORS.iron)
  })
})

describe('isAsteroidInTractorCone', () => {
  it('accepts asteroids ahead of the ship heading', () => {
    expect(isAsteroidInTractorCone(0, 0, 0, 120, 0, 22, 230)).toBe(true)
  })

  it('rejects asteroids behind the ship heading', () => {
    expect(isAsteroidInTractorCone(0, 0, 0, -120, 0, 22, 230)).toBe(false)
  })

  it('rejects asteroids outside tractor range', () => {
    expect(isAsteroidInTractorCone(0, 0, 0, 900, 0, 22, 230)).toBe(false)
  })
})

describe('getTractorTargetPoint', () => {
  const shipMetrics = { noseOffset: 15.75, bodyRadius: 24 }

  it('holds medium rocks a few pixels off the ship nose', () => {
    const target = getTractorTargetPoint(0, 0, 0, shipMetrics, MEDIUM_RADIUS, 'hold')

    expect(target.centerDist).toBeCloseTo(shipMetrics.noseOffset + MEDIUM_RADIUS + TRACTOR_HOLD_SURFACE_GAP)
    expect(target.x).toBeCloseTo(target.centerDist)
    expect(target.holdDist).toBeLessThan(20)
  })

  it('pulls collectable asteroids toward the ship front center', () => {
    const target = getTractorTargetPoint(0, 0, 0, shipMetrics, FRAGMENT_RADIUS, 'collect')

    expect(target.x).toBeCloseTo(shipMetrics.noseOffset * 0.2)
    expect(target.holdDist).toBeGreaterThan(shipMetrics.bodyRadius)
  })
})
