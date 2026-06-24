import { describe, it, expect } from 'vitest'
import { getPlayerShipMetrics } from '@/render/player.js'

describe('getPlayerShipMetrics', () => {
  it('centers the physics circle on the container origin', () => {
    const metrics = getPlayerShipMetrics(0.45)

    expect(metrics.half - metrics.bodyOffset).toBe(metrics.bodyRadius)
    expect(metrics.size).toBeCloseTo(31.5, 5)
  })
})
