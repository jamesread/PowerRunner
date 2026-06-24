import { ShopItem } from './ShopItem.js'
import {
  TRACTOR_BEAM_MAX_LEVEL,
  SCANNER_MAX_LEVEL,
  NANOBOT_MAX_LEVEL,
  CAPACITY_UPGRADE_MAX_LEVEL,
  FUEL_CAPACITY_BONUS_PER_LEVEL,
  BATTERY_CAPACITY_BONUS_PER_LEVEL,
  SUPERCAPACITOR_MAX_LEVEL,
  GRAPPLE_UPGRADE_MAX_LEVEL
} from '../constants/tools.js'
import {
  getFuelCapacityMax,
  getBatteryCapacityMax,
  getCargoHoldMax
} from '../utils/upgrades.js'

class ShopItemEndGirderCount extends ShopItem {
  getTechId () {
    return 'endGirder'
  }

  getPrerequisites () {
    return [{ techId: 'scanner', minLevel: 1 }]
  }

  onBuy () {
    window.gameState.endGirderCount++
  }

  getName () {
    return 'Extra Collector Sweep'
  }

  getCost () {
    const nextTier = this.getTechLevel() + 1

    return {
      iron: nextTier * 4,
      helium3: nextTier * 2,
      crystal: nextTier
    }
  }
}

class ShopItemRepair extends ShopItem {
  getTechId () {
    return 'repair'
  }

  getPrerequisites () {
    return [{ techId: 'health', minLevel: 1 }]
  }

  onBuy () {
    window.gameState.playerCurrentHealth = Math.min(window.gameState.playerCurrentHealth + 10, window.gameState.playerMaxHealth)
  }

  getCost () {
    return {
      iron: 1,
      helium3: 1,
      crystal: 1
    }
  }

  getName () {
    return 'Repair 10 HP'
  }

  canBuy () {
    return window.gameState.playerCurrentHealth < window.gameState.playerMaxHealth
  }

  hasLevel () {
    return false
  }
}

class ShopItemSpeed extends ShopItem {
  getTechId () {
    return 'speed'
  }

  onBuy () {
    window.gameState.playerSpeed += 30
  }

  getName () {
    return 'Thruster Power'
  }

  getCost () {
    const nextTier = this.getTechLevel() + 1

    return {
      iron: nextTier,
      helium3: nextTier * 4
    }
  }
}

class ShopItemHealth extends ShopItem {
  getTechId () {
    return 'health'
  }

  onBuy () {
    window.gameState.playerMaxHealth += 50
  }

  getName () {
    return 'Hull Integrity +50'
  }

  getCost () {
    const nextTier = this.getTechLevel() + 1

    return {
      iron: nextTier * 5
    }
  }
}

class ShopItemTractorBeam extends ShopItem {
  getTechId () {
    return 'tractor'
  }

  getPrerequisites () {
    return [{ techId: 'speed', minLevel: 1 }]
  }

  constructor () {
    super()
    this.level = 0
  }

  onBuy () {
    window.gameState.tractorBeamLevel = Math.min(
      TRACTOR_BEAM_MAX_LEVEL,
      window.gameState.tractorBeamLevel + 1
    )
    this.level = window.gameState.tractorBeamLevel
  }

  getName () {
    return 'Tractor Beam'
  }

  getLevel () {
    return window.gameState.tractorBeamLevel
  }

  getCost () {
    const nextLevel = window.gameState.tractorBeamLevel + 1

    return {
      iron: nextLevel * 3,
      helium3: nextLevel * 2,
      crystal: nextLevel
    }
  }

  canBuy () {
    return window.gameState.tractorBeamLevel < TRACTOR_BEAM_MAX_LEVEL
  }
}

class ShopItemShipScanner extends ShopItem {
  getTechId () {
    return 'scanner'
  }

  getPrerequisites () {
    return [{ techId: 'health', minLevel: 1 }]
  }

  constructor () {
    super()
    this.level = 0
  }

  onBuy () {
    window.gameState.scannerLevel = Math.min(
      SCANNER_MAX_LEVEL,
      window.gameState.scannerLevel + 1
    )
    this.level = window.gameState.scannerLevel
  }

  getName () {
    return 'Ship Scanners'
  }

  getLevel () {
    return window.gameState.scannerLevel
  }

  getCost () {
    const nextLevel = window.gameState.scannerLevel + 1

    return {
      iron: nextLevel * 2,
      helium3: nextLevel * 3,
      crystal: nextLevel * 2
    }
  }

  canBuy () {
    return window.gameState.scannerLevel < SCANNER_MAX_LEVEL
  }
}

