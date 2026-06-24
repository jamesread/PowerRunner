import { Phaser } from '../phaser.js'
import {
  FUEL_RESCUE_MIN_CLOSURE_SPEED,
  FUEL_RESCUE_FULL_PAUSE_CLOSURE_SPEED,
  FUEL_RESCUE_GRACE_DECAY_MIN,
  DISTRESS_TOW_STEER_ACCEL,
  DISTRESS_TOW_DAMP_RATE
} from '../constants/player.js'

function getDockClosureInfo (playerX, playerY, playerVx, playerVy, dockX, dockY) {
  const dx = dockX - playerX
  const dy = dockY - playerY
  const dist = Math.hypot(dx, dy)

  if (dist <= 0) {
    return { dist: 0, closureRate: 0, approachFactor: 0 }
  }

  const dirX = dx / dist
  const dirY = dy / dist
  const closureRate = (playerVx * dirX) + (playerVy * dirY)

  if (closureRate < FUEL_RESCUE_MIN_CLOSURE_SPEED) {
    return { dist, closureRate, approachFactor: 0 }
  }

  const approachFactor = Phaser.Math.Clamp(
    closureRate / FUEL_RESCUE_FULL_PAUSE_CLOSURE_SPEED,
    0,
    1
  )

  return { dist, closureRate, approachFactor }
}

function getFuelLostGraceDecayMultiplier (approachFactor) {
  return Phaser.Math.Linear(1, FUEL_RESCUE_GRACE_DECAY_MIN, Phaser.Math.Clamp(approachFactor, 0, 1))
}

function getDistressTowStrength (dockDistance, shieldRadius) {
  if (dockDistance > shieldRadius || shieldRadius <= 0) {
    return 0
  }

  const proximity = 1 - (dockDistance / shieldRadius)
  return proximity * proximity
}

function applyDistressTow (player, dockX, dockY, shieldRadius, deltaMs) {
  if (!player?.body) {
    return 0
  }

  const dx = dockX - player.x
  const dy = dockY - player.y
  const dist = Math.hypot(dx, dy)
  const strength = getDistressTowStrength(dist, shieldRadius)

  if (strength <= 0 || dist <= 0) {
    return 0
  }

  const dt = deltaMs / 1000
  const damp = Math.exp(-DISTRESS_TOW_DAMP_RATE * strength * dt)
  player.body.velocity.x *= damp
  player.body.velocity.y *= damp

  const steer = DISTRESS_TOW_STEER_ACCEL * strength * dt
  player.body.velocity.x += (dx / dist) * steer
  player.body.velocity.y += (dy / dist) * steer

  return strength
}

export {
  getDockClosureInfo,
  getFuelLostGraceDecayMultiplier,
  getDistressTowStrength,
  applyDistressTow
}
