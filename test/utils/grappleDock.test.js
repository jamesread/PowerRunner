import { describe, it, expect } from 'vitest'
import {
  getGrappleDockSmoothing,
  getGrappleRideCollisionDamageScale,
  shouldSkipGrappleRideAsteroidPhysics,
  shouldSkipGrappleDetachAsteroidPhysics,
  getGrappleDockAssistStrength,
  shouldGrappleSoftDockShieldHit
} from '@/utils/grappleDock.js'
import {
  GRAPPLE_SOFT_DOCK_SPEED_MAX,
  GRAPPLE_RIDE_MIN_DAMAGE_SCALE,
  GRAPPLE_DOCK_ASSIST_RADIUS
} from '@/constants/player.js'

describe('grapple dock smoothing', () => {
  it('returns full smoothing at zero speed', () => {
    expect(getGrappleDockSmoothing(0)).toBe(1)
  })

  it('returns no smoothing at or above the soft dock speed cap', () => {
    expect(getGrappleDockSmoothing(GRAPPLE_SOFT_DOCK_SPEED_MAX)).toBe(0)
    expect(getGrappleDockSmoothing(GRAPPLE_SOFT_DOCK_SPEED_MAX + 40)).toBe(0)
  })

  it('scales collision damage down on slow grapple rides', () => {
    expect(getGrappleRideCollisionDamageScale(0)).toBeCloseTo(GRAPPLE_RIDE_MIN_DAMAGE_SCALE)
    expect(getGrappleRideCollisionDamageScale(GRAPPLE_SOFT_DOCK_SPEED_MAX)).toBe(1)
  })

  it('skips physics with the ridden asteroid', () => {
    const asteroid = { active: true }
    expect(shouldSkipGrappleRideAsteroidPhysics('attached', asteroid, asteroid, 0)).toBe(true)
  })

  it('skips physics with a recently detached asteroid during grace', () => {
    const asteroid = { active: true }
    expect(shouldSkipGrappleDetachAsteroidPhysics(400, asteroid, asteroid)).toBe(true)
    expect(shouldSkipGrappleDetachAsteroidPhysics(0, asteroid, asteroid)).toBe(false)
  })

  it('increases dock assist near the port on slow rides', () => {
    const near = getGrappleDockAssistStrength(20, GRAPPLE_DOCK_ASSIST_RADIUS * 0.4)
    const far = getGrappleDockAssistStrength(20, GRAPPLE_DOCK_ASSIST_RADIUS * 1.2)
    expect(near).toBeGreaterThan(0.2)
    expect(far).toBe(0)
  })

  it('allows soft shield docking for slow grapple rides near the port', () => {
    const asteroid = { active: true }
    expect(shouldGrappleSoftDockShieldHit('attached', asteroid, asteroid, 18, 120)).toBe(true)
    expect(shouldGrappleSoftDockShieldHit('attached', asteroid, asteroid, 120, 120)).toBe(false)
  })
})
