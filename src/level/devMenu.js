import { Phaser } from '../phaser.js'
import { toggleGameFullscreen, getFullscreenLabel, registerFullscreenRefresh } from '../ui/fullscreen.js'

export const devMenuMethods = {
  createDevMenu () {
    this.isDevMenuOpen = false
    this.isPhysicsDebugEnabled = false

    const menuDepth = 600
    const titleStyle = { fontFamily: 'sans-serif', fontSize: 14, color: '#ffffff' }
    const textStyle = { fontFamily: 'sans-serif', fontSize: 13, color: '#d9e1e8' }
    const hintStyle = { fontFamily: 'sans-serif', fontSize: 11, color: '#c9d3dc' }

    this.devMenuBg = this.add.rectangle(12, 46, 280, 144, 0x0f1720, 0.9)
    this.devMenuBg.setOrigin(0, 0)
    this.devMenuBg.setStrokeStyle(1, 0xffffff, 0.3)
    this.devMenuBg.setDepth(menuDepth)

    this.devMenuTitle = this.add.text(22, 54, 'Developer Menu', titleStyle)
    this.devMenuTitle.setDepth(menuDepth + 1)

    this.devToggleBg = this.add.rectangle(22, 80, 260, 32, 0x1f2d3a, 1)
    this.devToggleBg.setOrigin(0, 0)
    this.devToggleBg.setStrokeStyle(1, 0xffffff, 0.2)
    this.devToggleBg.setInteractive({ useHandCursor: true })
    this.devToggleBg.on('pointerdown', () => {
      this.togglePhysicsDebug()
    })
    this.devToggleBg.setDepth(menuDepth + 1)

    this.devToggleText = this.add.text(32, 88, '', textStyle)
    this.devToggleText.setDepth(menuDepth + 2)

    this.devFullscreenToggleBg = this.add.rectangle(22, 118, 260, 32, 0x1f2d3a, 1)
    this.devFullscreenToggleBg.setOrigin(0, 0)
    this.devFullscreenToggleBg.setStrokeStyle(1, 0xffffff, 0.2)
    this.devFullscreenToggleBg.setInteractive({ useHandCursor: true })
    this.devFullscreenToggleBg.on('pointerup', () => {
      toggleGameFullscreen(this)
      this.refreshDevMenu()
    })
    this.devFullscreenToggleBg.setDepth(menuDepth + 1)

    this.devFullscreenToggleText = this.add.text(32, 126, '', textStyle)
    this.devFullscreenToggleText.setDepth(menuDepth + 2)

    this.devMenuHint = this.add.text(22, 158, 'Press F10 to close', hintStyle)
    this.devMenuHint.setDepth(menuDepth + 1)

    this.devMenuItems = [
      this.devMenuBg,
      this.devMenuTitle,
      this.devToggleBg,
      this.devToggleText,
      this.devFullscreenToggleBg,
      this.devFullscreenToggleText,
      this.devMenuHint
    ]

    this.setDevMenuVisible(false)
    this.refreshDevMenu()
    registerFullscreenRefresh(this, this.refreshDevMenu)

    this.keyF10 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F10)
    this.keyF10.on('down', () => {
      this.toggleDevMenu()
    })
  },

  setDevMenuVisible (visible) {
    for (const item of this.devMenuItems) {
      item.setVisible(visible)
    }
  },

  toggleDevMenu () {
    this.isDevMenuOpen = !this.isDevMenuOpen
    this.setDevMenuVisible(this.isDevMenuOpen)
  },

  refreshDevMenu () {
    const stateText = this.isPhysicsDebugEnabled ? 'On' : 'Off'
    this.devToggleText.setText('Physics Debug Indicators: ' + stateText)
    if (this.devFullscreenToggleText) {
      this.devFullscreenToggleText.setText('Fullscreen: ' + getFullscreenLabel(this))
    }
  },

  togglePhysicsDebug () {
    this.isPhysicsDebugEnabled = !this.isPhysicsDebugEnabled

    if (this.isPhysicsDebugEnabled) {
      if (!this.physics.world.debugGraphic) {
        this.physics.world.createDebugGraphic()
      }

      this.physics.world.drawDebug = true

      if (this.physics.world.debugGraphic) {
        this.physics.world.debugGraphic.setVisible(true)
      }
    } else {
      this.physics.world.drawDebug = false

      if (this.physics.world.debugGraphic) {
        this.physics.world.debugGraphic.clear()
        this.physics.world.debugGraphic.setVisible(false)
      }
    }

    this.refreshDevMenu()
  }
}