class ShopItemHullNanobots extends ShopItem {
  getTechId () {
    return 'nanobots'
  }

  getPrerequisites () {
    return [{ techId: 'health', minLevel: 1 }]
  }

  constructor () {
    super()
    this.level = 0
  }

  onBuy () {
    window.gameState.nanobotLevel = Math.min(
      NANOBOT_MAX_LEVEL,
      window.gameState.nanobotLevel + 1
    )
    this.level = window.gameState.nanobotLevel
  }

  getName () {
    return 'Hull Repair Nanobots'
  }

  getLevel () {
    return window.gameState.nanobotLevel
  }

  getCost () {
    const nextLevel = window.gameState.nanobotLevel + 1

    return {
      iron: nextLevel * 3,
      helium3: nextLevel * 2,
      crystal: nextLevel * 2
    }
  }

  canBuy () {
    return window.gameState.nanobotLevel < NANOBOT_MAX_LEVEL
  }
}

class ShopItemFuelCapacity extends ShopItem {
  getTechId () {
    return 'fuel'
  }

  getPrerequisites () {
    return [{ techId: 'speed', minLevel: 1 }]
  }

  constructor () {
    super()
    this.level = 0
  }

  onBuy () {
    window.gameState.fuelCapacityLevel = Math.min(
      CAPACITY_UPGRADE_MAX_LEVEL,
      window.gameState.fuelCapacityLevel + 1
    )
    window.gameState.fuelMax = getFuelCapacityMax(window.gameState.fuelCapacityLevel)
    window.gameState.fuelCurrent = Math.min(
      window.gameState.fuelCurrent + FUEL_CAPACITY_BONUS_PER_LEVEL,
      window.gameState.fuelMax
    )
    this.level = window.gameState.fuelCapacityLevel
  }

  getName () {
    return 'Extended Fuel Tanks'
  }

  getLevel () {
    return window.gameState.fuelCapacityLevel
  }

  getCost () {
    const nextLevel = window.gameState.fuelCapacityLevel + 1

    return {
      iron: nextLevel * 4,
      helium3: nextLevel * 3
    }
  }

  canBuy () {
    return window.gameState.fuelCapacityLevel < CAPACITY_UPGRADE_MAX_LEVEL
  }
}

class ShopItemBatteryCapacity extends ShopItem {
  getTechId () {
    return 'battery'
  }

  getPrerequisites () {
    return [{ techId: 'scanner', minLevel: 1 }]
  }

  constructor () {
    super()
    this.level = 0
  }

  onBuy () {
    window.gameState.batteryCapacityLevel = Math.min(
      CAPACITY_UPGRADE_MAX_LEVEL,
      window.gameState.batteryCapacityLevel + 1
    )
    window.gameState.batteryMax = getBatteryCapacityMax(window.gameState.batteryCapacityLevel)
    window.gameState.batteryCurrent = Math.min(
      window.gameState.batteryCurrent + BATTERY_CAPACITY_BONUS_PER_LEVEL,
      window.gameState.batteryMax
    )
    this.level = window.gameState.batteryCapacityLevel
  }

  getName () {
    return 'High-Capacity Battery'
  }

  getLevel () {
    return window.gameState.batteryCapacityLevel
  }

  getCost () {
    const nextLevel = window.gameState.batteryCapacityLevel + 1

    return {
      helium3: nextLevel * 2,
      crystal: nextLevel * 3
    }
  }

  canBuy () {
    return window.gameState.batteryCapacityLevel < CAPACITY_UPGRADE_MAX_LEVEL
  }
}

class ShopItemSupercapacitors extends ShopItem {
  getTechId () {
    return 'supercap'
  }

  getPrerequisites () {
    return [{ techId: 'battery', minLevel: 1 }]
  }

  constructor () {
    super()
    this.level = 0
  }

  onBuy () {
    window.gameState.supercapacitorLevel = Math.min(
      SUPERCAPACITOR_MAX_LEVEL,
      window.gameState.supercapacitorLevel + 1
    )
    this.level = window.gameState.supercapacitorLevel
  }

  getName () {
    return 'Supercapacitors'
  }

  getLevel () {
    return window.gameState.supercapacitorLevel
  }

  getCost () {
    const nextLevel = window.gameState.supercapacitorLevel + 1

    return {
      helium3: nextLevel * 3,
      crystal: nextLevel * 4
    }
  }

  canBuy () {
    return window.gameState.supercapacitorLevel < SUPERCAPACITOR_MAX_LEVEL
  }
}

class ShopItemGrappleWinch extends ShopItem {
  getTechId () {
    return 'grapple'
  }

