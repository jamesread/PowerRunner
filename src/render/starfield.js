import { SPACE_BG_COLOR, SPACE_ACCENT_COLOR } from '../constants/theme.js'

function createParallaxStarfield (scene, options = {}) {
  const width = scene.scale.width || scene.sys.game.canvas.width
  const height = scene.scale.height || scene.sys.game.canvas.height
  const speedMultiplier = options.speedMultiplier ?? 1
  const layerSpecs = options.layerSpecs ?? [
    { count: 58, speed: 10, minSize: 0.8, maxSize: 1.6, alpha: 0.42 },
    { count: 42, speed: 22, minSize: 1.1, maxSize: 2.1, alpha: 0.62 },
    { count: 28, speed: 38, minSize: 1.4, maxSize: 2.8, alpha: 0.82 }
  ]

  const bg = scene.add.rectangle(0, 0, width, height, SPACE_BG_COLOR, 1)
  bg.setOrigin(0, 0)
  bg.setDepth(-40)

  const starsGraphics = scene.add.graphics()
  starsGraphics.setDepth(-38)

  const stars = []
  let globalIndex = 1
  for (const spec of layerSpecs) {
    for (let i = 0; i < spec.count; i++) {
      const seedX = (Math.sin((globalIndex * 91.7) + 0.3) + 1) / 2
      const seedY = (Math.sin((globalIndex * 57.4) + 1.1) + 1) / 2
      const phase = globalIndex * 0.73
      const wobble = 2 + ((Math.sin(globalIndex * 3.1) + 1) * 4)
      const size = spec.minSize + (((Math.sin(globalIndex * 2.3) + 1) / 2) * (spec.maxSize - spec.minSize))
      const twinkleSpeed = 0.8 + (((Math.sin(globalIndex * 1.7) + 1) / 2) * 1.2)
      const colorPick = ((globalIndex % 5) === 0) ? SPACE_ACCENT_COLOR : 0xf7fbff
      stars.push({
        seedX,
        seedY,
        phase,
        wobble,
        size,
        speed: spec.speed * speedMultiplier,
        parallaxFactor: (spec.speed * speedMultiplier) / 380,
        alpha: spec.alpha,
        twinkleSpeed,
        color: colorPick
      })
      globalIndex++
    }
  }

  return {
    bg,
    width,
    height,
    starsGraphics,
    stars
  }
}

function renderParallaxStarfield (scene, starfield, options = {}) {
  if (!starfield || !starfield.starsGraphics) {
    return
  }

  const width = scene.scale.width || scene.sys.game.canvas.width
  const height = scene.scale.height || scene.sys.game.canvas.height
  starfield.width = width
  starfield.height = height
  if (starfield.bg) {
    starfield.bg.setSize(width, height)
  }

  const movement = options.movement
  const useMovementParallax = !!movement
  if (useMovementParallax) {
    if (starfield.parallaxOffsetX === undefined) {
      starfield.parallaxOffsetX = 0
      starfield.parallaxOffsetY = 0
    }

    const dt = (movement.delta ?? 16) / 1000
    starfield.parallaxOffsetX += movement.vx * dt
    starfield.parallaxOffsetY += movement.vy * dt
  }

  const t = scene.game.loop.time * 0.001
  const heightWrap = starfield.height + 14

  starfield.starsGraphics.clear()
  for (const star of starfield.stars) {
    const wobbleX = Math.sin((t * 0.24) + star.phase) * star.wobble
    let x = (star.seedX * starfield.width) + wobbleX
    let y = star.seedY * starfield.height

    if (useMovementParallax) {
      const factor = star.parallaxFactor ?? 0.08
      x -= starfield.parallaxOffsetX * factor
      y -= starfield.parallaxOffsetY * factor
    } else {
      y += t * star.speed
    }

    x = ((x % starfield.width) + starfield.width) % starfield.width
    y = ((y % heightWrap) + heightWrap) % heightWrap
    const alpha = star.alpha * (0.72 + (0.28 * Math.sin((t * star.twinkleSpeed) + star.phase)))
    starfield.starsGraphics.fillStyle(star.color, alpha)
    starfield.starsGraphics.fillCircle(x, y - 7, star.size)
  }
}

export {
  createParallaxStarfield,
  renderParallaxStarfield
}
