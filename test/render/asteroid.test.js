import { describe, it, expect } from 'vitest'
import {
  shadeHexColor,
  getAsteroidColorsForResource,
  getAsteroidMineralCapacity,
  ASTEROID_WOBBLE_MIN,
  ASTEROID_WOBBLE_AMPLITUDE,
  getAsteroidOutlinePoints,
  getAsteroidHullRadius,
  getAsteroidMaxHullRadius,
  getAsteroidInteractionRadius
} from '@/render/asteroid.js'
import { RESOURCE_COLORS } from '@/constants/resources.js'
import { MEDIUM_RADIUS, SMALL_ASTEROID_RADIUS_MAX, LARGE_RADIUS } from '@/constants/asteroids.js'

describe('shadeHexColor', () => {
  it('lightens colors when factor is above 1', () => {
    const base = 0x808080
    const lighter = shadeHexColor(base, 1.5)

    expect(lighter).toBeGreaterThan(base)
  })

  it('darkens colors when factor is below 1', () => {
    const base = 0x808080
    const darker = shadeHexColor(base, 0.5)

    expect(darker).toBeLessThan(base)
  })
})

describe('getAsteroidColorsForResource', () => {
  it('returns palette derived from resource color', () => {
    const colors = getAsteroidColorsForResource('iron')

    expect(colors.base).toBeTruthy()
    expect(colors.edge).toBeLessThan(colors.base)
    expect(colors.crater).toBeGreaterThan(colors.base)
  })

  it('falls back to iron for unknown resources', () => {
    const colors = getAsteroidColorsForResource('unknown')
    const iron = getAsteroidColorsForResource('iron')

    expect(colors.base).toBe(iron.base)
    expect(RESOURCE_COLORS.iron).toBeTruthy()
  })
})

describe('getAsteroidMineralCapacity', () => {
  it('returns zero for hazards and fragments', () => {
    expect(getAsteroidMineralCapacity(30, true, false)).toBe(0)
    expect(getAsteroidMineralCapacity(30, false, true)).toBe(0)
  })

  it('scales minerals with radius for large mineable rocks', () => {
    const capacity = getAsteroidMineralCapacity(MEDIUM_RADIUS + 10, false, false)

    expect(capacity).toBeGreaterThan(4)
  })

  it('gives medium drillable asteroids minerals', () => {
    expect(getAsteroidMineralCapacity(MEDIUM_RADIUS, false, false)).toBeGreaterThan(0)
    expect(getAsteroidMineralCapacity(SMALL_ASTEROID_RADIUS_MAX, false, false)).toBe(0)
  })
})

describe('asteroid hull geometry', () => {
  it('builds outline points around the requested center', () => {
    const points = getAsteroidOutlinePoints(40, 50, MEDIUM_RADIUS, 3)

    expect(points.length).toBe(9)
    expect(points.some((point) => point.x !== 40 || point.y !== 50)).toBe(true)
  })

  it('matches hull radius to the farthest outline vertex', () => {
    const radius = MEDIUM_RADIUS
    const seedOffset = 4.5
    const hullRadius = getAsteroidHullRadius(radius, seedOffset)
    const maxPointDist = Math.max(
      ...getAsteroidOutlinePoints(0, 0, radius, seedOffset).map((point) => Math.hypot(point.x, point.y))
    )

    expect(hullRadius).toBeCloseTo(maxPointDist, 5)
    expect(hullRadius).toBeGreaterThan(radius * ASTEROID_WOBBLE_MIN)
    expect(hullRadius).toBeLessThanOrEqual(radius * (ASTEROID_WOBBLE_MIN + ASTEROID_WOBBLE_AMPLITUDE))
  })

  it('uses the stored hull radius for interaction checks', () => {
    const asteroid = { radius: LARGE_RADIUS, hullRadius: 51, seedOffset: 2 }

    expect(getAsteroidInteractionRadius(asteroid)).toBe(51)
    expect(getAsteroidMaxHullRadius(LARGE_RADIUS)).toBeCloseTo(LARGE_RADIUS * 1.2, 5)
  })
})
