import { Phaser } from '../phaser.js'

import { createParallaxStarfield, renderParallaxStarfield } from '../render/starfield.js'
import { createSimpleMenuButton, layoutDeathScreen, startNewGame } from '../shop/menu.js'
import { getActiveGamepad } from '../input/gamepad.js'
import { pollDirectionalMenuGamepadAction } from '../input/menuNavigation.js'

class DeathScene extends Phaser.Scene {
  constructor () {
    super({
      key: 'death',
      active: false
    })
  }

  create () {
    this.starfield = createParallaxStarfield(this)
    renderParallaxStarfield(this, this.starfield)

    const width = this.scale.width || this.sys.game.canvas.width
    const height = this.scale.height || this.sys.game.canvas.height
    const cx = width / 2
    const cy = height / 2
    const isLostInSpace = window.gameState.deathReason === 'lost'

    this.txtTitle = this.add.text(cx, cy - 80, isLostInSpace ? 'LOST IN SPACE' : 'GAME OVER', {
      fontFamily: 'sans-serif',
      fontSize: 36,
      color: '#dee3e7'
    })
    this.txtTitle.setOrigin(0.5)

    const levelText = isLostInSpace
      ? 'Rescue failed at level ' + window.gameState.level
      : 'Ending Level: ' + window.gameState.level
    this.txtLevel = this.add.text(cx, cy - 28, levelText, {
      fontFamily: 'sans-serif',
      fontSize: 22,
      color: '#c9d3dc'
    })
    this.txtLevel.setOrigin(0.5)

    this.btnNewGame = createSimpleMenuButton(this, cx, cy + 36, 'New Game', () => {
      startNewGame(this)
    }, { focused: true })

    this.deathMenuKeys = this.input.keyboard.addKeys({
      action: Phaser.Input.Keyboard.KeyCodes.ENTER,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE
    })

    this.deathGamepadNavState = { actionWasDown: false }

    this.scale.on('resize', this.onDeathResize, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.onDeathResize, this)
    })
  }

  onDeathResize () {
    layoutDeathScreen(this)
    this.btnNewGame.setFocused(true)
  }

  activateNewGame () {
    startNewGame(this)
  }

  update () {
    renderParallaxStarfield(this, this.starfield)

    if (Phaser.Input.Keyboard.JustDown(this.deathMenuKeys.action) ||
        Phaser.Input.Keyboard.JustDown(this.deathMenuKeys.space)) {
      this.activateNewGame()
    }

    pollDirectionalMenuGamepadAction(getActiveGamepad(this), this.deathGamepadNavState, () => {
      this.activateNewGame()
    })
  }
}

export { DeathScene }
