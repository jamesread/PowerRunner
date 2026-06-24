import { Phaser } from '../phaser.js'

import { worldMethods } from '../level/world.js'
import { runMethods } from '../level/run.js'
import { asteroidFieldMethods } from '../level/asteroidField.js'
import { grappleMethods } from '../level/grapple.js'
import { drillingMethods } from '../level/drilling.js'
import { tractorMethods } from '../level/tractor.js'
import { scannerMethods } from '../level/scanner.js'
import { explosivesMethods } from '../level/explosives.js'
import { playerMethods } from '../level/player.js'
import { fuelBatteryMethods } from '../level/fuelBattery.js'
import { dockingMethods } from '../level/docking.js'
import { hudMethods } from '../level/hud.js'
import { pauseMethods } from '../level/pause.js'
import { devMenuMethods } from '../level/devMenu.js'
import { nanobotMethods } from '../level/nanobots.js'
import { destructionMethods } from '../level/destruction.js'
import { coreMethods } from '../level/core.js'
import { shipTransitionMethods } from '../level/shipTransition.js'

class LevelScene extends Phaser.Scene {
  constructor () {
    super({
      key: 'level'
    })

    this.directorPressure = 0.25
    this.currentBadChance = 0.35
    this.asteroids = []
    this.asteroidColliders = []
    this.grappleState = 'idle'
    this.placedCharges = []
    this.isPaused = false
    this.isShipDestroying = false
    this.isShipTransitionActive = false
    this.shipTransitionData = null
  }

  init (data = {}) {
    this.shipTransitionData = data.shipTransition ?? null
  }
}

Object.assign(
  LevelScene.prototype,
  worldMethods,
  runMethods,
  asteroidFieldMethods,
  grappleMethods,
  drillingMethods,
  tractorMethods,
  scannerMethods,
  explosivesMethods,
  playerMethods,
  fuelBatteryMethods,
  dockingMethods,
  hudMethods,
  pauseMethods,
  devMenuMethods,
  nanobotMethods,
  destructionMethods,
  coreMethods,
  shipTransitionMethods
)

export { LevelScene }
