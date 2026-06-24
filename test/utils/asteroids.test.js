import { describe, it, expect } from 'vitest'
import {
  getAsteroidSizeTier,
  isCollectOnlyRadius,
  isCollectOnlyAsteroid,
  isDrillableAsteroid,
  shouldSmallAsteroidDeflectOffLarge,
  getFieldAsteroidSpawnRadius,
  getFractureAvailableSlots,
  shouldShieldDeflectOnly,
  canAsteroidFracture,
  getFractureChildCount,
  getMiningFieldProgress,
  getMiningFieldParams
} from '@/utils/asteroids.js'
import {
  FRAGMENT_RADIUS,
  MEDIUM_RADIUS,
  SMALL_ASTEROID_RADIUS_MAX,
  LARGE_RADIUS,
  HUGE_ASTEROID_RADIUS_MAX,
  ASTEROID_FIELD_MAX_COUNT
} from '@/constants/asteroids.js'
import { clampPointOutsideCircle } from '@/utils/geometry.js'

describe('getAsteroidSizeTier', () => {
  it('classifies fragments as tier 0', () => {
    expect(getAsteroidSizeTier(FRAGMENT_RADIUS)).toBe(0)
  })

  it('classifies medium rocks as tier 1', () => {
    expect(getAsteroidSizeTier(MEDIUM_RADIUS)).toBe(1)
  })

  it('classifies large rocks as tier 2', () => {
    expect(getAsteroidSizeTier(LARGE_RADIUS)).toBe(2)
  })

  it('classifies huge rocks as tier 3', () => {
    expect(getAsteroidSizeTier(HUGE_ASTEROID_RADIUS_MAX)).toBe(3)
  })
})

describe('collect and drill eligibility', () => {
  it('treats only the smallest radius as collect-only', () => {
    expect(isCollectOnlyRadius(FRAGMENT_RADIUS)).toBe(true)
    expect(isCollectOnlyRadius(SMALL_ASTEROID_RADIUS_MAX)).toBe(true)
    expect(isCollectOnlyRadius(MEDIUM_RADIUS)).toBe(false)
  })

  it('allows medium asteroids to be drilled when they have minerals', () => {
    const medium = {
      active: true,
      isFragment: false,
      isHazard: false,
      radius: MEDIUM_RADIUS,
      mineralsTotal: 8,
      mineralsRemaining: 8,
      isDepleted: false
    }

    expect(isDrillableAsteroid(medium)).toBe(true)
    expect(isCollectOnlyAsteroid(medium)).toBe(false)
  })

  it('blocks fragments and depleted rocks from drilling', () => {
    expect(isDrillableAsteroid({
      active: true,
      isFragment: true,
      radius: FRAGMENT_RADIUS,
      mineralsTotal: 0,
      mineralsRemaining: 0
    })).toBe(false)

    expect(isDrillableAsteroid({
      active: true,
      isFragment: false,
      isHazard: false,
      radius: MEDIUM_RADIUS,
      mineralsTotal: 8,
      mineralsRemaining: 0,
      isDepleted: true
    })).toBe(false)
  })
})

describe('shouldSmallAsteroidDeflectOffLarge', () => {
  it('deflects small rocks off medium or large asteroids', () => {
    const small = { active: true, radius: FRAGMENT_RADIUS }
    const large = { active: true, radius: MEDIUM_RADIUS }

    expect(shouldSmallAsteroidDeflectOffLarge(small, large)).toBe(true)
  })

  it('does not deflect medium rocks off large ones', () => {
    const medium = { active: true, radius: MEDIUM_RADIUS }
    const large = { active: true, radius: 50 }

    expect(shouldSmallAsteroidDeflectOffLarge(medium, large)).toBe(false)
  })

  it('returns false for inactive bodies', () => {
    expect(shouldSmallAsteroidDeflectOffLarge(null, { active: true, radius: 40 })).toBe(false)
  })
})

describe('getMiningFieldParams', () => {
  it('includes medium and huge asteroids at level 1', () => {
    const early = getMiningFieldParams(1)

    expect(early.minRadius).toBe(MEDIUM_RADIUS)
    expect(early.maxRadius).toBe(HUGE_ASTEROID_RADIUS_MAX)
  })

  it('returns bigger max fields at level 1 than high levels', () => {
    const early = getMiningFieldParams(1)
    const late = getMiningFieldParams(30)

    expect(early.maxRadius).toBeGreaterThan(late.maxRadius)
    expect(early.minRadius).toBeLessThanOrEqual(early.maxRadius)
  })

  it('clamps progress at 0 for level 1', () => {
    expect(getMiningFieldProgress(1)).toBe(0)
  })
})

describe('getFieldAsteroidSpawnRadius', () => {
  it('returns radii within the requested bounds', () => {
    for (let i = 0; i < 20; i++) {
      const radius = getFieldAsteroidSpawnRadius(MEDIUM_RADIUS, HUGE_ASTEROID_RADIUS_MAX)
      expect(radius).toBeGreaterThanOrEqual(MEDIUM_RADIUS)
      expect(radius).toBeLessThanOrEqual(HUGE_ASTEROID_RADIUS_MAX)
    }
  })
})

describe('shield fracture helpers', () => {
  it('counts the parent slot when computing available fracture slots', () => {
    expect(getFractureAvailableSlots(64, ASTEROID_FIELD_MAX_COUNT)).toBe(1)
    expect(getFractureAvailableSlots(63, ASTEROID_FIELD_MAX_COUNT)).toBe(2)
  })

  it('deflects fragments and smallest non-fracturable rocks on shield hits', () => {
    expect(shouldShieldDeflectOnly({ isFragment: true, radius: FRAGMENT_RADIUS })).toBe(true)
    expect(shouldShieldDeflectOnly({ isFragment: false, radius: FRAGMENT_RADIUS + 3 })).toBe(true)
    expect(shouldShieldDeflectOnly({ isFragment: false, radius: MEDIUM_RADIUS })).toBe(false)
  })

  it('allows medium rocks to fracture even when the field is full', () => {
    const medium = { isFragment: false, isHazard: false, radius: MEDIUM_RADIUS }

    expect(canAsteroidFracture(medium, ASTEROID_FIELD_MAX_COUNT, ASTEROID_FIELD_MAX_COUNT)).toBe(true)
    expect(getFractureChildCount(MEDIUM_RADIUS, false, ASTEROID_FIELD_MAX_COUNT, ASTEROID_FIELD_MAX_COUNT)).toBe(1)
  })

  it('blocks hazard pebbles from fracturing further', () => {
    const hazard = { isFragment: false, isHazard: true, radius: FRAGMENT_RADIUS + 2 }

    expect(canAsteroidFracture(hazard, 0, ASTEROID_FIELD_MAX_COUNT)).toBe(false)
    expect(getFractureChildCount(FRAGMENT_RADIUS + 2, true, 0, ASTEROID_FIELD_MAX_COUNT)).toBe(0)
  })
})

describe('clampPointOutsideCircle', () => {
  it('pushes spawn points outside the shield radius', () => {
    const clamped = clampPointOutsideCircle(100, 0, 20, 0, 0, 230, 16)
    const dist = Math.hypot(clamped.x, clamped.y)

    expect(dist).toBeGreaterThanOrEqual(230 + 20 + 16)
  })

  it('leaves points that are already outside unchanged', () => {
    const clamped = clampPointOutsideCircle(500, 0, 20, 0, 0, 230, 16)

    expect(clamped).toEqual({ x: 500, y: 0 })
  })
})
