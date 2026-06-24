import { Phaser } from '../phaser.js'

import {
  ShopItemSpeed,
  ShopItemHealth,
  ShopItemTractorBeam,
  ShopItemShipScanner,
  ShopItemHullNanobots,
  ShopItemFuelCapacity,
  ShopItemBatteryCapacity,
  ShopItemSupercapacitors,
  ShopItemGrappleWinch,
  ShopItemDrillSpeed,
  ShopItemDrillYield,
  ShopItemCargoHold,
  ShopItemRepair,
  ShopItemExplosiveCharge,
  ShopItemEndGirderCount
} from '../shop/items.js'
import {
  getTechTreeNodePosition,
  findInitialMenuSelectionIndex,
  findMenuSelectionInDirection,
  isMenuButtonNavigable,
  isMenuButtonPurchasable
} from '../shop/menu.js'
import { canAffordCost, spendCost, getCargoTotal, hasCargoRemaining, getResourceAmount } from '../state/economy.js'
import {
  startCargoUnloadAnimation,
  updateCargoUnloadAnimation,
  finishCargoUnloadImmediate,
  isCargoUnloadActive,
  getCargoUnloadProgress
} from '../ui/cargoUnload.js'
import { TECH_TREE_EDGES } from '../constants/techTree.js'
import { RESOURCE_TYPES } from '../constants/resources.js'
import { createParallaxStarfield, renderParallaxStarfield } from '../render/starfield.js'
import { createResourceHudBoxes, updateResourceHudBoxes, setResourceHudCostHighlight, createResourceIcon } from '../ui/resourceHud.js'
import { createHudText, syncHudTextBox, applyHullIntegrityHudStyle } from '../ui/hud.js'
import { buildScreenMothershipLayout, drawMothershipHull } from '../render/mothership.js'
import { drawPlayerShipIcon } from '../render/player.js'
import { getActiveGamepad } from '../input/gamepad.js'
import {
  pollDirectionalMenuGamepad,
  pollDirectionalMenuGamepadAction
} from '../input/menuNavigation.js'
import { toggleGameFullscreen, getFullscreenLabel, registerFullscreenRefresh, isFullscreenAvailable } from '../ui/fullscreen.js'
import { SHIP_UNDOCK_TRANSITION_MS, MOTHERSHIP_APPROACH_X } from '../constants/transitions.js'

class MothershipScene extends Phaser.Scene {
  constructor () {
    super({
      key: 'mothership',
      active: false
    })

    this.shopItems = []
    this.constructShopItem(new ShopItemSpeed())
    this.constructShopItem(new ShopItemHealth())
    this.constructShopItem(new ShopItemTractorBeam())
    this.constructShopItem(new ShopItemShipScanner())
    this.constructShopItem(new ShopItemHullNanobots())
    this.constructShopItem(new ShopItemFuelCapacity())
    this.constructShopItem(new ShopItemBatteryCapacity())
    this.constructShopItem(new ShopItemSupercapacitors())
    this.constructShopItem(new ShopItemGrappleWinch())
    this.constructShopItem(new ShopItemDrillSpeed())
    this.constructShopItem(new ShopItemDrillYield())
    this.constructShopItem(new ShopItemCargoHold())
    this.constructShopItem(new ShopItemRepair())
    this.constructShopItem(new ShopItemExplosiveCharge())
    this.constructShopItem(new ShopItemEndGirderCount())
  }

  getShopItemsByTechId () {
    const map = {}

    for (const item of this.shopItems) {
      const techId = item.getTechId()

      if (techId) {
        map[techId] = item
      }
    }

    return map
  }

  getTechTreeButtonPosition (item) {
    return getTechTreeNodePosition(item.getTechId())
  }

  constructShopItem (i) {
    this.shopItems.push(i)
  }

