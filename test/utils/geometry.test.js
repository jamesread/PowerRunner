import { describe, it, expect } from 'vitest'
import {
  rotateAsteroidLocalPoint,
  worldPointToAsteroidLocal,
  isScreenPointVisible
} from '@/utils/geometry.js'

describe('rotateAsteroidLocalPoint', () => {
  it('maps local origin to asteroid center', () => {
    const asteroid = { x: 100, y: 200, angle: 0 }
    const point = rotateAsteroidLocalPoint(asteroid, 0, 0)

    expect(point.x).toBeCloseTo(100)
    expect(point.y).toBeCloseTo(200)
  })

  it('rotates local offsets with asteroid angle', () => {
    const asteroid = { x: 0, y: 0, angle: 90 }
    const point = rotateAsteroidLocalPoint(asteroid, 10, 0)

    expect(point.x).toBeCloseTo(0, 0)
    expect(point.y).toBeCloseTo(10, 0)
  })
})

describe('worldPointToAsteroidLocal', () => {
  it('round-trips with rotateAsteroidLocalPoint', () => {
    const asteroid = { x: 50, y: 75, angle: 33 }
    const local = { x: 12, y: -4 }
    const world = rotateAsteroidLocalPoint(asteroid, local.x, local.y)
    const back = worldPointToAsteroidLocal(asteroid, world.x, world.y)

    expect(back.x).toBeCloseTo(local.x, 5)
    expect(back.y).toBeCloseTo(local.y, 5)
  })
})

describe('isScreenPointVisible', () => {
  it('detects points inside the viewport margin', () => {
    expect(isScreenPointVisible(100, 100, 800, 600, 16)).toBe(true)
    expect(isScreenPointVisible(5, 100, 800, 600, 16)).toBe(false)
  })
})
