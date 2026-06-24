import { getDrillMsPerUnit, getDrillUnitsPerCycle } from '../utils/upgrades.js'
import { isDrillableAsteroid } from '../utils/asteroids.js'
import { addToCargo } from '../state/economy.js'
import { getAsteroidInteractionRadius } from '../render/asteroid.js'

export const drillingMethods = {
  startDrilling () {
    const asteroid = this.grappleTarget
    if (!isDrillableAsteroid(asteroid)) {
      this.isDrilling = false
      return
    }

    this.isDrilling = true
    this.drillProgressMs = 0
  },

  stopDrilling () {
    this.isDrilling = false
    this.drillProgressMs = 0

    if (this.drillArm) {
      this.drillArm.clear()
    }
  },

  renderDrillArm () {
    if (!this.drillArm) {
      return
    }

    this.drillArm.clear()
    if (!this.isDrilling || this.grappleState !== 'attached' || !this.grappleTarget?.active) {
      return
    }

    const asteroid = this.grappleTarget
    const angle = Math.atan2(asteroid.y - this.player.y, asteroid.x - this.player.x)
    const noseOffset = this.playerShipMetrics.noseOffset
    const armStartX = this.player.x + (Math.cos(angle) * noseOffset * 0.35)
    const armStartY = this.player.y + (Math.sin(angle) * noseOffset * 0.35)
    const reach = Math.min(getAsteroidInteractionRadius(asteroid) * 0.72, Math.hypot(asteroid.x - armStartX, asteroid.y - armStartY) - 4)
    const armEndX = armStartX + (Math.cos(angle) * reach)
    const armEndY = armStartY + (Math.sin(angle) * reach)
    const pulse = (Math.sin(this.drillPulseTimer * 0.02) + 1) / 2

    this.drillArm.lineStyle(4, 0x2f4257, 1)
    this.drillArm.beginPath()
    this.drillArm.moveTo(armStartX, armStartY)
    this.drillArm.lineTo(armEndX, armEndY)
    this.drillArm.strokePath()

    this.drillArm.lineStyle(2, 0x9fb0bf, 0.95)
    this.drillArm.beginPath()
    this.drillArm.moveTo(armStartX, armStartY)
    this.drillArm.lineTo(armEndX, armEndY)
    this.drillArm.strokePath()

    const bitSize = 5 + (pulse * 2)
    this.drillArm.fillStyle(0xd35d5d, 1)
    this.drillArm.fillCircle(armEndX, armEndY, bitSize)
    this.drillArm.lineStyle(1.5, 0x0f1720, 1)
    this.drillArm.strokeCircle(armEndX, armEndY, bitSize)

    const sparkX = armEndX + (Math.cos(angle + (Math.PI / 2)) * (3 + (pulse * 2)))
    const sparkY = armEndY + (Math.sin(angle + (Math.PI / 2)) * (3 + (pulse * 2)))
    this.drillArm.fillStyle(0xffd36d, 0.55 + (pulse * 0.35))
    this.drillArm.fillCircle(sparkX, sparkY, 2)
    this.drillArm.fillCircle(armEndX - (Math.cos(angle) * 3), armEndY - (Math.sin(angle) * 3), 1.5)
  },

  updateDrilling (delta) {
    if (this.grappleState !== 'attached') {
      this.stopDrilling()
      return
    }

    this.drillPulseTimer += delta

    if (!this.isDrilling) {
      this.renderDrillArm()
      return
    }

    const asteroid = this.grappleTarget
    if (!asteroid?.active || asteroid.isDepleted || asteroid.mineralsRemaining <= 0) {
      this.stopDrilling()
      return
    }

    this.drillProgressMs += delta
    const drillMsPerUnit = getDrillMsPerUnit(window.gameState.drillSpeedLevel ?? 0)
    const unitsPerCycle = getDrillUnitsPerCycle(window.gameState.drillYieldLevel ?? 0)

    while (this.drillProgressMs >= drillMsPerUnit && asteroid.mineralsRemaining > 0) {
      this.drillProgressMs -= drillMsPerUnit
      const resourceType = asteroid.resourceType ?? 'iron'
      let extracted = 0

      for (let unit = 0; unit < unitsPerCycle && asteroid.mineralsRemaining > 0; unit++) {
        if (!addToCargo(resourceType, 1)) {
          this.stopDrilling()
          break
        }

        asteroid.mineralsRemaining -= 1
        extracted += 1
      }

      if (extracted <= 0) {
        break
      }

      this.activeResourcePulseKey = resourceType
      if (this.tweenResourcesChanged) {
        this.tweenResourcesChanged.restart()
      }

      if (asteroid.mineralsRemaining <= 0) {
        asteroid.mineralsRemaining = 0
        asteroid.isDepleted = true
        this.refreshAsteroidVisual(asteroid)
        this.removeScannedAsteroidMarker(asteroid)
        this.stopDrilling()
      }

      this.updateAsteroidMineralLabel(asteroid)
    }

    this.renderDrillArm()
  }
}
