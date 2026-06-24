import { Phaser } from '../phaser.js'
import {
  GRAPPLE_SOFT_DOCK_SPEED_MAX,
  GRAPPLE_DOCK_ASSIST_RADIUS,
  GRAPPLE_DOCK_DAMP_RATE,
  GRAPPLE_DOCK_STEER_ACCEL,
  GRAPPLE_RIDE_MIN_DAMAGE_SCALE,
  GRAPPLE_SOFT_COLLISION_SMOOTHING
} from '../constants/player.js'

function getBodySpeed (body) {
  if (!body) {
    return 0
  }

  return Math.hypot(body.velocity?.x ?? 0, body.velocity?.y ?? 0)
}

function getGrappleDockSmoothing (rideSpeed, maxSpeed = GRAPPLE_SOFT_DOCK_SPEED_MAX) {
  if (rideSpeed >= maxSpeed) {
    return 0
  }

  const t = 1 - (rideSpeed / maxSpeed)
  return t * t
}

function getGrappleRideCollisionDamageScale (rideSpeed, maxSpeed = GRAPPLE_SOFT_DOCK_SPEED_MAX) {
  const smoothing = getGrappleDockSmoothing(rideSpeed, maxSpeed)
  return Phaser.Math.Linear(1, GRAPPLE_RIDE_MIN_DAMAGE_SCALE, smoothing)
}

function shouldSkipGrappleDetachAsteroidPhysics (detachGraceMs, detachAsteroid, asteroid) {
  if (detachGraceMs <= 0 || !detachAsteroid?.active || !asteroid?.active) {
    return false
  }

  return asteroid === detachAsteroid
}

function shouldSkipGrappleRideAsteroidPhysics (grappleState, grappleTarget, asteroid, rideSpeed) {
  if (grappleState !== 'attached' || !grappleTarget?.active || !asteroid?.active) {
    return false
  }

  if (asteroid === grappleTarget) {
    return true
  }

  const smoothing = getGrappleDockSmoothing(rideSpeed)
  return smoothing >= GRAPPLE_SOFT_COLLISION_SMOOTHING
}

function getGrappleDockAssistStrength (rideSpeed, dockDistance, assistRadius = GRAPPLE_DOCK_ASSIST_RADIUS) {
  if (dockDistance > assistRadius) {
    return 0
  }

  const smoothing = getGrappleDockSmoothing(rideSpeed)
  if (smoothing <= 0) {
    return 0
  }

  const proximity = 1 - (dockDistance / assistRadius)
  return smoothing * Phaser.Math.Clamp(proximity, 0, 1)
}

function applyGrappleDockAssist (asteroid, dockX, dockY, rideSpeed, deltaMs) {
  const dockDx = dockX - asteroid.x
  const dockDy = dockY - asteroid.y
  const dockDistance = Math.hypot(dockDx, dockDy)
  const assistStrength = getGrappleDockAssistStrength(rideSpeed, dockDistance)

  if (assistStrength <= 0 || !asteroid?.body || dockDistance <= 0) {
    return assistStrength
  }

  const dt = deltaMs / 1000
  const damp = Math.exp(-GRAPPLE_DOCK_DAMP_RATE * assistStrength * dt)
  asteroid.body.velocity.x *= damp
  asteroid.body.velocity.y *= damp

  const steer = GRAPPLE_DOCK_STEER_ACCEL * assistStrength * dt
  asteroid.body.velocity.x += (dockDx / dockDistance) * steer
  asteroid.body.velocity.y += (dockDy / dockDistance) * steer

  return assistStrength
}

function getGrappleShieldRepelScale (rideSpeed, dockDistance, assistRadius = GRAPPLE_DOCK_ASSIST_RADIUS) {
  const assistStrength = getGrappleDockAssistStrength(rideSpeed, dockDistance, assistRadius)
  return Phaser.Math.Clamp(1 - (assistStrength * 0.92), 0.08, 1)
}

function shouldGrappleSoftDockShieldHit (grappleState, grappleTarget, asteroid, rideSpeed, dockDistance) {
  if (grappleState !== 'attached' || grappleTarget !== asteroid) {
    return false
  }

  return getGrappleDockAssistStrength(rideSpeed, dockDistance) >= 0.2
}

export {
  getBodySpeed,
  getGrappleDockSmoothing,
  getGrappleRideCollisionDamageScale,
  shouldSkipGrappleDetachAsteroidPhysics,
  shouldSkipGrappleRideAsteroidPhysics,
  getGrappleDockAssistStrength,
  applyGrappleDockAssist,
  getGrappleShieldRepelScale,
  shouldGrappleSoftDockShieldHit
}
