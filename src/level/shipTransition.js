import { Phaser } from '../phaser.js'
import { drawPlayerShipIcon, getPlayerShipMetrics } from '../render/player.js'
import { worldToScreenPoint } from '../utils/geometry.js'
import { prepareShipForUndock } from '../state/ship.js'
import {
  SHIP_UNDOCK_TRANSITION_MS,
  SHIP_DOCK_APPROACH_MS,
  SHIP_DOCK_EXIT_MS,
  SHIP_TRANSITION_LAUNCH_DISTANCE,
  MOTHERSHIP_APPROACH_X
} from '../constants/transitions.js'

const MOTHERSHIP_SHIP_VISUAL_RADIUS = 35

function getMothershipShipCenterFromTopLeft (x, y) {
  return {
    x: x + MOTHERSHIP_SHIP_VISUAL_RADIUS,
    y: y + MOTHERSHIP_SHIP_VISUAL_RADIUS
  }
}

function getMothershipShipTopLeftFromCenter (x, y) {
  return {
    x: x - MOTHERSHIP_SHIP_VISUAL_RADIUS,
    y: y - MOTHERSHIP_SHIP_VISUAL_RADIUS
  }
}

export const shipTransitionMethods = {
  createTransitionShip (scale) {
    const metrics = getPlayerShipMetrics(scale)
    const container = this.add.container(0, 0)
    const graphics = this.add.graphics()
    drawPlayerShipIcon(graphics, { scale, centered: true })
    graphics.setPosition(-metrics.half, -metrics.half)
    container.add(graphics)
    container.setScrollFactor(0)
    container.setDepth(850)
    return container
  },

  createTransitionBooster (depth = 849) {
    const booster = this.add.graphics()
    booster.setScrollFactor(0)
    booster.setDepth(depth)
    return booster
  },

  renderTransitionBooster (booster, centerX, centerY, scale) {
    if (!booster) {
      return
    }

    booster.clear()
    const nozzleY = centerY + (27 * scale)
    const outerLength = 16 + Phaser.Math.Between(0, 6)
    const innerLength = outerLength - 6
    const sideOuterLength = 10 + Phaser.Math.Between(0, 4)
    const sideInnerLength = sideOuterLength - 4
    const leftBaseX = centerX - (15 * scale)
    const rightBaseX = centerX + (15 * scale)
    const sideBaseY = centerY + (20 * scale)

    booster.fillStyle(0xf36b2b, 0.95)
    booster.fillTriangle(centerX - (7 * scale), nozzleY, centerX + (7 * scale), nozzleY, centerX, nozzleY + outerLength)
    booster.fillStyle(0xffd36d, 0.95)
    booster.fillTriangle(centerX - (4 * scale), nozzleY + 1, centerX + (4 * scale), nozzleY + 1, centerX, nozzleY + innerLength)
    booster.fillStyle(0xf36b2b, 0.9)
    booster.fillTriangle(leftBaseX - (4 * scale), sideBaseY, leftBaseX + (4 * scale), sideBaseY, leftBaseX - (6 * scale), sideBaseY + sideOuterLength)
    booster.fillTriangle(rightBaseX - (4 * scale), sideBaseY, rightBaseX + (4 * scale), sideBaseY, rightBaseX + (6 * scale), sideBaseY + sideOuterLength)
    booster.fillStyle(0xffd36d, 0.9)
    booster.fillTriangle(leftBaseX - (2 * scale), sideBaseY + 1, leftBaseX + (2 * scale), sideBaseY + 1, leftBaseX - (4 * scale), sideBaseY + sideInnerLength)
    booster.fillTriangle(rightBaseX - (2 * scale), sideBaseY + 1, rightBaseX + (2 * scale), sideBaseY + 1, rightBaseX + (4 * scale), sideBaseY + sideInnerLength)
  },

  clearTransitionFx () {
    this.transitionShip?.destroy()
    this.transitionShip = null
    this.transitionBooster?.destroy()
    this.transitionBooster = null
  },

  setLevelHudAlpha (alpha) {
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
      this.scannerChargeText
    ]

    for (const item of hudItems) {
      if (item?.setAlpha) {
        item.setAlpha(alpha)
      }
    }
  },

  finishShipTransition () {
    this.isShipTransitionActive = false
    this.clearTransitionFx()
    if (this.player) {
      this.player.setAlpha(1)
    }
    this.setLevelHudAlpha(1)
  },

  beginUndockTransition (data) {
    if (!this.player) {
      return
    }

    this.isShipTransitionActive = true
    this.canAutoDock = false
    this.player.body.setVelocity(0, 0)
    this.player.setAlpha(0)
    this.setLevelHudAlpha(0)

    const camera = this.cameras.main
    const playerScreen = worldToScreenPoint(camera, this.player.x, this.player.y)
    const startCenter = getMothershipShipCenterFromTopLeft(data.screenX, data.screenY)
    const launchX = this.player.x + (Math.cos(this.shipHeading) * SHIP_TRANSITION_LAUNCH_DISTANCE)
    const launchY = this.player.y + (Math.sin(this.shipHeading) * SHIP_TRANSITION_LAUNCH_DISTANCE)

    this.transitionShip = this.createTransitionShip(1)
    this.transitionBooster = this.createTransitionBooster()
    this.transitionShip.setPosition(startCenter.x, startCenter.y)

    const tweenState = { scale: 1 }
    const hudFade = { t: 0 }

    const syncTransitionFx = () => {
      this.transitionShip.setScale(tweenState.scale)
      this.renderTransitionBooster(
        this.transitionBooster,
        this.transitionShip.x,
        this.transitionShip.y,
        tweenState.scale
      )
    }

    syncTransitionFx()

    this.tweens.add({
      targets: this.transitionShip,
      x: playerScreen.x,
      y: playerScreen.y,
      duration: SHIP_UNDOCK_TRANSITION_MS,
      ease: 'Sine.InOut',
      onUpdate: syncTransitionFx
    })

    this.tweens.add({
      targets: tweenState,
      scale: 0.45,
      duration: SHIP_UNDOCK_TRANSITION_MS,
      ease: 'Sine.InOut',
      onUpdate: syncTransitionFx
    })

    this.tweens.add({
      targets: this.player,
      x: launchX,
      y: launchY,
      duration: SHIP_UNDOCK_TRANSITION_MS,
      ease: 'Sine.InOut'
    })

    this.tweens.add({
      targets: hudFade,
      t: 1,
      duration: SHIP_UNDOCK_TRANSITION_MS,
      ease: 'Sine.Out',
      onUpdate: () => {
        this.setLevelHudAlpha(hudFade.t)
      },
      onComplete: () => {
        this.finishShipTransition()
      }
    })
  },

  beginReturnShipTransition (onComplete) {
    if (!this.player || this.isShipTransitionActive) {
      return
    }

    this.isShipTransitionActive = true
    this.isReturningToMothership = true
    this.canAutoDock = false
    prepareShipForUndock()
    this.fuelLostGraceMs = 0
    this.releaseGrapple()
    this.clearPlacedCharges()
    this.resetScannerState()
    this.player.body.setVelocity(0, 0)

    this.tweens.add({
      targets: this.player,
      x: this.dockingPortX,
      y: this.dockingPortY,
      duration: SHIP_DOCK_APPROACH_MS,
      ease: 'Sine.InOut',
      onComplete: () => {
        const camera = this.cameras.main
        const dockScreen = worldToScreenPoint(camera, this.dockingPortX, this.dockingPortY)
        const exitCenterX = -90
        const exitCenterY = dockScreen.y

        this.player.setAlpha(0)
        this.transitionShip = this.createTransitionShip(0.45)
        this.transitionBooster = this.createTransitionBooster()
        this.transitionShip.setPosition(dockScreen.x, dockScreen.y)

        const tweenState = { scale: 0.45 }
        const hudFade = { t: 0 }

        const syncTransitionFx = () => {
          this.transitionShip.setScale(tweenState.scale)
          this.renderTransitionBooster(
            this.transitionBooster,
            this.transitionShip.x,
            this.transitionShip.y,
            tweenState.scale
          )
        }

        syncTransitionFx()

        this.tweens.add({
          targets: this.transitionShip,
          x: exitCenterX,
          y: exitCenterY,
          duration: SHIP_DOCK_EXIT_MS,
          ease: 'Sine.In',
          onUpdate: syncTransitionFx
        })

        this.tweens.add({
          targets: tweenState,
          scale: 1,
          duration: SHIP_DOCK_EXIT_MS,
          ease: 'Sine.In',
          onUpdate: syncTransitionFx
        })

        this.tweens.add({
          targets: hudFade,
          t: 1,
          duration: SHIP_DOCK_EXIT_MS,
          ease: 'Sine.In',
          onUpdate: () => {
            this.setLevelHudAlpha(1 - hudFade.t)
          },
          onComplete: () => {
            const topLeft = getMothershipShipTopLeftFromCenter(exitCenterX, exitCenterY)
            this.finishShipTransition()
            onComplete({
              x: MOTHERSHIP_APPROACH_X,
              y: topLeft.y
            })
          }
        })
      }
    })
  }
}

export {
  getMothershipShipCenterFromTopLeft,
  getMothershipShipTopLeftFromCenter
}