  create (data = {}) {
    this.menuButtons = null
    this.selectedMenuButtonIndex = -1
    for (const item of this.shopItems) {
      item.button = null
    }

    this.starfield = createParallaxStarfield(this)
    renderParallaxStarfield(this, this.starfield)
    this.createStarbase()
    this.startMothershipThrusters(-1)
    this.createDockedShip()
    this.isLaunching = false
    this.hoveredShopItem = null

    const textStyle = { color: '#000000', fontSize: 16, fontFamily: 'sans-serif' }
    const titleStyle = { color: '#000000', fontSize: 30, fontFamily: 'sans-serif' }

    this.resourceHudBoxes = createResourceHudBoxes(this, 10, 10, { gap: 16, style: textStyle })
    this.txtLevel = createHudText(this, 280, 10, 'Level: 1', textStyle, { minWidth: 92 })
    this.txtHp = createHudText(this, 418, 10, 'hull', textStyle, { minWidth: 160 })
    this.txtCargo = createHudText(this, 120, 44, 'cargo', textStyle, { minWidth: 150 })
    this.txtCargo.setDepth(6)
    this.txtCargo.hudBox.setDepth(5)
    this.cargoUnloadState = null
    this.cargoUnloadPending = hasCargoRemaining()

    this.txtMothershipTitle = createHudText(this, 30, 120, 'Tech Tree', titleStyle, { minWidth: 210, paddingX: 10, paddingY: 6 })

    this.techTreeLinks = this.add.graphics()
    this.techTreeLinks.setDepth(0)

    this.btnNextLevel = this.createGuiButton('Undock', () => { this.onBtnNextLevelClicked() }, {
      region: 'br',
      style: 'good',
      subtitle: 'Next: Level ' + window.gameState.level,
      xOffset: -36,
      launchHover: true
    })

    this.btnFullscreen = this.createGuiButton('Fullscreen', () => {
      toggleGameFullscreen(this)
      this.refreshFullscreenButton()
    }, {
      region: 'bl',
      width: 220,
      subtitle: getFullscreenLabel(this),
      activateOnPointerUp: true
    })

    this.createShopButtons()
    this.registerMothershipResizeHandler()
    this.setupMenuKeyboardControls()
    registerFullscreenRefresh(this, this.refreshFullscreenButton)
    setResourceHudCostHighlight(this.resourceHudBoxes, null)
    this.layoutMothershipHud()
    this.refreshLevelHud()

    if (data.flyIn) {
      this.flyMothershipIn(() => {
        this.flyShipIn(data.fromSceneKey ?? 'level', data.flyInStartX, data.flyInStartY)
      })
    } else {
      if (this.mothershipGraphics) {
        this.mothershipGraphics.setX(0)
      }
      this.ship.setPosition(this.shipDockX, this.shipDockY)
      this.stopShipBooster()
      this.beginCargoUnloadAnimation()
    }

    this.refreshCargoHud()

    if (this.techTreeLinks) {
      this.techTreeLinks.setAlpha(1)
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.stopCargoUnloadAnimation()
    })
  }

  registerMothershipResizeHandler () {
    this.scale.on('resize', this.onMothershipResize, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.onMothershipResize, this)
    })
  }

  onMothershipResize () {
    this.createStarbase()
    this.layoutMothershipHud()
    this.layoutShopTree()
    if (!this.isLaunching && this.ship) {
      this.ship.setPosition(this.shipDockX, this.shipDockY)
    }
    this.layoutCargoHud()
    this.refreshCargoHud()
  }

  layoutMothershipHud () {
    const width = this.scale.width || this.sys.game.canvas.width
    const height = this.scale.height || this.sys.game.canvas.height

    if (this.txtHp) {
      this.txtHp.setPosition(width - 222, 10)
      syncHudTextBox(this.txtHp)
    }

    this.layoutLevelHud()
    this.layoutCargoHud()

    if (this.btnNextLevel) {
      const x = (width - 150) - 36
      const y = height - 50
      this.setButtonPosition(this.btnNextLevel, x, y)
    }

    if (this.btnFullscreen) {
      this.setButtonPosition(this.btnFullscreen, 110, height - 50)
    }
  }

  layoutCargoHud () {
    if (!this.txtCargo) {
      return
    }

    const dockX = this.shipDockX ?? 120
    const dockY = this.shipDockY ?? 120
    const x = dockX - 24
    const y = dockY - 54

    this.txtCargo.setPosition(x, y)
    syncHudTextBox(this.txtCargo)
  }

  layoutLevelHud () {
    if (!this.txtLevel || !this.resourceHudBoxes?.items) {
      return
    }

    let xOffset = this.resourceHudBoxes.x

    for (const resourceKey of RESOURCE_TYPES) {
      const hudItem = this.resourceHudBoxes.items[resourceKey]
      if (hudItem?.label?.hudBox) {
        xOffset = hudItem.label.hudBox.x + hudItem.label.hudBox.width + this.resourceHudBoxes.gap
      }
    }

    this.txtLevel.setPosition(xOffset + 12, 10)
    syncHudTextBox(this.txtLevel)
  }

  refreshLevelHud () {
    if (!this.txtLevel) {
      return
    }

    this.txtLevel.setText('Level: ' + window.gameState.level)
    this.layoutLevelHud()
  }

  refreshCargoHud () {
    if (!this.txtCargo) {
      return
    }

    const cargoTotal = getCargoTotal()
    const maxUnits = window.gameState.cargoMaxUnits
    const unloading = isCargoUnloadActive(this.cargoUnloadState)

    if (cargoTotal <= 0 && !unloading && !this.cargoUnloadPending) {
      this.txtCargo.setVisible(false)
      this.txtCargo.hudBox.setVisible(false)
      return
    }

    this.txtCargo.setVisible(true)
    this.txtCargo.hudBox.setVisible(true)

    if (unloading) {
      const progress = Math.round(getCargoUnloadProgress(this.cargoUnloadState) * 100)
      this.txtCargo.setText('Unloading cargo: ' + cargoTotal + ' / ' + maxUnits + '  (' + progress + '%)')
    } else if (cargoTotal > 0) {
      this.txtCargo.setText('Cargo hold: ' + cargoTotal + ' / ' + maxUnits)
    } else {
      this.txtCargo.setText('Cargo hold: empty')
    }

    syncHudTextBox(this.txtCargo)
    this.layoutCargoHud()
  }

  beginCargoUnloadAnimation () {
    if (!hasCargoRemaining()) {
      this.cargoUnloadPending = false
      this.refreshCargoHud()
      return
    }

    this.stopCargoUnloadAnimation()
    this.cargoUnloadPending = false
    this.cargoUnloadState = startCargoUnloadAnimation(this, {
      resourceHudBoxes: this.resourceHudBoxes,
      onCargoHudUpdate: () => {
        this.refreshCargoHud()
        updateResourceHudBoxes(this.resourceHudBoxes)
        this.refreshShopButtons()
      },
      onComplete: () => {
        this.cargoUnloadState = null
        this.refreshCargoHud()
        updateResourceHudBoxes(this.resourceHudBoxes)
        this.refreshShopButtons()
      }
    })
    this.refreshCargoHud()
  }

  stopCargoUnloadAnimation () {
    if (!this.cargoUnloadState) {
      return
    }

    finishCargoUnloadImmediate(this, this.cargoUnloadState)
    this.cargoUnloadState = null
    this.refreshCargoHud()
    updateResourceHudBoxes(this.resourceHudBoxes)
    this.refreshShopButtons()
  }

  refreshFullscreenButton () {
    if (!this.btnFullscreen) {
      return
    }

    const isEnabled = isFullscreenAvailable(this)
    this.btnFullscreen.isEnabled = isEnabled
    this.btnFullscreen.isPurchasable = isEnabled

    if (this.btnFullscreen.subtitleLabel) {
      this.btnFullscreen.subtitleLabel.setText(getFullscreenLabel(this))
    }

    this.btnFullscreen.updateColors(this.applyColorsFromProps({ style: 'upgrade', isEnabled }))
    this.ensureMenuSelectionValid()
  }

  setButtonPosition (btn, x, y, options = {}) {
    this.layoutGuiButton(btn, x, y, options)
  }

  layoutGuiButton (btn, x, y, options = {}) {
    if (!btn) {
      return
    }

    const selected = options.selected === true
    const hover = options.hover === true
    const lift = selected ? 5 : (hover && btn.launchHover ? 1 : 0)
    const cx = x
    const cy = y - lift
    const halfW = btn.width / 2
    const left = cx - halfW

    btn.setPosition(cx, cy)
    btn.baseX = x
    btn.baseY = y

    if (btn.shadow) {
      btn.shadow.setPosition(cx + (selected ? 3 : 2), cy + (selected ? 6 : 3))
      btn.shadow.setScale(selected ? 1.05 : 1, selected ? 1.06 : 1)
    }

    if (selected) {
      btn.setScale(1.05, 1.06)
    } else {
      btn.setScale(1, 1)
    }

    if (btn.titleLabel) {
      if (btn.showCost) {
        btn.titleLabel.setOrigin(0, 0)
        btn.titleLabel.setPosition(left + 14, cy - 21)
      } else if (btn.subtitleLabel) {
        btn.titleLabel.setOrigin(0.5, 0.5)
        btn.titleLabel.setPosition(cx, cy - 10)
      } else {
        btn.titleLabel.setOrigin(0.5, 0.5)
        btn.titleLabel.setPosition(cx, cy)
      }
    }

    if (btn.subtitleLabel) {
      btn.subtitleLabel.setOrigin(0.5, 0.5)
      btn.subtitleLabel.setPosition(cx, cy + 10)
    }

    if (btn.showCost && btn.costIcons) {
      let iconX = left + 18
      const costY = cy + 10

      for (const resourceKey of RESOURCE_TYPES) {
        const icon = btn.costIcons[resourceKey]
        const text = btn.costValueTexts[resourceKey]

        if (icon?.visible) {
          icon.setPosition(iconX, costY)
          if (text) {
            text.setPosition(iconX + 9, costY - 8)
            iconX += 9 + text.width + 14
          }
        }
      }
    }

    if (btn.lockHintLabel) {
      const padX = 10
      const wrapWidth = Math.max(80, btn.width - (padX * 2))
      btn.lockHintLabel.setOrigin(0, 0)
      btn.lockHintLabel.setPosition(left + padX, cy + 4)
      btn.lockHintLabel.setWordWrapWidth(wrapWidth, true)
      btn.lockHintLabel.setAlign('left')
    }
  }

  setupMenuKeyboardControls () {
    this.menuButtons = this.shopItems.map((item) => item.button).concat([this.btnFullscreen, this.btnNextLevel])
    this.selectedMenuButtonIndex = -1

    for (const btn of this.menuButtons) {
      btn.on('pointerover', () => {
        const idx = this.menuButtons.indexOf(btn)
        if (idx >= 0) {
          this.setSelectedMenuButtonIndex(idx)
        }
      })
      btn.on('pointerout', () => {
        this.validateMenuSelection()
      })
    }

    this.menuKeys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      action: Phaser.Input.Keyboard.KeyCodes.SPACE
    })

    const moveUp = () => { this.moveMenuSelectionDirection('up') }
    const moveDown = () => { this.moveMenuSelectionDirection('down') }
    const moveLeft = () => { this.moveMenuSelectionDirection('left') }
    const moveRight = () => { this.moveMenuSelectionDirection('right') }
    this.menuKeys.up.on('down', moveUp)
    this.menuKeys.left.on('down', moveLeft)
    this.menuKeys.w.on('down', moveUp)
    this.menuKeys.a.on('down', moveLeft)
    this.menuKeys.down.on('down', moveDown)
    this.menuKeys.right.on('down', moveRight)
    this.menuKeys.s.on('down', moveDown)
    this.menuKeys.d.on('down', moveRight)
    this.menuKeys.action.on('down', () => {
      this.activateSelectedMenuButton()
    })

    this.menuGamepadNavState = { holdMs: 0, lastDirection: null, actionWasDown: false }
    this.selectInitialMenuButton()
  }

  pollMenuGamepad (delta) {
    const pad = getActiveGamepad(this)
    if (!pad || this.isLaunching) {
      this.menuGamepadNavState.lastDirection = null
      this.menuGamepadNavState.holdMs = 0
      this.menuGamepadNavState.actionWasDown = false
      return
    }

    pollDirectionalMenuGamepad(delta, pad, this.menuGamepadNavState, (direction) => {
      this.moveMenuSelectionDirection(direction)
    })

    pollDirectionalMenuGamepadAction(pad, this.menuGamepadNavState, () => {
      this.activateSelectedMenuButton()
    })
  }

  moveMenuSelectionDirection (direction) {
    if (!this.menuButtons || this.menuButtons.length === 0) {
      return
    }

    const nextIndex = findMenuSelectionInDirection(
      this.menuButtons,
      this.selectedMenuButtonIndex,
      direction
    )

    if (nextIndex >= 0 && nextIndex !== this.selectedMenuButtonIndex) {
      this.setSelectedMenuButtonIndex(nextIndex)
    }
  }

  setSelectedMenuButtonIndex (nextIndex) {
    if (!this.menuButtons || nextIndex < 0 || nextIndex >= this.menuButtons.length) {
      return
    }

    if (this.selectedMenuButtonIndex >= 0) {
      this.applyMenuSelectionVisual(this.menuButtons[this.selectedMenuButtonIndex], false)
    }

    this.selectedMenuButtonIndex = nextIndex
    const selectedBtn = this.menuButtons[this.selectedMenuButtonIndex]
    this.applyMenuSelectionVisual(selectedBtn, true)
    this.updateSelectedMenuHighlight(selectedBtn)
    this.refreshPrerequisiteHighlights(selectedBtn)
  }

  selectInitialMenuButton () {
    if (!this.menuButtons?.length) {
      return
    }

    const initialIndex = findInitialMenuSelectionIndex(this.menuButtons)

    if (initialIndex >= 0) {
      this.setSelectedMenuButtonIndex(initialIndex)
    }
  }

  validateMenuSelection () {
    if (!this.menuButtons || this.menuButtons.length === 0) {
      return
    }

    this.menuButtons = this.menuButtons.filter((btn) => btn?.active && btn.titleLabel?.active)

    if (this.menuButtons.length === 0) {
      this.selectedMenuButtonIndex = -1
      setResourceHudCostHighlight(this.resourceHudBoxes, null)
      return
    }

    if (this.selectedMenuButtonIndex >= 0) {
      const current = this.menuButtons[this.selectedMenuButtonIndex]

      if (current && isMenuButtonNavigable(current) && current.active && current.titleLabel?.active) {
        this.applyMenuSelectionVisual(current, true)
        this.updateSelectedMenuHighlight(current)
        this.refreshPrerequisiteHighlights(current)
        return
      }
    }

    if (this.selectedMenuButtonIndex >= 0) {
      this.selectedMenuButtonIndex = -1
      setResourceHudCostHighlight(this.resourceHudBoxes, null)
    }
  }

  ensureMenuSelectionValid () {
    this.validateMenuSelection()

    if (this.selectedMenuButtonIndex < 0 && this.menuButtons?.length) {
      this.selectInitialMenuButton()
    }
  }

  updateSelectedMenuHighlight (button) {
    if (button && button.shopItem) {
      this.hoveredShopItem = button.shopItem
      setResourceHudCostHighlight(this.resourceHudBoxes, button.shopItem.getCost())
    } else {
      this.hoveredShopItem = null
      setResourceHudCostHighlight(this.resourceHudBoxes, null)
    }
  }

  refreshPrerequisiteHighlights (focusedBtn) {
    const shopItemsByTechId = this.getShopItemsByTechId()
    const missing = focusedBtn?.shopItem
      ? focusedBtn.shopItem.getMissingPrerequisites(shopItemsByTechId)
      : []
    const missingTechIds = new Set(missing.map((req) => req.techId))
    const focusedIndex = focusedBtn ? this.menuButtons?.indexOf(focusedBtn) ?? -1 : -1

    for (const item of this.shopItems) {
      const btn = item.button
      if (!btn?.active) {
        continue
      }

      const btnIndex = this.menuButtons?.indexOf(btn) ?? -1
      const isFocused = btnIndex === focusedIndex
      const isMissingPrerequisite = missingTechIds.has(item.getTechId())

      btn.isPrerequisiteHighlight = isMissingPrerequisite && !isFocused

      if (isFocused) {
        continue
      }

      if (btn.isPrerequisiteHighlight) {
        if (btn.selectionTween) {
          btn.selectionTween.stop()
          btn.selectionTween.remove()
          btn.selectionTween = null
        }

        btn.setStrokeStyle(3, 0xd83030, 1)
        continue
      }

      if (btnIndex !== focusedIndex && btn.palette) {
        btn.setFillStyle(btn.bgInactive)
        btn.setStrokeStyle(2, btn.palette.border, 0.9)
      }
    }

    if (focusedBtn?.lockHintLabel?.visible &&
        focusedBtn.lockHintLabel.text.startsWith('Requires')) {
      focusedBtn.lockHintLabel.setColor('#d83030')
    }
  }

  applyMenuSelectionVisual (button, isSelected) {
    if (!button?.active || !button.titleLabel?.active) {
      return
    }

    if (button.selectionTween) {
      button.selectionTween.stop()
      button.selectionTween.remove()
      button.selectionTween = null
    }

    const baseX = button.baseX ?? button.x
    const baseY = button.baseY ?? button.y
    const enabled = isMenuButtonPurchasable(button)

    if (isSelected) {
      if (button.palette) {
        button.setFillStyle(button.bgInactive)
      }

      button.setStrokeStyle(enabled ? 4 : 3, 0xffe08a, enabled ? 1 : 0.55)
      button.shadow.setFillStyle(0x121820, 0.35)
      button.shadow.setStrokeStyle(1, 0x000000, 0.25)
      this.layoutGuiButton(button, baseX, baseY, { selected: true })

      if (button.titleLabel) {
        button.titleLabel.setFontSize(18)
        button.titleLabel.setColor(enabled ? '#fff8e7' : '#d7dbe0')
      }

      if (button.subtitleLabel) {
        button.subtitleLabel.setColor(enabled ? '#f6f0c2' : '#d7dbe0')
      }

      if (button.lockHintLabel?.visible && button.lockHintLabel.text.startsWith('Requires')) {
        button.lockHintLabel.setColor('#d83030')
      }

      if (enabled) {
        button.selectionTween = this.tweens.addCounter({
          from: 0,
          to: 1,
          duration: 650,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
          onUpdate: (tween) => {
            const pulse = tween.getValue()
            button.setStrokeStyle(4, 0xffe08a, 0.78 + (pulse * 0.22))
          }
        })
      }

      return
    }

    this.layoutGuiButton(button, baseX, baseY)

    if (button.palette) {
      button.setFillStyle(button.bgInactive)
      button.setStrokeStyle(2, button.palette.border, 0.9)
    }

    button.shadow.setFillStyle(0x121820, 0.35)
    button.shadow.setStrokeStyle(1, 0x000000, 0.25)

    if (button.titleLabel) {
      button.titleLabel.setFontSize(16)
      button.titleLabel.setColor(button.palette?.text ?? '#ffffff')
    }

    if (button.subtitleLabel) {
      button.subtitleLabel.setColor(button.isEnabled ? '#d8e6f3' : '#d7dbe0')
    }

    if (button.lockHintLabel?.visible) {
      button.lockHintLabel.setColor('#9aa3ad')
    }
  }

  activateSelectedMenuButton () {
    if (this.isLaunching) {
      return
    }

    if (!this.menuButtons || this.selectedMenuButtonIndex < 0) {
      return
    }

    const selectedBtn = this.menuButtons[this.selectedMenuButtonIndex]
    if (!selectedBtn || !selectedBtn.activate || !isMenuButtonPurchasable(selectedBtn)) {
      return
    }

    selectedBtn.activate()
  }

  createStarbase () {
    if (!this.mothershipGraphics) {
      this.mothershipGraphics = this.add.graphics()
    }
    const starbase = this.mothershipGraphics
    const width = this.scale.width || this.sys.game.canvas.width
    const height = this.scale.height || this.sys.game.canvas.height
    const layout = buildScreenMothershipLayout(width, height)

    this.stationBaseX = layout.stationBaseX
    this.stationBaseY = layout.stationBaseY
    this.mothershipRightHullX = layout.mothershipRightHullX
    this.mothershipCenterY = layout.mothershipCenterY
    this.dockPortX = layout.dockPortX
    this.dockPortY = layout.dockPortY

    starbase.setDepth(-1)
    drawMothershipHull(starbase, layout)

    if (!this.mothershipBooster) {
      this.mothershipBooster = this.add.graphics()
      this.mothershipBooster.setDepth(-2)
      this.mothershipThrusterActive = false
      this.mothershipThrusterDirection = -1
    }
  }

  startMothershipThrusters (direction = -1) {
    this.mothershipThrusterActive = true
    this.mothershipThrusterDirection = direction
  }

  stopMothershipThrusters () {
    this.mothershipThrusterActive = false
    if (this.mothershipBooster) {
      this.mothershipBooster.clear()
    }
  }

  renderMothershipThrusters () {
    if (!this.mothershipBooster || !this.mothershipGraphics) {
      return
    }

    this.mothershipBooster.clear()
    if (!this.mothershipThrusterActive) {
      return
    }

    const offsetX = this.mothershipGraphics.x
    const engineYs = [this.mothershipCenterY - 48, this.mothershipCenterY, this.mothershipCenterY + 52]
    const outerLen = 14 + Phaser.Math.Between(0, 6)
    const innerLen = outerLen - 6
    const movingLeft = this.mothershipThrusterDirection < 0
    const nozzleX = movingLeft
      ? (this.mothershipRightHullX + offsetX - 4)
      : (this.mothershipRightHullX + offsetX - 40)
    const tipSign = movingLeft ? 1 : -1

    for (const y of engineYs) {
      this.mothershipBooster.fillStyle(0xf36b2b, 0.92)
      this.mothershipBooster.fillTriangle(
        nozzleX,
        y - 5,
        nozzleX,
        y + 5,
        nozzleX + (tipSign * outerLen),
        y
      )

      this.mothershipBooster.fillStyle(0xffd36d, 0.92)
      this.mothershipBooster.fillTriangle(
        nozzleX,
        y - 3,
        nozzleX,
        y + 3,
        nozzleX + (tipSign * innerLen),
        y
      )
    }
  }

  flyMothershipIn (onComplete) {
    if (!this.mothershipGraphics) {
      if (onComplete) {
        onComplete()
      }
      return
    }

    this.mothershipGraphics.setX(320)
    this.tweens.add({
      targets: this.mothershipGraphics,
      x: 0,
      duration: 620,
      ease: 'Sine.Out',
      onComplete: () => {
        if (onComplete) {
          onComplete()
        }
      }
    })
  }

  flyUpgradeButtonsOut (onComplete) {
    const targets = []

    for (const item of this.shopItems) {
      if (!item.button) {
        continue
      }

      targets.push(item.button, item.button.shadow, item.button.titleLabel)

      if (item.button.subtitleLabel) {
        targets.push(item.button.subtitleLabel)
      }

      if (item.button.lockHintLabel) {
        targets.push(item.button.lockHintLabel)
      }

      for (const resourceKey of RESOURCE_TYPES) {
        const icon = item.button.costIcons[resourceKey]
        const text = item.button.costValueTexts[resourceKey]
        if (icon) {
          targets.push(icon)
        }
        if (text) {
          targets.push(text)
        }
      }
    }

    if (targets.length === 0) {
      if (onComplete) {
        onComplete()
      }
      return
    }

    this.tweens.add({
      targets,
      x: '-=420',
      alpha: 0,
      duration: 520,
      ease: 'Sine.In',
      onComplete: () => {
        if (onComplete) {
          onComplete()
        }
      }
    })
  }

  createDockedShip () {
    this.ship = this.add.graphics()
    drawPlayerShipIcon(this.ship, { scale: 1 })
    this.ship.setDepth(2)
    this.shipBooster = this.add.graphics()
    this.shipBooster.setDepth(1)
    this.shipBoosterActive = false

    this.shipDockX = this.dockPortX
    this.shipDockY = this.dockPortY
    this.shipApproachX = MOTHERSHIP_APPROACH_X
  }

  startShipBooster () {
    this.shipBoosterActive = true
  }

  stopShipBooster () {
    this.shipBoosterActive = false

    if (this.shipBooster) {
      this.shipBooster.clear()
    }
  }

  renderShipBooster () {
    if (!this.shipBooster || !this.ship) {
      return
    }

    this.shipBooster.clear()

    if (!this.shipBoosterActive) {
      return
    }

    const baseX = this.ship.x + 35
    const baseY = this.ship.y + 70
    const outerLength = 16 + Phaser.Math.Between(0, 6)
    const innerLength = outerLength - 6
    const sideOuterLength = 10 + Phaser.Math.Between(0, 4)
    const sideInnerLength = sideOuterLength - 4

    this.shipBooster.fillStyle(0xf36b2b, 0.95)
    this.shipBooster.fillTriangle(baseX - 7, baseY, baseX + 7, baseY, baseX, baseY + outerLength)

    this.shipBooster.fillStyle(0xffd36d, 0.95)
    this.shipBooster.fillTriangle(baseX - 4, baseY + 1, baseX + 4, baseY + 1, baseX, baseY + innerLength)

    const leftBaseX = this.ship.x + 20
    const rightBaseX = this.ship.x + 50
    const sideBaseY = this.ship.y + 63

    this.shipBooster.fillStyle(0xf36b2b, 0.9)
    this.shipBooster.fillTriangle(leftBaseX - 4, sideBaseY, leftBaseX + 4, sideBaseY, leftBaseX - 6, sideBaseY + sideOuterLength)
    this.shipBooster.fillTriangle(rightBaseX - 4, sideBaseY, rightBaseX + 4, sideBaseY, rightBaseX + 6, sideBaseY + sideOuterLength)

    this.shipBooster.fillStyle(0xffd36d, 0.9)
    this.shipBooster.fillTriangle(leftBaseX - 2, sideBaseY + 1, leftBaseX + 2, sideBaseY + 1, leftBaseX - 4, sideBaseY + sideInnerLength)
    this.shipBooster.fillTriangle(rightBaseX - 2, sideBaseY + 1, rightBaseX + 2, sideBaseY + 1, rightBaseX + 4, sideBaseY + sideInnerLength)
  }

  flyShipIn (fromSceneKey, startX, startY) {
    const hasCustomStart = Number.isFinite(startX) && Number.isFinite(startY)
    const beginX = hasCustomStart ? startX : this.shipApproachX
    const beginY = hasCustomStart ? startY : this.shipDockY - 18

    this.ship.setPosition(beginX, beginY)

    this.shipLabel = this.add.text(16, 84, 'Arriving from ' + fromSceneKey, {
      fontFamily: 'sans-serif',
      fontSize: 13,
      color: '#304154'
    })
    this.startShipBooster()
    this.renderShipBooster()

    this.tweens.add({
      targets: this.ship,
      x: this.shipDockX,
      y: this.shipDockY,
      duration: SHIP_UNDOCK_TRANSITION_MS,
      ease: 'Sine.InOut',
      onComplete: () => {
        if (this.shipLabel) {
          this.shipLabel.destroy()
          this.shipLabel = null
        }

        this.stopShipBooster()
        this.beginCargoUnloadAnimation()
      }
    })
  }

  flyShipOutAndStartLevel () {
    this.isLaunching = true
    this.stopCargoUnloadAnimation()
    this.btnNextLevel.disableInteractive()
    this.hoveredShopItem = null
    setResourceHudCostHighlight(this.resourceHudBoxes, null)

    for (const item of this.shopItems) {
      if (item.button) {
        item.button.disableInteractive()
      }
    }
    this.startShipBooster()
    let pendingAnimations = 2
    const finishUndock = () => {
      pendingAnimations--
      if (pendingAnimations <= 0) {
        this.scene.start('level', {
          shipTransition: {
            type: 'undock',
            screenX: this.ship.x,
            screenY: this.ship.y
          }
        })
      }
    }

    this.tweens.add({
      targets: this.ship,
      x: (this.sys.game.canvas.width / 2) - 35,
      y: (this.sys.game.canvas.height / 2) - 35,
      duration: SHIP_UNDOCK_TRANSITION_MS,
      ease: 'Sine.InOut',
      onComplete: () => {
        finishUndock()
      }
    })

    this.flyUpgradeButtonsOut(() => {
      finishUndock()
    })

    if (this.techTreeLinks) {
      this.tweens.add({
        targets: this.techTreeLinks,
        alpha: 0,
        duration: 520,
        ease: 'Sine.In'
      })
    }
  }

  onBtnNextLevelClicked () {
    if (this.isLaunching) {
      return
    }

    this.flyShipOutAndStartLevel()
  }

  regionToAbsolute (position) {
    if (typeof (position.x) !== 'undefined') {
      return position
    }

    if (position.region === 'bl') {
      position.x = 110
      position.y = (this.scale.height || this.sys.game.canvas.height) - 50
    }

    if (position.region === 'br') {
      position.x = this.scale.width || this.sys.game.canvas.width
      position.x -= 150
      position.y = (this.scale.height || this.sys.game.canvas.height) - 50
    }

    return position
  }

  applyColorsFromProps (props, btn) {
    if (props.shopVisualState === 'disabled') {
      return {
        inactive: 0x434952,
        hover: 0x4f565f,
        focus: 0x383d44,
        border: 0x727983,
        text: '#a8b0b8'
      }
    }

    if (props.shopVisualState === 'unaffordable') {
      return {
        inactive: 0x6b4428,
        hover: 0x805030,
        focus: 0x57341c,
        border: 0xe8a85a,
        text: '#ffe4c7'
      }
    }

    if (props.shopVisualState === 'available') {
      return {
        inactive: 0x3a4f66,
        hover: 0x4d6580,
        focus: 0x26384d,
        border: 0xd8e3ef,
        text: '#ffffff'
      }
    }

    const isEnabled = props.isEnabled !== false

    if (!isEnabled) {
      return {
        inactive: 0x6d7278,
        hover: 0x6d7278,
        focus: 0x5a5e63,
        border: 0xb8bec6,
        text: '#d7dbe0'
      }
    }

    if (props.style === 'good') {
      return {
        inactive: 0x2b5e35,
        hover: 0x3f7b49,
        focus: 0x214729,
        border: 0xd5e8d7,
        text: '#ffffff'
      }
    }

    return {
      inactive: 0x3a4f66,
      hover: 0x4d6580,
      focus: 0x26384d,
      border: 0xd8e3ef,
      text: '#ffffff'
    }
  }

  createGuiButton (name, onclick, props) {
    const position = this.regionToAbsolute(props)
    const x = position.x + (props.xOffset ?? 0)
    const y = position.y
    const width = props.width ?? 320
    const height = props.height ?? 62
    const showCost = props.showCost === true
    const launchHover = props.launchHover === true
    const left = x - (width / 2)

    const btnShadow = this.add.rectangle(x + 2, y + 3, width, height, 0x121820, 0.35)
    btnShadow.setDepth(0)
    btnShadow.setStrokeStyle(1, 0x000000, 0.25)

    const btn = this.add.rectangle(x, y, width, height, 0x000000)
    btn.setInteractive()
    btn.setDepth(1)
    btn.setStrokeStyle(2, 0xffffff, 0.25)
    btn.baseX = x
    btn.baseY = y
    btn.shadow = btnShadow
    btn.showCost = showCost
    btn.launchHover = launchHover
    btn.isEnabled = true
    btn.isPurchasable = true
    btn.isNavigable = true
    btn.activate = () => {
      if (!isMenuButtonPurchasable(btn)) {
        return
      }
      btn.setFillStyle(btn.bgFocus)
      if (launchHover) {
        btn.setPosition(x, y + 1)
      }
      onclick()
    }

    btn.updateColors = (palette) => {
      btn.palette = palette
      btn.bgInactive = palette.inactive
      btn.bgHover = palette.hover
      btn.bgFocus = palette.focus
      btn.setFillStyle(palette.inactive)
      btn.setStrokeStyle(2, palette.border, 0.9)

      btn.titleLabel.setColor(palette.text)
      if (btn.subtitleLabel) {
        btn.subtitleLabel.setColor(btn.isEnabled ? '#d8e6f3' : '#d7dbe0')
      }
      for (const resourceKey of RESOURCE_TYPES) {
        btn.costValueTexts[resourceKey].setColor(palette.text)
      }
    }

    btn.titleLabel = this.add.text(left + 14, showCost ? (y - 21) : (y - 10), name, {
      fontFamily: 'sans-serif',
      fontSize: 16,
      color: '#ffffff'
    })
    btn.titleLabel.setDepth(2)
    btn.subtitleLabel = null

    if (!showCost && props.subtitle) {
      btn.subtitleLabel = this.add.text(left + 14, y + 9, props.subtitle, {
        fontFamily: 'sans-serif',
        fontSize: 13,
        color: '#d8e6f3'
      })
      btn.subtitleLabel.setDepth(2)
    }

    btn.costIcons = {}
    btn.costValueTexts = {}
    for (const resourceKey of RESOURCE_TYPES) {
      const icon = createResourceIcon(this, resourceKey, left + 18, y + 10, 5)
      icon.setDepth(2)
      btn.costIcons[resourceKey] = icon

      const valueText = this.add.text(left + 28, y + 2, '0', {
        fontFamily: 'sans-serif',
        fontSize: 13,
        color: '#ffffff'
      })
      valueText.setDepth(2)
      btn.costValueTexts[resourceKey] = valueText

      if (!showCost) {
        icon.setVisible(false)
        valueText.setVisible(false)
      }
    }

    btn.updateColors(this.applyColorsFromProps({ ...props, isEnabled: true }))
    this.layoutGuiButton(btn, x, y)

    btn.on('pointerover', () => {
      if (!isMenuButtonNavigable(btn)) {
        return
      }

      const isFocused = this.menuButtons && this.selectedMenuButtonIndex === this.menuButtons.indexOf(btn)
      if (isFocused) {
        return
      }

      btn.setFillStyle(btn.bgHover)
      if (launchHover) {
        btn.setStrokeStyle(2, 0xf6f0c2, 1)
        btn.shadow.setFillStyle(0xe7d57a, 0.28)
        this.layoutGuiButton(btn, btn.baseX, btn.baseY, { hover: true })
      }
    })

    btn.on('pointerout', () => {
      if (!isMenuButtonNavigable(btn)) {
        return
      }

      const isFocused = this.menuButtons && this.selectedMenuButtonIndex === this.menuButtons.indexOf(btn)
      if (isFocused) {
        this.applyMenuSelectionVisual(btn, true)
        return
      }

      btn.setFillStyle(btn.bgInactive)
      if (launchHover) {
        btn.setStrokeStyle(2, btn.palette.border, 0.9)
        btn.shadow.setFillStyle(0x121820, 0.35)
        this.layoutGuiButton(btn, btn.baseX, btn.baseY)
      }
    })

    btn.on('pointerdown', () => {
      if (props.activateOnPointerUp) {
        return
      }
      btn.activate()
    })

    btn.on('pointerup', () => {
      if (props.activateOnPointerUp) {
        btn.activate()
        return
      }

      if (!btn.isEnabled) {
        return
      }

      const isFocused = this.menuButtons && this.selectedMenuButtonIndex === this.menuButtons.indexOf(btn)
      if (isFocused) {
        this.applyMenuSelectionVisual(btn, true)
        return
      }

      btn.setFillStyle(btn.bgInactive)
      if (launchHover) {
        this.layoutGuiButton(btn, btn.baseX, btn.baseY)
      }
    })

    return btn
  }

  createShopButtons () {
    for (const item of this.shopItems) {
      const pos = this.getTechTreeButtonPosition(item)
      const btn = this.createGuiButton('', () => {
        const cost = item.getCost()
        const shopItemsByTechId = this.getShopItemsByTechId()

        if (item.isUnlocked(shopItemsByTechId) && canAffordCost(cost) && item.canBuy()) {
          spendCost(cost)

          if (item.hasLevel()) {
            item.level++
          }
          item.onBuy()
        }

        this.refreshShopButtons()
      }, { x: pos.x, y: pos.y, showCost: true, width: 196, height: 64 })
      btn.shopItem = item
      btn.lockHintLabel = this.add.text(0, 0, '', {
        fontFamily: 'sans-serif',
        fontSize: 10,
        color: '#8a4a42',
        wordWrap: { width: 176, useAdvancedWrap: true }
      })
      btn.lockHintLabel.setOrigin(0, 0)
      btn.lockHintLabel.setDepth(2)
      btn.lockHintLabel.setVisible(false)
      btn.on('pointerover', () => {
        this.hoveredShopItem = item
        setResourceHudCostHighlight(this.resourceHudBoxes, item.getCost())
        if (this.menuButtons) {
          const idx = this.menuButtons.indexOf(btn)
          if (idx >= 0) {
            this.setSelectedMenuButtonIndex(idx)
          }
        }
      })
      btn.on('pointerout', () => {
        if (this.hoveredShopItem === item) {
          this.hoveredShopItem = null
        }
        if (!this.menuButtons || this.selectedMenuButtonIndex < 0) {
          setResourceHudCostHighlight(this.resourceHudBoxes, null)
        }
      })

      item.button = btn
    }

    this.layoutShopTree()
    this.refreshShopButtons()
  }

  layoutShopTree () {
    for (const item of this.shopItems) {
      if (!item.button) {
        continue
      }

      const pos = this.getTechTreeButtonPosition(item)
      this.setButtonPosition(item.button, pos.x, pos.y)
    }

    this.renderTechTreeLinks()
  }

  renderTechTreeLinks () {
    if (!this.techTreeLinks) {
      return
    }

    this.techTreeLinks.clear()
    const shopItemsByTechId = this.getShopItemsByTechId()

    for (const edge of TECH_TREE_EDGES) {
      const fromItem = shopItemsByTechId[edge.from]
      const toItem = shopItemsByTechId[edge.to]

      if (!fromItem?.button || !toItem?.button) {
        continue
      }

      const unlocked = toItem.isUnlocked(shopItemsByTechId)
      const x1 = fromItem.button.x + (fromItem.button.width / 2) - 4
      const y1 = fromItem.button.y
      const x2 = toItem.button.x - (toItem.button.width / 2) + 4
      const y2 = toItem.button.y
      const midX = x1 + ((x2 - x1) * 0.5)

      this.techTreeLinks.lineStyle(2, unlocked ? 0x8fcbe8 : 0x56606b, unlocked ? 0.9 : 0.35)
      this.techTreeLinks.beginPath()
      this.techTreeLinks.moveTo(x1, y1)
      this.techTreeLinks.lineTo(midX, y1)
      this.techTreeLinks.lineTo(midX, y2)
      this.techTreeLinks.lineTo(x2, y2)
      this.techTreeLinks.strokePath()
    }
  }

  refreshShopButtons () {
    const shopItemsByTechId = this.getShopItemsByTechId()

    for (const item of this.shopItems) {
      const cost = item.getCost()
      const isUnlocked = item.isUnlocked(shopItemsByTechId)
      const isAffordable = canAffordCost(cost)
      const canPurchase = item.canBuy()
      const shopVisualState = (!isUnlocked || !canPurchase)
        ? 'disabled'
        : (!isAffordable ? 'unaffordable' : 'available')

      item.button.isPurchasable = shopVisualState === 'available'
      item.button.isNavigable = true
      item.button.isEnabled = item.button.isPurchasable
      item.button.shopVisualState = shopVisualState
      item.button.updateColors(this.applyColorsFromProps({ style: 'upgrade', shopVisualState }))
      if (item.hasLevel()) {
        item.button.titleLabel.setText(item.getName() + '  Lv ' + item.getLevel())
      } else if (item.getTechLevel() > 0) {
        item.button.titleLabel.setText(item.getName() + '  x' + item.getTechLevel())
      } else {
        item.button.titleLabel.setText(item.getName())
      }

      if (item.button.lockHintLabel) {
        let showLockHint = false

        if (!isUnlocked) {
          item.button.lockHintLabel.setText(item.getPrerequisiteHint(shopItemsByTechId))
          item.button.lockHintLabel.setColor('#9aa3ad')
          item.button.lockHintLabel.setVisible(true)
          showLockHint = true
        } else if (!canPurchase) {
          item.button.lockHintLabel.setText('Unavailable')
          item.button.lockHintLabel.setColor('#9aa3ad')
          item.button.lockHintLabel.setVisible(true)
          showLockHint = true
        } else {
          item.button.lockHintLabel.setVisible(false)
        }

        item.button.showLockHint = showLockHint
      }

      for (const resourceKey of RESOURCE_TYPES) {
        const amount = cost[resourceKey] ?? 0
        const icon = item.button.costIcons[resourceKey]
        const text = item.button.costValueTexts[resourceKey]
        const showCost = amount > 0 && (!item.button.showLockHint || shopVisualState === 'unaffordable')

        if (showCost) {
          icon.setVisible(true)
          text.setVisible(true)
          text.setText(String(amount))
          if (shopVisualState === 'unaffordable') {
            const hasEnough = getResourceAmount(resourceKey) >= amount
            text.setColor(hasEnough ? (item.button.palette?.text ?? '#ffe4c7') : '#ffb080')
          } else {
            text.setColor(item.button.palette?.text ?? '#ffffff')
          }
        } else {
          icon.setVisible(false)
          text.setVisible(false)
        }
      }

      this.layoutGuiButton(item.button, item.button.baseX, item.button.baseY)
    }

    this.renderTechTreeLinks()

    if (this.selectedMenuButtonIndex >= 0 && this.menuButtons?.[this.selectedMenuButtonIndex]) {
      this.refreshPrerequisiteHighlights(this.menuButtons[this.selectedMenuButtonIndex])
    }

    if (this.menuButtons?.length) {
      this.ensureMenuSelectionValid()
    }
  }

  update (_, delta) {
    renderParallaxStarfield(this, this.starfield)
    this.pollMenuGamepad(delta)
    this.renderMothershipThrusters()
    updateCargoUnloadAnimation(this, this.cargoUnloadState, delta)
    updateResourceHudBoxes(this.resourceHudBoxes)

    this.txtHp.setText('Hull Integrity: ' + window.gameState.playerCurrentHealth + ' / ' + window.gameState.playerMaxHealth)
    syncHudTextBox(this.txtHp)
    applyHullIntegrityHudStyle(this, this.txtHp, window.gameState.playerCurrentHealth, window.gameState.playerMaxHealth)
    this.refreshLevelHud()
    this.refreshCargoHud()
    this.renderShipBooster()
  }
}

export { MothershipScene }