  getPrerequisites () {
    return [{ techId: 'speed', minLevel: 1 }]
  }

  constructor () {
    super()
    this.level = 0
  }

  onBuy () {
    window.gameState.grappleLevel = Math.min(
      GRAPPLE_UPGRADE_MAX_LEVEL,
      window.gameState.grappleLevel + 1
    )
    this.level = window.gameState.grappleLevel
  }

  getName () {
    return 'Grappling Winch'
  }

  getLevel () {
    return window.gameState.grappleLevel
  }

  getCost () {
    const nextLevel = window.gameState.grappleLevel + 1

    return {
      iron: nextLevel * 3,
      helium3: nextLevel * 2
    }
  }

  canBuy () {
    return window.gameState.grappleLevel < GRAPPLE_UPGRADE_MAX_LEVEL
  }
}

class ShopItemDrillSpeed extends ShopItem {
  getTechId () {
    return 'drill'
  }

  getPrerequisites () {
    return [{ techId: 'tractor', minLevel: 1 }]
  }

  constructor () {
    super()
    this.level = 0
  }

  onBuy () {
    window.gameState.drillSpeedLevel = Math.min(
      CAPACITY_UPGRADE_MAX_LEVEL,
      window.gameState.drillSpeedLevel + 1
    )
    this.level = window.gameState.drillSpeedLevel
  }

  getName () {
    return 'Mining Drill Speed'
  }

  getLevel () {
    return window.gameState.drillSpeedLevel
  }

  getCost () {
    const nextLevel = window.gameState.drillSpeedLevel + 1

    return {
      iron: nextLevel * 3,
      crystal: nextLevel * 2
    }
  }

  canBuy () {
    return window.gameState.drillSpeedLevel < CAPACITY_UPGRADE_MAX_LEVEL
  }
}

class ShopItemDrillYield extends ShopItem {
  getTechId () {
    return 'drillYield'
  }

  getPrerequisites () {
    return [{ techId: 'drill', minLevel: 1 }]
  }

  constructor () {
    super()
    this.level = 0
  }

  onBuy () {
    window.gameState.drillYieldLevel = Math.min(
      CAPACITY_UPGRADE_MAX_LEVEL,
      window.gameState.drillYieldLevel + 1
    )
    this.level = window.gameState.drillYieldLevel
  }

  getName () {
    return 'Drill Extraction Yield'
  }

  getLevel () {
    return window.gameState.drillYieldLevel
  }

  getCost () {
    const nextLevel = window.gameState.drillYieldLevel + 1

    return {
      iron: nextLevel * 4,
      crystal: nextLevel * 3
    }
  }

  canBuy () {
    return window.gameState.drillYieldLevel < CAPACITY_UPGRADE_MAX_LEVEL
  }
}

class ShopItemCargoHold extends ShopItem {
  getTechId () {
    return 'cargo'
  }

  getPrerequisites () {
    return [{ techId: 'health', minLevel: 1 }]
  }

  constructor () {
    super()
    this.level = 0
  }

  onBuy () {
    window.gameState.cargoHoldLevel = Math.min(
      CAPACITY_UPGRADE_MAX_LEVEL,
      window.gameState.cargoHoldLevel + 1
    )
    window.gameState.cargoMaxUnits = getCargoHoldMax(window.gameState.cargoHoldLevel)
    this.level = window.gameState.cargoHoldLevel
  }

  getName () {
    return 'Expanded Cargo Hold'
  }

  getLevel () {
    return window.gameState.cargoHoldLevel
  }

  getCost () {
    const nextLevel = window.gameState.cargoHoldLevel + 1

    return {
      iron: nextLevel * 5,
      helium3: nextLevel
    }
  }

  canBuy () {
    return window.gameState.cargoHoldLevel < CAPACITY_UPGRADE_MAX_LEVEL
  }
}

class ShopItemExplosiveCharge extends ShopItem {
  getTechId () {
    return 'explosive'
  }

  getPrerequisites () {
    return [{ techId: 'tractor', minLevel: 1 }]
  }

  onBuy () {
    window.gameState.explosiveCharges = (window.gameState.explosiveCharges ?? 0) + 2
    this.level++
  }

  getName () {
    return 'Explosive Charges +2'
  }

  getCost () {
    const nextTier = this.getTechLevel() + 1

    return {
      iron: 2 + (nextTier * 2),
      helium3: 1 + nextTier,
      crystal: 1 + nextTier
    }
  }

  hasLevel () {
    return false
  }
}

export {
  ShopItemEndGirderCount,
  ShopItemRepair,
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
  ShopItemExplosiveCharge
}
