import { RESOURCE_TYPES } from '../constants/resources.js'

function getResourceAmount (resourceKey) {
  return window.gameState.resources[resourceKey] ?? 0
}

function addResource (resourceKey, amount = 1) {
  window.gameState.resources[resourceKey] = getResourceAmount(resourceKey) + amount
}

function resetCargo () {
  for (const resourceKey of RESOURCE_TYPES) {
    window.gameState.cargo[resourceKey] = 0
  }
}

function getCargoAmount (resourceKey) {
  return window.gameState.cargo[resourceKey] ?? 0
}

function getCargoTotal () {
  let total = 0
  for (const resourceKey of RESOURCE_TYPES) {
    total += getCargoAmount(resourceKey)
  }
  return total
}

function addToCargo (resourceKey, amount = 1) {
  const units = Math.max(1, amount)
  if (getCargoTotal() + units > window.gameState.cargoMaxUnits) {
    return false
  }

  window.gameState.cargo[resourceKey] = getCargoAmount(resourceKey) + units
  return true
}

function transferCargoUnit (resourceKey) {
  const amount = getCargoAmount(resourceKey)
  if (amount <= 0) {
    return false
  }

  window.gameState.cargo[resourceKey] = amount - 1
  addResource(resourceKey, 1)
  return true
}

function transferCargoToResources () {
  for (const resourceKey of RESOURCE_TYPES) {
    const amount = getCargoAmount(resourceKey)
    if (amount > 0) {
      addResource(resourceKey, amount)
    }
  }
  resetCargo()
}

function hasCargoRemaining () {
  return getCargoTotal() > 0
}

function canAffordCost (cost) {
  for (const resourceKey of RESOURCE_TYPES) {
    const required = cost[resourceKey] ?? 0
    if (required > getResourceAmount(resourceKey)) {
      return false
    }
  }

  return true
}

function spendCost (cost) {
  for (const resourceKey of RESOURCE_TYPES) {
    const required = cost[resourceKey] ?? 0
    if (required > 0) {
      addResource(resourceKey, -required)
    }
  }
}

export {
  getResourceAmount,
  addResource,
  resetCargo,
  getCargoAmount,
  getCargoTotal,
  addToCargo,
  transferCargoUnit,
  transferCargoToResources,
  hasCargoRemaining,
  canAffordCost,
  spendCost
}
