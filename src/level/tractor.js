import { Phaser } from '../phaser.js'
import {
  TRACTOR_BEAM_CONE_RADIANS,
  TRACTOR_SPIN_DAMP_PER_SEC,
  TRACTOR_THRUST_TRANSFER,
  TRACTOR_COLLECT_PULL_MULT,
  TRACTOR_COLLECT_FALLOFF_FLOOR,
  TRACTOR_HOLD_DAMP_MULT,
  TRACTOR_HOLD_REMOTE_DAMP_PER_SEC,
  TRACTOR_HOLD_SURFACE_GAP,
  TRACTOR_HOLD_SPRING_MULT,
  TRACTOR_VELOCITY_MATCH_RATE
} from '../constants/tools.js'
import {
  getTractorBeamRange,
  getTractorBeamPull,
  getTractorEffectiveness,
  getTractorMode,
  getTractorCollectForceMult,
  getTractorTargetPoint,
  getTractorCollectReach,
  isAsteroidInTractorCone
} from '../utils/tools.js'
import { getActiveGamepad, isGamepadTractorHeld } from '../input/gamepad.js'
import { drawTractorBeamCone } from '../render/tractorBeam.js'
import {
  getBodySpeed,
  computeTractorSlowdownPct,
  computeTractorBeamInfluencePct,
  formatTractorBeamLabel,
  smoothTractorDisplayValue
} from '../utils/tractorDisplay.js'
import { getAsteroidInteractionRadius } from '../render/asteroid.js'

