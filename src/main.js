import { Phaser } from './phaser.js'

import { GameState } from './state/GameState.js'
import { MothershipScene } from './scenes/MothershipScene.js'
import { LevelScene } from './scenes/LevelScene.js'
import { DeathScene } from './scenes/DeathScene.js'

export function main () {
  const config = {
    type: Phaser.AUTO,
    parent: 'gamearea',
    backgroundColor: '#05070d',
    scene: [MothershipScene, LevelScene, DeathScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
      gamepad: true
    },
    autoRound: true,
    audio: {
      disableWebAudio: true
    },
    physics: {
      default: 'arcade',
      arcade: {
        debug: false
      }
    }
  }

  window.gameState = new GameState()
  window.phaserGame = new Phaser.Game(config)
}
