import { Phaser } from '../phaser.js'
import { RESOURCE_TYPES } from '../constants/resources.js'
import { getCargoAmount } from '../state/economy.js'
import {
  createHudText,
  syncHudTextBox
} from '../ui/hud.js'
import { createResourceHudBoxes, updateResourceHudBoxes } from '../ui/resourceHud.js'

export const hudMethods = {
  registerLevelResizeHandler () {
    this.scale.on('resize', this.onLevelResize, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.onLevelResize, this)
    })
  },

  onLevelResize () {
    this.updateLevelHudLayout()
    this.updateScannerHudLayout()
    this.layoutPauseMenu()
  },

  getResourceHudEndX () {
    let xOffset = this.resourceHudBoxes?.x ?? 10

    if (this.resourceHudBoxes?.items) {
      for (const resourceKey of RESOURCE_TYPES) {
        const hudItem = this.resourceHudBoxes.items[resourceKey]
        if (hudItem?.label?.hudBox) {
          xOffset = hudItem.label.hudBox.x + hudItem.label.hudBox.width + this.resourceHudBoxes.gap
        }
      }
    }

    return xOffset
  },

  updateLevelHudLayout () {
    if (!this.txtHp || !this.txtCargo || !this.txtLevel) {
      return
    }

    const width = this.scale.width || this.sys.game.canvas.width
    const hudGap = 16
    const hudPaddingX = 12
    const row1Y = 10
    const row2Y = 34

    const hpX = width - 222
    this.txtHp.setPosition(hpX, row1Y)
    syncHudTextBox(this.txtHp)

    if (this.txtFuel) {
      this.txtFuel.setPosition(this.txtHp.hudBox.x, row1Y + 24)
      syncHudTextBox(this.txtFuel)
    }

    if (this.txtBattery) {
      this.txtBattery.setPosition(this.txtHp.hudBox.x, row1Y + 48)
      syncHudTextBox(this.txtBattery)
    }

    this.txtLevel.setPosition(this.getResourceHudEndX() + hudPaddingX, row1Y)
    syncHudTextBox(this.txtLevel)

    const row2Start = (this.resourceHudBoxes?.x ?? 10) + hudPaddingX
    this.txtCargo.setPosition(row2Start, row2Y)
    syncHudTextBox(this.txtCargo)

    if (this.txtCharges) {
      const chargesX = this.txtCargo.hudBox.x + this.txtCargo.hudBox.width + hudGap + hudPaddingX
      this.txtCharges.setPosition(chargesX, row2Y)
      syncHudTextBox(this.txtCharges)
    }
  },

  fixHudToCamera () {
    const hudItems = [
      ...(this.resourceHudBoxes ? Object.values(this.resourceHudBoxes.items).flatMap((item) => [item.label, item.icon, item.label.hudBox]) : []),
      this.txtHp,
      this.txtHp?.hudBox,
      this.txtFuel,
      this.txtFuel?.hudBox,
      this.txtBattery,
      this.txtBattery?.hudBox,
      this.txtCargo,
      this.txtCargo?.hudBox,
      this.txtLevel,
      this.txtLevel?.hudBox,
      this.txtCharges,
      this.txtCharges?.hudBox,
      this.dockNavArrow,
      this.dockNavDistanceBg,
      this.dockNavDistanceText,
      this.scanTargetNav,
      this.scannerChargeBg,
      this.scannerChargeFill,
      this.scannerChargeText,
      ...(this.devMenuItems ?? [])
    ]

    for (const item of hudItems) {
      if (item?.setScrollFactor) {
        item.setScrollFactor(0)
        item.setDepth(500)
      }
    }
  },

  createHud () {
    const textStyle = { color: '#000000', fontSize: 16, fontFamily: 'sans-serif' }

    this.resourceHudBoxes = createResourceHudBoxes(this, 10, 10, { gap: 16, style: textStyle })
    this.txtHp = createHudText(this, 0, 10, 'hull', textStyle, { minWidth: 160 })
    this.txtFuel = createHudText(this, 0, 34, 'fuel', textStyle, { minWidth: 160 })
    this.txtBattery = createHudText(this, 0, 58, 'battery', textStyle, { minWidth: 160 })
    this.txtLevel = createHudText(this, 0, 10, 'lvl', textStyle, { minWidth: 92 })
    this.txtCargo = createHudText(this, 0, 34, 'cargo', textStyle, { minWidth: 110 })
    this.txtCharges = createHudText(this, 0, 34, 'charges', textStyle, { minWidth: 140 })

    this.tweenResourcesChanged = this.tweens.addCounter({
      from: 0,
      to: 1,
      yoyo: true,
      repeat: 0,
      persist: true,
      duration: 100,
      onUpdate: (tween) => {
        if (!this.activeResourcePulseKey || !this.resourceHudBoxes.items[this.activeResourcePulseKey]) {
          return
        }

        this.resourceHudBoxes.items[this.activeResourcePulseKey].label.setFontSize(16 + (3 * tween.getValue()))
      }
    })

    this.tweenHpChanged = this.tweens.addCounter({
      from: 0,
      to: 1,
      yoyo: true,
      repeat: 0,
      persist: true,
      duration: 100,
      onUpdate: (tween) => {
        this.txtHp.setFontSize(16 + (3 * tween.getValue()))

        let r = parseInt((window.gameState.playerCurrentHealth / window.gameState.playerMaxHealth) * 100)
        r = 100 - r
        r = Math.max(10, r)
        r = Math.min(99, r)
        r = '#' + r.toString() + '0000'

        this.txtHp.setColor(r)
      }
    })

    this.tweenFuelChanged = this.tweens.addCounter({
      from: 0,
      to: 1,
      yoyo: true,
      repeat: 0,
      persist: true,
      duration: 100,
      onUpdate: (tween) => {
        if (!this.txtFuel) {
          return
        }

        this.txtFuel.setFontSize(16 + (3 * tween.getValue()))
      }
    })

    this.tweenBatteryChanged = this.tweens.addCounter({
      from: 0,
      to: 1,
      yoyo: true,
      repeat: 0,
      persist: true,
      duration: 100,
      onUpdate: (tween) => {
        if (!this.txtBattery) {
          return
        }

        this.txtBattery.setFontSize(16 + (3 * tween.getValue()))
      }
    })

    this.createDockingNavHud()
    this.createScannerHud()

    updateResourceHudBoxes(this.resourceHudBoxes, getCargoAmount)
    this.updateLevelHudLayout()
  }
}
