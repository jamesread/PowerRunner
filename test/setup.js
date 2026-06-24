import { beforeEach, vi } from 'vitest'
import { GameState } from '@/state/GameState.js'

vi.mock('@/phaser.js', async () => import('./mocks/phaser.js'))

globalThis.window = globalThis

beforeEach(() => {
  window.gameState = new GameState()
})
