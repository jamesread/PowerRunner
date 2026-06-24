function drawTractorBeamCone (graphics, originX, originY, heading, range, coneHalfWidth, pulse) {
  const segments = 12
  const perpAngle = heading + (Math.PI / 2)
  const baseAlpha = 0.08 + (pulse * 0.06)
  const cosH = Math.cos(heading)
  const sinH = Math.sin(heading)
  const cosP = Math.cos(perpAngle)
  const sinP = Math.sin(perpAngle)

  for (let i = 0; i < segments; i++) {
    const t0 = i / segments
    const t1 = (i + 1) / segments
    const fade = 1 - (t0 * t0)
    const alpha = baseAlpha * fade
    const widthScale0 = 1 - (t0 * 0.4)
    const widthScale1 = 1 - (t1 * 0.4)
    const w0 = coneHalfWidth * widthScale0
    const w1 = coneHalfWidth * widthScale1

    const x0 = originX + (cosH * range * t0)
    const y0 = originY + (sinH * range * t0)
    const x1 = originX + (cosH * range * t1)
    const y1 = originY + (sinH * range * t1)

    graphics.fillStyle(0x8fcbe8, alpha)
    graphics.fillTriangle(
      x0 + (cosP * w0),
      y0 + (sinP * w0),
      x0 - (cosP * w0),
      y0 - (sinP * w0),
      x1 + (cosP * w1),
      y1 + (sinP * w1)
    )
    graphics.fillTriangle(
      x0 - (cosP * w0),
      y0 - (sinP * w0),
      x1 - (cosP * w1),
      y1 - (sinP * w1),
      x1 + (cosP * w1),
      y1 + (sinP * w1)
    )
  }

  const edgeAlpha = 0.22 + (pulse * 0.18)
  graphics.lineStyle(1.25, 0xd6ecff, edgeAlpha)
  graphics.beginPath()
  graphics.moveTo(originX, originY)
  graphics.lineTo(
    originX + (cosH * range),
    originY + (sinH * range)
  )
  graphics.strokePath()

  graphics.lineStyle(1, 0x8fcbe8, edgeAlpha * 0.55)
  graphics.beginPath()
  graphics.moveTo(originX, originY)
  graphics.lineTo(
    originX + (cosH * range) + (cosP * coneHalfWidth * 0.6),
    originY + (sinH * range) + (sinP * coneHalfWidth * 0.6)
  )
  graphics.moveTo(originX, originY)
  graphics.lineTo(
    originX + (cosH * range) - (cosP * coneHalfWidth * 0.6),
    originY + (sinH * range) - (sinP * coneHalfWidth * 0.6)
  )
  graphics.strokePath()
}

export { drawTractorBeamCone }