export const tractorMethods = {
  ensureTractorSlowdownLabel (asteroid) {
    if (asteroid.tractorSlowdownLabel?.active) {
      return
    }

    asteroid.tractorSlowdownLabel = this.add.text(asteroid.x, asteroid.y - getAsteroidInteractionRadius(asteroid) - 28, '', {
      fontFamily: 'sans-serif',
      fontSize: 12,
      color: '#d6ecff',
      stroke: '#0f1720',
      strokeThickness: 3
    })
    asteroid.tractorSlowdownLabel.setOrigin(0.5, 1)
    asteroid.tractorSlowdownLabel.setDepth(13)
    asteroid.tractorSlowdownLabel.setVisible(false)
  },

  updateTractorSlowdownLabel (asteroid, deltaPxPerSec, pct, beamInfluencePct) {
    this.ensureTractorSlowdownLabel(asteroid)
    asteroid.tractorSlowdownLabel.setPosition(asteroid.x, asteroid.y - getAsteroidInteractionRadius(asteroid) - 28)
    asteroid.tractorSlowdownLabel.setText(formatTractorBeamLabel(deltaPxPerSec, pct, beamInfluencePct))
    asteroid.tractorSlowdownLabel.setVisible(true)
  },

  hideTractorSlowdownLabel (asteroid) {
    if (asteroid?.tractorSlowdownLabel?.active) {
      asteroid.tractorSlowdownLabel.setVisible(false)
    }
  },

  clearTractorSlowdownState (asteroid) {
    if (!asteroid) {
      return
    }

    this.hideTractorSlowdownLabel(asteroid)
    asteroid.tractorBaselineSpeed = undefined
    asteroid.tractorDisplayDelta = undefined
    asteroid.tractorDisplayPct = undefined
    asteroid.tractorDisplayBeamPct = undefined
  },

  updateTractorSlowdownLabels () {
    const tractored = new Set(this.tractoredAsteroids ?? [])

    for (const asteroid of this.asteroids) {
      if (!asteroid?.active) {
        continue
      }

      if (!tractored.has(asteroid)) {
        this.clearTractorSlowdownState(asteroid)
      }
    }
  },

  recordTractorSlowdownSample (asteroid, speedBefore, speedAfter, deltaMs, effectiveness, dist, range) {
    if (asteroid.tractorBaselineSpeed === undefined) {
      asteroid.tractorBaselineSpeed = speedBefore
      asteroid.tractorDisplayDelta = 0
      asteroid.tractorDisplayPct = 0
      asteroid.tractorDisplayBeamPct = 0
    }

    const frameDelta = Math.max(0, speedBefore - speedAfter)
    const pct = computeTractorSlowdownPct(asteroid.tractorBaselineSpeed, speedAfter)
    const beamPct = computeTractorBeamInfluencePct(effectiveness, dist, range)
    const prevDelta = asteroid.tractorDisplayDelta ?? 0
    const prevPct = asteroid.tractorDisplayPct ?? 0
    const prevBeamPct = asteroid.tractorDisplayBeamPct ?? 0

    asteroid.tractorDisplayDelta = smoothTractorDisplayValue(prevDelta, frameDelta, deltaMs)
    asteroid.tractorDisplayPct = smoothTractorDisplayValue(prevPct, pct, deltaMs)
    asteroid.tractorDisplayBeamPct = smoothTractorDisplayValue(prevBeamPct, beamPct, deltaMs)
    this.updateTractorSlowdownLabel(
      asteroid,
      asteroid.tractorDisplayDelta,
      Math.round(asteroid.tractorDisplayPct),
      Math.round(asteroid.tractorDisplayBeamPct)
    )
  },

  dampAsteroidSpin (asteroid, delta, effectiveness) {
    if (!asteroid?.spinTween) {
      return
    }

    const dt = delta / 1000
    const damp = TRACTOR_SPIN_DAMP_PER_SEC * effectiveness
    asteroid.spinTween.timeScale = Math.max(0, asteroid.spinTween.timeScale - (damp * dt))
  },

  applyTractorHoldSeparation (asteroid, pull, dt, control) {
    const cos = Math.cos(this.shipHeading)
    const sin = Math.sin(this.shipHeading)
    const noseOffset = this.playerShipMetrics.noseOffset
    const forwardDist = ((asteroid.x - this.player.x) * cos) + ((asteroid.y - this.player.y) * sin)
    const hullRadius = getAsteroidInteractionRadius(asteroid)
    const minCenterDist = noseOffset + hullRadius + TRACTOR_HOLD_SURFACE_GAP - 1

    if (forwardDist >= minCenterDist) {
      return
    }

    const push = pull * dt * control * 0.75
    asteroid.body.velocity.x -= cos * push
    asteroid.body.velocity.y -= sin * push
  },

  applyTractorVelocityMatch (asteroid, dt, control) {
    const match = Math.min(1, dt * TRACTOR_VELOCITY_MATCH_RATE * control)
    const playerVx = this.player.body?.velocity?.x ?? 0
    const playerVy = this.player.body?.velocity?.y ?? 0

    asteroid.body.velocity.x += (playerVx - asteroid.body.velocity.x) * match
    asteroid.body.velocity.y += (playerVy - asteroid.body.velocity.y) * match
  },

  tryTractorCollectAsteroid (asteroid) {
    if (!asteroid?.active || getTractorMode(asteroid.radius) !== 'collect') {
      return
    }

    const dx = this.player.x - asteroid.x
    const dy = this.player.y - asteroid.y
    const dist = Math.hypot(dx, dy)

    if (dist > getTractorCollectReach(this.playerShipMetrics, getAsteroidInteractionRadius(asteroid))) {
      return
    }

    if (asteroid.isFragment) {
      this.collectFragment(asteroid)
    }
  },

  applyTractorPull (asteroid, range, pull, dt, effectiveness, mode) {
    const hullRadius = getAsteroidInteractionRadius(asteroid)
    const target = getTractorTargetPoint(
      this.player.x,
      this.player.y,
      this.shipHeading,
      this.playerShipMetrics,
      hullRadius,
      mode
    )
    const dx = target.x - asteroid.x
    const dy = target.y - asteroid.y
    const dist = Math.hypot(dx, dy)
    const collectBoost = mode === 'collect' ? getTractorCollectForceMult(asteroid.radius) : 1

    if (dist <= 0.5) {
      if (mode === 'hold') {
        this.applyTractorVelocityMatch(asteroid, dt, Math.max(0.08, effectiveness))
      }
      return
    }

    const nx = dx / dist
    const ny = dy / dist
    const radialVel = (asteroid.body.velocity.x * nx) + (asteroid.body.velocity.y * ny)
    const control = Math.max(0.08, effectiveness) * collectBoost
    const holdDist = target.holdDist

    if (mode === 'hold') {
      this.applyTractorHoldSeparation(asteroid, pull, dt, control)
    }

    if (dist <= holdDist) {
      const dampStrength = Math.min(
        1,
        (mode === 'hold' ? TRACTOR_HOLD_DAMP_MULT : 14) * dt * control
      )

      if (radialVel > 0) {
        asteroid.body.velocity.x -= nx * radialVel * dampStrength
        asteroid.body.velocity.y -= ny * radialVel * dampStrength
      }

      if (mode === 'hold') {
        const tangentX = -ny
        const tangentY = nx
        const tangentialVel = (asteroid.body.velocity.x * tangentX) + (asteroid.body.velocity.y * tangentY)
        const tangDamp = Math.min(1, TRACTOR_HOLD_DAMP_MULT * dt * control)
        asteroid.body.velocity.x -= tangentX * tangentialVel * tangDamp
        asteroid.body.velocity.y -= tangentY * tangentialVel * tangDamp

        if (dist > 1.5) {
          const spring = pull * dt * control * TRACTOR_HOLD_SPRING_MULT
          asteroid.body.velocity.x += nx * spring
          asteroid.body.velocity.y += ny * spring
        }

        this.applyTractorVelocityMatch(asteroid, dt, control)
      }

      if (mode === 'collect') {
        const collectPull = pull * dt * control * TRACTOR_COLLECT_PULL_MULT
        asteroid.body.velocity.x += nx * collectPull
        asteroid.body.velocity.y += ny * collectPull
      }

      return
    }

    const falloff = 1 - (dist / range)
    const approachGap = dist - holdDist
    const forceMult = mode === 'collect' ? TRACTOR_COLLECT_PULL_MULT : 1
    const falloffFloor = mode === 'collect' ? TRACTOR_COLLECT_FALLOFF_FLOOR : 0.2
    const approachRamp = mode === 'collect' ? 52 : 36
    const force = pull * Math.max(falloffFloor, falloff) * dt *
      Math.min(1, approachGap / approachRamp) * control * forceMult

    asteroid.body.velocity.x += nx * force
    asteroid.body.velocity.y += ny * force

    if (mode === 'hold') {
      const holdFalloff = Phaser.Math.Clamp(1 - (dist / range), 0.12, 1)
      const remoteDamp = Math.min(1, control * holdFalloff * dt * TRACTOR_HOLD_REMOTE_DAMP_PER_SEC)
      asteroid.body.velocity.x *= (1 - remoteDamp)
      asteroid.body.velocity.y *= (1 - remoteDamp)
    }
  },

  applyTractorThrustToAsteroid (asteroid, baseThrust, effectiveness) {
    if (!asteroid?.body) {
      return
    }

    const transfer = baseThrust * TRACTOR_THRUST_TRANSFER * Math.max(0.08, effectiveness)
    const cos = Math.cos(this.shipHeading)
    const sin = Math.sin(this.shipHeading)

    if (this.isThrusting) {
      asteroid.body.velocity.x += cos * transfer
      asteroid.body.velocity.y += sin * transfer
    }

    if (this.isReverseThrusting) {
      asteroid.body.velocity.x -= cos * transfer
      asteroid.body.velocity.y -= sin * transfer
    }
  },

  updateTractorBeam (delta) {
    const tractorLevel = window.gameState.tractorBeamLevel ?? 0
    const pad = getActiveGamepad(this)
    this.isTractorBeamActive = tractorLevel > 0 &&
      (this.keyF?.isDown || isGamepadTractorHeld(pad)) &&
      this.grappleState !== 'pulling' &&
      !!this.player
    this.tractoredAsteroids = []

    if (!this.tractorBeamFx) {
      return
    }

    this.tractorBeamFx.clear()
    if (!this.isTractorBeamActive) {
      this.updateTractorSlowdownLabels()
      return
    }

    const range = getTractorBeamRange(tractorLevel)
    const pull = getTractorBeamPull(tractorLevel)
    const dt = delta / 1000
    const baseThrust = window.gameState.playerSpeed * 4 * dt
    const noseOffset = this.playerShipMetrics.noseOffset
    const originX = this.player.x + (Math.cos(this.shipHeading) * noseOffset * 0.4)
    const originY = this.player.y + (Math.sin(this.shipHeading) * noseOffset * 0.4)
    const coneHalfWidth = Math.tan(TRACTOR_BEAM_CONE_RADIANS / 2) * range

    this.tractorBeamPulseTimer += delta
    const pulse = (Math.sin(this.tractorBeamPulseTimer * 0.018) + 1) / 2

    drawTractorBeamCone(
      this.tractorBeamFx,
      originX,
      originY,
      this.shipHeading,
      range,
      coneHalfWidth,
      pulse
    )

    for (const asteroid of this.asteroids) {
      if (!asteroid?.active || !asteroid.body) {
        continue
      }

      if (this.grappleTarget === asteroid && this.grappleState === 'attached') {
        continue
      }

      const dx = asteroid.x - this.player.x
      const dy = asteroid.y - this.player.y
      const dist = Math.hypot(dx, dy)
      const hullRadius = getAsteroidInteractionRadius(asteroid)
      if (!isAsteroidInTractorCone(
        this.player.x,
        this.player.y,
        this.shipHeading,
        asteroid.x,
        asteroid.y,
        hullRadius,
        range
      )) {
        continue
      }

      this.tractoredAsteroids.push(asteroid)
      const mode = getTractorMode(asteroid.radius)
      const effectiveness = getTractorEffectiveness(tractorLevel, asteroid.radius)
      const speedBefore = getBodySpeed(asteroid.body)
      this.applyTractorPull(asteroid, range, pull, dt, effectiveness, mode)
      this.dampAsteroidSpin(asteroid, delta, effectiveness)
      this.tryTractorCollectAsteroid(asteroid)

      if (this.isThrusting || this.isReverseThrusting) {
        this.applyTractorThrustToAsteroid(asteroid, baseThrust, effectiveness)
      }

      const speedAfter = getBodySpeed(asteroid.body)
      this.recordTractorSlowdownSample(asteroid, speedBefore, speedAfter, delta, effectiveness, dist, range)
    }

    this.updateTractorSlowdownLabels()
  }
}
