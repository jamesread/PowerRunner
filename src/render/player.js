import { Phaser } from '../phaser.js'

function drawPlayerShipIcon (graphics, options = {}) {
  const scale = options.scale ?? 1
  const lineWidth = options.lineWidth ?? 2
  const pincerOpen = Phaser.Math.Clamp(options.pincerOpen ?? 0.3, 0, 1)
  const centered = options.centered === true
  const half = 35 * scale

  const sx = (value) => centered ? (((value - 35) * scale) + half) : (value * scale)
  const sy = (value) => centered ? (((value - 35) * scale) + half) : (value * scale)

  graphics.lineStyle(lineWidth, 0x0f1720, 1)

  graphics.fillStyle(0x3f5773, 1)
  graphics.fillTriangle(sx(35), sy(0), sx(69), sy(60), sx(1), sy(60))
  graphics.strokeTriangle(sx(35), sy(0), sx(69), sy(60), sx(1), sy(60))

  graphics.fillStyle(0x8fcbe8, 1)
  graphics.fillTriangle(sx(35), sy(12), sx(47), sy(40), sx(23), sy(40))

  graphics.fillStyle(0x4a7d55, 1)
  graphics.fillTriangle(sx(1), sy(60), sx(20), sy(46), sx(20), sy(60))
  graphics.fillTriangle(sx(69), sy(60), sx(50), sy(46), sx(50), sy(60))

  graphics.fillStyle(0xd35d5d, 1)
  graphics.fillTriangle(sx(29), sy(60), sx(41), sy(60), sx(35), sy(70))

  // Animated collector pincers near the nose to "catch" small asteroids.
  const pincerSpread = 2 + (pincerOpen * 8)
  const pincerTipY = -8

  graphics.fillStyle(0x9fb0bf, 1)
  graphics.fillTriangle(sx(30), sy(10), sx(34), sy(6), sx(35 - pincerSpread), sy(pincerTipY))
  graphics.fillTriangle(sx(40), sy(10), sx(36), sy(6), sx(35 + pincerSpread), sy(pincerTipY))

  graphics.fillStyle(0xd35d5d, 1)
  graphics.fillRect(sx(33 - pincerSpread), sy(pincerTipY - 1), scale * 3, scale * 3)
  graphics.fillRect(sx(34 + pincerSpread), sy(pincerTipY - 1), scale * 3, scale * 3)
}

const SHIP_DEBRIS_SHARDS = [
  { id: 'hull', localX: 0, localY: 8, launchAngle: -Math.PI / 2, speed: 95, spin: -2.4, fade: 0.55 },
  { id: 'cockpit', localX: 0, localY: -10, launchAngle: -Math.PI / 2 - 0.35, speed: 130, spin: 3.1, fade: 0.7 },
  { id: 'wing-left', localX: -14, localY: 12, launchAngle: Math.PI + 0.4, speed: 110, spin: -3.6, fade: 0.65 },
  { id: 'wing-right', localX: 14, localY: 12, launchAngle: 0.4, speed: 110, spin: 3.6, fade: 0.65 },
  { id: 'engine', localX: 0, localY: 16, launchAngle: Math.PI / 2 + 0.2, speed: 150, spin: 2.2, fade: 0.75 },
  { id: 'pincer-left', localX: -8, localY: -14, launchAngle: -Math.PI / 2 - 0.9, speed: 145, spin: -4.8, fade: 0.85 },
  { id: 'pincer-right', localX: 8, localY: -14, launchAngle: -Math.PI / 2 + 0.9, speed: 145, spin: 4.8, fade: 0.85 },
  { id: 'chunk-a', localX: -6, localY: 4, launchAngle: Math.PI + 0.8, speed: 165, spin: 5.5, fade: 1.1 },
  { id: 'chunk-b', localX: 7, localY: 2, launchAngle: 0.9, speed: 155, spin: -5.2, fade: 1.05 }
]

function drawPlayerShipDebrisShard (graphics, shardId, scale = 0.45) {
  const sx = (value) => (((value - 35) * scale))
  const sy = (value) => (((value - 35) * scale))

  graphics.clear()
  graphics.lineStyle(Math.max(1, scale * 2), 0x0f1720, 1)

  switch (shardId) {
    case 'hull':
      graphics.fillStyle(0x3f5773, 1)
      graphics.fillTriangle(sx(35), sy(0), sx(69), sy(60), sx(1), sy(60))
      graphics.strokeTriangle(sx(35), sy(0), sx(69), sy(60), sx(1), sy(60))
      break
    case 'cockpit':
      graphics.fillStyle(0x8fcbe8, 1)
      graphics.fillTriangle(sx(35), sy(12), sx(47), sy(40), sx(23), sy(40))
      break
    case 'wing-left':
      graphics.fillStyle(0x4a7d55, 1)
      graphics.fillTriangle(sx(1), sy(60), sx(20), sy(46), sx(20), sy(60))
      break
    case 'wing-right':
      graphics.fillStyle(0x4a7d55, 1)
      graphics.fillTriangle(sx(69), sy(60), sx(50), sy(46), sx(50), sy(60))
      break
    case 'engine':
      graphics.fillStyle(0xd35d5d, 1)
      graphics.fillTriangle(sx(29), sy(60), sx(41), sy(60), sx(35), sy(70))
      break
    case 'pincer-left':
      graphics.fillStyle(0x9fb0bf, 1)
      graphics.fillTriangle(sx(30), sy(10), sx(34), sy(6), sx(28), sy(-8))
      graphics.fillStyle(0xd35d5d, 1)
      graphics.fillRect(sx(26), sy(-9), scale * 3, scale * 3)
      break
    case 'pincer-right':
      graphics.fillStyle(0x9fb0bf, 1)
      graphics.fillTriangle(sx(40), sy(10), sx(36), sy(6), sx(42), sy(-8))
      graphics.fillStyle(0xd35d5d, 1)
      graphics.fillRect(sx(37), sy(-9), scale * 3, scale * 3)
      break
    case 'chunk-a':
      graphics.fillStyle(0x6a8499, 1)
      graphics.fillTriangle(sx(28), sy(24), sx(38), sy(30), sx(32), sy(42))
      break
    case 'chunk-b':
      graphics.fillStyle(0x5c7388, 1)
      graphics.fillRect(sx(36), sy(22), scale * 8, scale * 6)
      break
    default:
      graphics.fillStyle(0x9fb0bf, 1)
      graphics.fillCircle(0, 0, scale * 4)
  }
}

function getPlayerShipMetrics (scale = 0.45) {
  const size = 70 * scale
  const half = size / 2
  const bodyRadius = 24
  const bodyOffset = half - bodyRadius

  return {
    scale,
    size,
    half,
    noseOffset: 35 * scale,
    bodyRadius,
    bodyOffset
  }
}

export {
  drawPlayerShipIcon,
  drawPlayerShipDebrisShard,
  getPlayerShipMetrics,
  SHIP_DEBRIS_SHARDS
}
