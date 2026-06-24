import { Phaser } from '../phaser.js'
import { RESOURCE_TYPES } from '../constants/resources.js'
import {
  getCargoTotal,
  getCargoAmount,
  transferCargoUnit,
  transferCargoToResources
} from '../state/economy.js'
import { createResourceIcon } from './resourceHud.js'

const CARGO_UNLOAD_DURATION_MS = 5000
const CARGO_TRANSFER_FLIGHT_MS = 380

function buildCargoUnloadQueue () {
  const buckets = {}

  for (const resourceKey of RESOURCE_TYPES) {
    buckets[resourceKey] = getCargoAmount(resourceKey)
  }

  const queue = []
  let remaining = getCargoTotal()

  while (remaining > 0) {
    for (const resourceKey of RESOURCE_TYPES) {
      if (buckets[resourceKey] > 0) {
        queue.push(resourceKey)
        buckets[resourceKey]--
        remaining--
      }
    }
  }

  return queue
}

function getCargoUnloadOrigin (scene) {
  const ship = scene.ship
  if (ship) {
    return { x: ship.x + 18, y: ship.y + 8 }
  }

  return {
    x: scene.shipDockX ?? 120,
    y: scene.shipDockY ?? 120
  }
}

function getResourceHudIconPosition (resourceHudBoxes, resourceKey) {
  const hudItem = resourceHudBoxes?.items?.[resourceKey]
  if (!hudItem?.icon) {
    return null
  }

  return { x: hudItem.icon.x, y: hudItem.icon.y }
}

function launchCargoTransferSprite (scene, state, resourceKey) {
  const destination = getResourceHudIconPosition(state.resourceHudBoxes, resourceKey)
  if (!destination) {
    transferCargoUnit(resourceKey)
    state.unitsCompleted++
    state.onCargoHudUpdate?.()
    return
  }

  const origin = getCargoUnloadOrigin(scene)
  const icon = createResourceIcon(scene, resourceKey, origin.x, origin.y, 6)
  icon.setDepth(30)
  icon.setScale(0.85)
  state.flyingSprites.push(icon)

  const flightMs = Math.min(
    CARGO_TRANSFER_FLIGHT_MS,
    Math.max(180, state.interval * 0.85)
  )

  scene.tweens.add({
    targets: icon,
    x: destination.x,
    y: destination.y,
    scale: 1.2,
    duration: flightMs,
    ease: 'Cubic.In',
    onComplete: () => {
      transferCargoUnit(resourceKey)
      state.unitsCompleted++
      state.onCargoHudUpdate?.()

      const hudItem = state.resourceHudBoxes.items[resourceKey]
      if (hudItem?.icon) {
        scene.tweens.add({
          targets: hudItem.icon,
          scale: 1.45,
          duration: 90,
          yoyo: true,
          ease: 'Sine.Out'
        })
      }

      icon.destroy()
      state.flyingSprites = state.flyingSprites.filter((entry) => entry !== icon)

      if (state.unitsCompleted >= state.queue.length) {
        completeCargoUnload(state)
      }
    }
  })
}

function completeCargoUnload (state) {
  if (!state.active) {
    return
  }

  state.active = false
  state.onCargoHudUpdate?.()
  state.onComplete?.()
}

function startCargoUnloadAnimation (scene, options = {}) {
  const queue = buildCargoUnloadQueue()
  const totalUnits = queue.length

  if (totalUnits <= 0) {
    return null
  }

  const duration = options.durationMs ?? CARGO_UNLOAD_DURATION_MS

  return {
    active: true,
    duration,
    interval: duration / totalUnits,
    queue,
    elapsed: 0,
    unitsLaunched: 0,
    unitsCompleted: 0,
    resourceHudBoxes: options.resourceHudBoxes ?? null,
    onCargoHudUpdate: options.onCargoHudUpdate ?? null,
    onComplete: options.onComplete ?? null,
    flyingSprites: []
  }
}

function updateCargoUnloadAnimation (scene, state, delta) {
  if (!state?.active) {
    return
  }

  state.elapsed += delta

  while (state.unitsLaunched < state.queue.length &&
      state.elapsed >= (state.unitsLaunched * state.interval)) {
    launchCargoTransferSprite(scene, state, state.queue[state.unitsLaunched])
    state.unitsLaunched++
  }
}

function finishCargoUnloadImmediate (scene, state) {
  if (!state) {
    return
  }

  state.active = false

  for (const icon of state.flyingSprites) {
    scene.tweens.killTweensOf(icon)
    if (icon?.destroy) {
      icon.destroy()
    }
  }

  state.flyingSprites = []
  transferCargoToResources()
  state.onCargoHudUpdate?.()
  state.onComplete?.()
}

function isCargoUnloadActive (state) {
  return !!state?.active
}

function getCargoUnloadProgress (state) {
  if (!state || state.queue.length === 0) {
    return 1
  }

  return Phaser.Math.Clamp(state.unitsCompleted / state.queue.length, 0, 1)
}

export {
  CARGO_UNLOAD_DURATION_MS,
  buildCargoUnloadQueue,
  startCargoUnloadAnimation,
  updateCargoUnloadAnimation,
  finishCargoUnloadImmediate,
  isCargoUnloadActive,
  getCargoUnloadProgress
}
