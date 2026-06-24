import {
  DOCK_AUTO_DISTANCE_PX,
  DOCK_ARRIVAL_METERS
} from '../constants/asteroids.js'
import { worldDistanceToMeters } from '../utils/tools.js'
import { worldToScreenPoint, isScreenPointVisible, getScreenEdgePointFromAngle } from '../utils/geometry.js'
import { SPACE_ACCENT_COLOR } from '../constants/theme.js'

export const dockingMethods = {
  createDockingNavHud () {
    const depth = 550

    this.dockNavArrow = this.add.graphics()
    this.dockNavArrow.setDepth(depth)
    this.dockNavArrow.setScrollFactor(0)

    this.dockNavDistanceBg = this.add.rectangle(0, 0, 92, 26, 0x0f1720, 0.86)
    this.dockNavDistanceBg.setStrokeStyle(1, SPACE_ACCENT_COLOR, 0.85)
    this.dockNavDistanceBg.setDepth(depth)
    this.dockNavDistanceBg.setOrigin(0.5, 0.5)
    this.dockNavDistanceBg.setScrollFactor(0)

    this.dockNavDistanceText = this.add.text(0, 0, '', {
      fontFamily: 'sans-serif',
      fontSize: 13,
      color: '#dee3e7'
    })
    this.dockNavDistanceText.setOrigin(0.5, 0.5)
    this.dockNavDistanceText.setDepth(depth + 1)
    this.dockNavDistanceText.setScrollFactor(0)
  },

  updateDockingNavHud () {
    if (!this.dockNavArrow || !this.player) {
      return
    }

    const dx = this.dockingPortX - this.player.x
    const dy = this.dockingPortY - this.player.y
    const distPx = Math.hypot(dx, dy)
    const meters = worldDistanceToMeters(distPx)

    if (meters <= DOCK_ARRIVAL_METERS) {
      this.dockNavArrow.setVisible(false)
      this.dockNavDistanceBg.setVisible(false)
      this.dockNavDistanceText.setVisible(false)
      return
    }

    const width = this.scale.width || this.sys.game.canvas.width
    const height = this.scale.height || this.sys.game.canvas.height
    const camera = this.cameras.main
    const dockScreen = worldToScreenPoint(camera, this.dockingPortX, this.dockingPortY)
    const playerScreen = worldToScreenPoint(camera, this.player.x, this.player.y)
    const dockOnScreen = isScreenPointVisible(dockScreen.x, dockScreen.y, width, height)
    const playerOnScreen = isScreenPointVisible(playerScreen.x, playerScreen.y, width, height)
    const useBorderIndicator = !dockOnScreen || !playerOnScreen

    let arrowX
    let arrowY
    let arrowAngle
    let labelX
    let labelY

    if (useBorderIndicator) {
      arrowAngle = Math.atan2(dy, dx)
      const edge = getScreenEdgePointFromAngle(width, height, arrowAngle, 52)
      const labelInset = 34
      arrowX = edge.x
      arrowY = edge.y
      labelX = edge.x - (Math.cos(arrowAngle) * labelInset)
      labelY = edge.y - (Math.sin(arrowAngle) * labelInset)
    } else {
      arrowAngle = Math.atan2(dy, dx)
      const tipOffset = 14
      const labelOffset = 34
      arrowX = dockScreen.x - (Math.cos(arrowAngle) * tipOffset)
      arrowY = dockScreen.y - (Math.sin(arrowAngle) * tipOffset)
      labelX = dockScreen.x + (Math.cos(arrowAngle) * labelOffset)
      labelY = dockScreen.y + (Math.sin(arrowAngle) * labelOffset)
    }

    this.dockNavArrow.setVisible(true)
    this.dockNavDistanceBg.setVisible(true)
    this.dockNavDistanceText.setVisible(true)

    this.dockNavArrow.setPosition(arrowX, arrowY)
    this.dockNavArrow.setRotation(arrowAngle)
    this.dockNavArrow.clear()
    this.dockNavArrow.lineStyle(1.5, 0x0f1720, 1)
    this.dockNavArrow.fillStyle(0x8fcbe8, 0.95)
    this.dockNavArrow.fillTriangle(14, 0, -9, -8, -9, 8)
    this.dockNavArrow.strokeTriangle(14, 0, -9, -8, -9, 8)

    this.dockNavDistanceBg.setPosition(labelX, labelY)
    this.dockNavDistanceText.setPosition(labelX, labelY)
    this.dockNavDistanceText.setText('Dock ' + meters + ' m')
  },

  checkAutoDock () {
    if (this.isReturningToMothership || !this.player) {
      return
    }

    const dx = this.dockingPortX - this.player.x
    const dy = this.dockingPortY - this.player.y
    const dist = Math.hypot(dx, dy)

    if (!this.canAutoDock) {
      if (dist >= DOCK_AUTO_DISTANCE_PX) {
        this.canAutoDock = true
      }
      return
    }

    if (dist < DOCK_AUTO_DISTANCE_PX) {
      this.returnToMothership()
    }
  }
}
