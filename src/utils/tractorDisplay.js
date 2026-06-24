import { Phaser } from '../phaser.js'
import { PIXELS_PER_METER } from '../constants/asteroids.js'
import { getBodySpeed } from './grappleDock.js'

const TRACTOR_DISPLAY_SMOOTH_TAU_MS = 175
const TRACTOR_SLOWDOWN_MIN_PCT = 1
const TRACTOR_SLOWDOWN_MIN_DELTA_PX_PER_SEC = 4

function pixelsPerSecToMetersPerSec (speedPxPerSec) {
  return speedPxPerSec / PIXELS_PER_METER
}

function computeTractorSlowdownPct (baselineSpeed, currentSpeed) {
  if (baselineSpeed <= 0) {
    return 0
  }

  const removed = baselineSpeed - currentSpeed
  const ratio = Phaser.Math.Clamp(removed / baselineSpeed, 0, 1)
  return Math.round(ratio * 100)
}

function computeTractorBeamInfluencePct (effectiveness, dist, range) {
  if (range <= 0) {
    return 0
  }

  const falloff = Phaser.Math.Clamp(1 - (dist / range), 0, 1)
  return Math.round(Phaser.Math.Clamp(effectiveness, 0, 1.55) * falloff * 100)
}

function formatTractorSlowdownLabel (deltaPxPerSec, pct) {
  const deltaMps = Math.max(0, Math.round(pixelsPerSecToMetersPerSec(deltaPxPerSec)))
  return `−${deltaMps} m/s (${pct}%)`
}

function formatTractorBeamLabel (deltaPxPerSec, slowdownPct, beamInfluencePct) {
  if (shouldShowTractorSlowdownLabel(deltaPxPerSec, slowdownPct)) {
    return formatTractorSlowdownLabel(deltaPxPerSec, slowdownPct)
  }

  return `Beam ${beamInfluencePct}%`
}

function smoothTractorDisplayValue (prev, next, deltaMs, tauMs = TRACTOR_DISPLAY_SMOOTH_TAU_MS) {
  if (deltaMs <= 0) {
    return next
  }

  const alpha = 1 - Math.exp(-deltaMs / Math.max(1, tauMs))
  return prev + ((next - prev) * alpha)
}

function shouldShowTractorSlowdownLabel (deltaPxPerSec, pct) {
  return pct >= TRACTOR_SLOWDOWN_MIN_PCT ||
    deltaPxPerSec >= TRACTOR_SLOWDOWN_MIN_DELTA_PX_PER_SEC
}

export {
  TRACTOR_DISPLAY_SMOOTH_TAU_MS,
  TRACTOR_SLOWDOWN_MIN_PCT,
  TRACTOR_SLOWDOWN_MIN_DELTA_PX_PER_SEC,
  getBodySpeed,
  computeTractorSlowdownPct,
  computeTractorBeamInfluencePct,
  formatTractorSlowdownLabel,
  formatTractorBeamLabel,
  smoothTractorDisplayValue,
  shouldShowTractorSlowdownLabel,
  pixelsPerSecToMetersPerSec
}
