import { Phaser } from '../phaser.js'
import { createSimpleMenuButton, findMenuSelectionInDirection } from '../shop/menu.js'
import { getActiveGamepad, isGamepadPausePressed } from '../input/gamepad.js'
import {
  pollDirectionalMenuGamepad,
  pollDirectionalMenuGamepadAction
} from '../input/menuNavigation.js'
import { SPACE_BG_COLOR } from '../constants/theme.js'

export const pauseMethods = {
  createPauseMenu () {
    this.selectedPauseButtonIndex = 0
    this.pauseGamepadNavState = { holdMs: 0, lastDirection: null, actionWasDown: false }
    this.gamepadPauseWasDown = false

    const depth = 900
    this.pauseOverlay = this.add.rectangle(0, 0, 10, 10, SPACE_BG_COLOR, 0.74)
    this.pauseOverlay.setScrollFactor(0)
    this.pauseOverlay.setDepth(depth)

    this.pauseTitle = this.add.text(0, 0, 'PAUSED', {
      fontFamily: 'sans-serif',
      fontSize: 38,
      color: '#dee3e7'
    })
    this.pauseTitle.setOrigin(0.5)
    this.pauseTitle.setScrollFactor(0)
    this.pauseTitle.setDepth(depth + 1)

    this.pauseHint = this.add.text(0, 0, 'Esc / P / Start / Select to resume', {
      fontFamily: 'sans-serif',
      fontSize: 14,
      color: '#aeb9c6'
    })
    this.pauseHint.setOrigin(0.5)
    this.pauseHint.setScrollFactor(0)
    this.pauseHint.setDepth(depth + 1)

    this.pauseBtnResume = createSimpleMenuButton(this, 0, 0, 'Resume', () => {
      this.setPaused(false)
    }, { width: 300 })
    this.pauseBtnQuit = createSimpleMenuButton(this, 0, 0, 'Return to Mothership', () => {
      this.quitLevelFromPause()
    }, { width: 300 })
    this.pauseBtnQuit.btn.setFillStyle(0x3a4f66)
    this.pauseBtnQuit.btn.setStrokeStyle(2, 0x8fa6bd, 0.9)

    for (const item of [this.pauseBtnResume, this.pauseBtnQuit]) {
      item.btn.setScrollFactor(0)
      item.text.setScrollFactor(0)
      item.shadow.setScrollFactor(0)
      item.btn.setDepth(depth + 2)
      item.text.setDepth(depth + 3)
      item.shadow.setDepth(depth + 1)
    }

    this.pauseMenuButtons = [this.pauseBtnResume.btn, this.pauseBtnQuit.btn]
    this.pauseMenuItems = [
      this.pauseOverlay,
      this.pauseTitle,
      this.pauseHint,
      this.pauseBtnResume.shadow,
      this.pauseBtnResume.btn,
      this.pauseBtnResume.text,
      this.pauseBtnQuit.shadow,
      this.pauseBtnQuit.btn,
      this.pauseBtnQuit.text
    ]

    this.pauseMenuKeys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      action: Phaser.Input.Keyboard.KeyCodes.ENTER,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE
    })

    this.setPauseMenuVisible(false)
    this.layoutPauseMenu()
    this.applyPauseButtonSelection(this.pauseMenuButtons[this.selectedPauseButtonIndex], true)
  },

  layoutPauseMenu () {
    if (!this.pauseOverlay) {
      return
    }

    const width = this.scale.width || this.sys.game.canvas.width
    const height = this.scale.height || this.sys.game.canvas.height
    const cx = width / 2
    const cy = height / 2

    this.pauseOverlay.setPosition(cx, cy)
    this.pauseOverlay.setSize(width, height)
    this.pauseTitle.setPosition(cx, cy - 118)
    this.pauseHint.setPosition(cx, cy + 118)

    this.pauseBtnResume.btn.setPosition(cx, cy - 24)
    this.pauseBtnResume.text.setPosition(cx, cy - 24)
    this.pauseBtnResume.shadow.setPosition(cx + 2, cy - 21)

    this.pauseBtnQuit.btn.setPosition(cx, cy + 44)
    this.pauseBtnQuit.text.setPosition(cx, cy + 44)
    this.pauseBtnQuit.shadow.setPosition(cx + 2, cy + 47)
  },

  setPauseMenuVisible (visible) {
    for (const item of this.pauseMenuItems ?? []) {
      item.setVisible(visible)
    }
  },

  applyPauseButtonSelection (btn, selected) {
    const isQuit = btn === this.pauseBtnQuit.btn
    if (selected) {
      btn.setStrokeStyle(3, 0xd6ecff, 1)
      btn.setFillStyle(isQuit ? 0x4d6580 : 0x3f7b49)
      return
    }

    btn.setStrokeStyle(2, isQuit ? 0x8fa6bd : 0x3f7b49, 0.9)
    btn.setFillStyle(isQuit ? 0x3a4f66 : 0x2b5e35)
  },

  movePauseSelectionDirection (direction) {
    const nextIndex = findMenuSelectionInDirection(
      this.pauseMenuButtons,
      this.selectedPauseButtonIndex,
      direction
    )

    if (nextIndex < 0 || nextIndex === this.selectedPauseButtonIndex) {
      return
    }

    this.applyPauseButtonSelection(this.pauseMenuButtons[this.selectedPauseButtonIndex], false)
    this.selectedPauseButtonIndex = nextIndex
    this.applyPauseButtonSelection(this.pauseMenuButtons[this.selectedPauseButtonIndex], true)
  },

  activatePauseSelection () {
    if (this.selectedPauseButtonIndex === 0) {
      this.setPaused(false)
      return
    }

    this.quitLevelFromPause()
  },

  pollPauseGamepad (delta, pad) {
    pollDirectionalMenuGamepad(delta, pad, this.pauseGamepadNavState, (direction) => {
      this.movePauseSelectionDirection(direction)
    })

    pollDirectionalMenuGamepadAction(pad, this.pauseGamepadNavState, () => {
      this.activatePauseSelection()
    })
  },

  updatePauseMenu (delta, pad) {
    if (Phaser.Input.Keyboard.JustDown(this.pauseMenuKeys.up) || Phaser.Input.Keyboard.JustDown(this.pauseMenuKeys.w)) {
      this.movePauseSelectionDirection('up')
    }
    if (Phaser.Input.Keyboard.JustDown(this.pauseMenuKeys.down) || Phaser.Input.Keyboard.JustDown(this.pauseMenuKeys.s)) {
      this.movePauseSelectionDirection('down')
    }
    if (Phaser.Input.Keyboard.JustDown(this.pauseMenuKeys.left) || Phaser.Input.Keyboard.JustDown(this.pauseMenuKeys.a)) {
      this.movePauseSelectionDirection('left')
    }
    if (Phaser.Input.Keyboard.JustDown(this.pauseMenuKeys.right) || Phaser.Input.Keyboard.JustDown(this.pauseMenuKeys.d)) {
      this.movePauseSelectionDirection('right')
    }
    if (Phaser.Input.Keyboard.JustDown(this.pauseMenuKeys.action) || Phaser.Input.Keyboard.JustDown(this.pauseMenuKeys.space)) {
      this.activatePauseSelection()
    }

    this.pollPauseGamepad(delta, pad)
  },

  setPaused (paused) {
    if (this.isReturningToMothership || this.isShipDestroying || this.isPaused === paused) {
      return
    }

    this.isPaused = paused
    this.setPauseMenuVisible(paused)

    if (paused) {
      this.physics.world.pause()
      this.tweens.pauseAll()
      this.applyPauseButtonSelection(this.pauseMenuButtons[this.selectedPauseButtonIndex], true)
      const pad = getActiveGamepad(this)
      this.gamepadPauseWasDown = isGamepadPausePressed(pad)
      return
    }

    this.physics.world.resume()
    this.tweens.resumeAll()
  },

  togglePause () {
    if (this.isReturningToMothership || this.isShipDestroying) {
      return
    }

    this.setPaused(!this.isPaused)
  },

  quitLevelFromPause () {
    this.isPaused = false
    this.setPauseMenuVisible(false)
    this.physics.world.resume()
    this.tweens.resumeAll()
    this.quitLevel()
  }
}
