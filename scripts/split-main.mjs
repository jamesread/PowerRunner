import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const lines = fs.readFileSync(path.join(ROOT, 'main.js'), 'utf8').split('\n')

function slice (start, end) {
  return lines.slice(start - 1, end).join('\n')
}

function write (relPath, body) {
  const full = path.join(ROOT, relPath)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, body.replace(/\n+$/, '') + '\n')
}

const PHASER = "import { Phaser } from './phaser.js'\n\n"

write('src/phaser.js', "import * as Phaser from '../node_modules/phaser/dist/phaser.esm.js'\n\nexport { Phaser }\nexport default Phaser\n")

write('src/state/GameState.js', `import { PLAYER_FUEL_MAX_DEFAULT } from '../constants/player.js'

${slice(3, 30)}

export { GameState }
`)

write('src/shop/ShopItem.js', slice(32, 84) + '\n\nexport { ShopItem }\n')

write('src/shop/items.js', `import { ShopItem } from './ShopItem.js'
import {
  TRACTOR_BEAM_MAX_LEVEL,
  SCANNER_MAX_LEVEL
} from '../constants/tools.js'

${slice(86, 314)}

export {
  ShopItemEndGirderCount,
  ShopItemRepair,
  ShopItemSpeed,
  ShopItemHealth,
  ShopItemTractorBeam,
  ShopItemShipScanner,
  ShopItemExplosiveCharge
}
`)

write('src/state/ship.js', `import {
  PLAYER_FUEL_MAX_DEFAULT,
  FUEL_BURN_PER_SEC,
  BATTERY_DRAIN_SCANNER_BASE_PER_SEC,
  BATTERY_DRAIN_SCANNER_PER_LEVEL
} from '../constants/player.js'

${slice(316, 347)}

export {
  refuelShip,
  rechargeBattery,
  prepareShipForUndock,
  consumeShipFuel,
  consumeBattery,
  getScannerBatteryDrainRate
}
`)

write('src/shop/menu.js', `import { GameState } from '../state/GameState.js'
import {
  TECH_TREE_ORIGIN_X,
  TECH_TREE_ORIGIN_Y,
  TECH_TREE_COL_WIDTH,
  TECH_TREE_ROW_HEIGHT,
  TECH_TREE_LAYOUT
} from '../constants/techTree.js'

${slice(349, 447)}

export {
  getTechTreeNodePosition,
  isMenuButtonNavigable,
  isMenuButtonPurchasable,
  startNewGame,
  createSimpleMenuButton,
  layoutDeathScreen
}
`)

write('src/constants/resources.js', `${slice(449, 459)}

export {
  RESOURCE_TYPES,
  RESOURCE_LABELS,
  RESOURCE_COLORS
}
`)

write('src/constants/theme.js', `${slice(460, 463)}

export {
  SPACE_BG_COLOR,
  SPACE_ACCENT_COLOR,
  GAMEPAD_DEAD_ZONE,
  GAMEPAD_MENU_REPEAT_MS
}
`)

write('src/constants/player.js', `${slice(464, 485)}

export {
  WORLD_SCALE,
  PLAYER_MAX_SPEED,
  PLAYER_DRAG,
  PLAYER_ROT_SPEED,
  GRAPPLE_SPEED,
  GRAPPLE_COOLDOWN_MS,
  GRAPPLE_MAX_RANGE,
  GRAPPLE_PULL_SPEED,
  GRAPPLE_ATTACH_DISTANCE,
  ATTACH_RELEASE_REVERSE_BOOST,
  PLAYER_FUEL_MAX_DEFAULT,
  FUEL_BURN_PER_SEC,
  FUEL_LOW_THRESHOLD,
  FUEL_LOST_GRACE_MS,
  BATTERY_LOW_THRESHOLD,
  BATTERY_DRAIN_GRAPPLE_PER_SEC,
  BATTERY_DRAIN_TRACTOR_PER_SEC,
  BATTERY_DRAIN_SCANNER_BASE_PER_SEC,
  BATTERY_DRAIN_SCANNER_PER_LEVEL,
  BATTERY_SCAN_PULSE_DRAIN_MULT,
  BATTERY_FUEL_PER_PCT,
  BATTERY_RECHARGE_PCT_PER_SEC
}
`)

write('src/constants/tools.js', `${slice(486, 500)}

export {
  TRACTOR_BEAM_MAX_LEVEL,
  TRACTOR_BEAM_RANGE_BY_LEVEL,
  TRACTOR_BEAM_PULL_BY_LEVEL,
  TRACTOR_BEAM_CONE_RADIANS,
  TRACTOR_HOLD_PADDING,
  TRACTOR_SPIN_DAMP_PER_SEC,
  TRACTOR_THRUST_TRANSFER,
  SCANNER_MAX_LEVEL,
  SCANNER_RANGE_BY_LEVEL,
  SCANNER_HOLD_MS,
  SCANNER_PULSE_MS,
  CHARGE_FUSE_MS,
  CHARGE_BLAST_RADIUS,
  CHARGE_BLAST_DAMAGE_MAX,
  CHARGE_BLAST_DAMAGE_MIN
}
`)

write('src/constants/techTree.js', `${slice(501, 520)}

export {
  TECH_TREE_ORIGIN_X,
  TECH_TREE_ORIGIN_Y,
  TECH_TREE_COL_WIDTH,
  TECH_TREE_ROW_HEIGHT,
  TECH_TREE_EDGES,
  TECH_TREE_LAYOUT
}
`)

write('src/constants/asteroids.js', `${slice(521, 571)}

export {
  DRILL_MS_PER_UNIT,
  DEPLETED_ASTEROID_COLORS,
  FRAGMENT_RADIUS,
  MEDIUM_RADIUS,
  SMALL_ASTEROID_RADIUS_MAX,
  MINING_LEVEL_SCALE_MAX,
  ASTEROID_SAFE_RADIUS,
  MOTHERSHIP_SAFE_RADIUS,
  MOTHERSHIP_FIELD_HEIGHT,
  DOCK_ARM_LENGTH,
  DOCK_ARM_HALF_HEIGHT,
  DOCK_ARM_HULL_NOTCH,
  DOCK_PORT_OUTSET,
  DOCK_PORT_FRAME_OFFSET,
  DOCK_PORT_FRAME_WIDTH,
  DOCK_PORT_FRAME_HEIGHT,
  MOTHERSHIP_SHIELD_RADIUS,
  SHIELD_HIT_COOLDOWN_MS,
  ASTEROID_COLLISION_FRACTURE_COOLDOWN_MS,
  ASTEROID_FRACTURE_IMPACT_SPEED_MIN,
  SHIELD_REPEL_SPEED_MIN,
  SHIELD_REPEL_SPEED_MAX,
  PIXELS_PER_METER,
  DOCK_AUTO_METERS,
  DOCK_AUTO_DISTANCE_PX,
  DOCK_ARRIVAL_METERS
}
`)

write('src/utils/asteroids.js', PHASER + `import {
  FRAGMENT_RADIUS,
  MEDIUM_RADIUS,
  SMALL_ASTEROID_RADIUS_MAX,
  MINING_LEVEL_SCALE_MAX
} from '../constants/asteroids.js'

${slice(531, 607)}

export {
  getAsteroidSizeTier,
  shouldSmallAsteroidDeflectOffLarge,
  getMiningFieldProgress,
  getMiningFieldParams
}
`)

write('src/render/tractorBeam.js', slice(609, 675) + '\n\nexport { drawTractorBeamCone }\n')

write('src/utils/tools.js', PHASER + `import {
  TRACTOR_BEAM_MAX_LEVEL,
  TRACTOR_BEAM_RANGE_BY_LEVEL,
  TRACTOR_BEAM_PULL_BY_LEVEL,
  SCANNER_MAX_LEVEL,
  SCANNER_RANGE_BY_LEVEL
} from '../constants/tools.js'
import { FRAGMENT_RADIUS, PIXELS_PER_METER } from '../constants/asteroids.js'
import { RESOURCE_COLORS } from '../constants/resources.js'

${slice(677, 710)}

export {
  worldDistanceToMeters,
  getTractorBeamRange,
  getTractorBeamPull,
  getTractorEffectiveness,
  getScannerRange,
  getScannerMarkerColor
}
`)

write('src/utils/geometry.js', PHASER + slice(712, 891) + `

export {
  rotateAsteroidLocalPoint,
  worldPointToAsteroidLocal,
  getScreenEdgePointFromAngle,
  worldToScreenPoint,
  isScreenPointVisible
}
`)

write('src/render/mothership.js', `import {
  DOCK_ARM_LENGTH,
  DOCK_ARM_HALF_HEIGHT,
  DOCK_ARM_HULL_NOTCH,
  DOCK_PORT_OUTSET,
  DOCK_PORT_FRAME_OFFSET,
  DOCK_PORT_FRAME_WIDTH,
  DOCK_PORT_FRAME_HEIGHT,
  MOTHERSHIP_FIELD_HEIGHT
} from '../constants/asteroids.js'

${slice(736, 858)}

export {
  buildMothershipLayoutFromBounds,
  buildLevelMothershipLayout,
  buildScreenMothershipLayout,
  drawMothershipHull
}
`)

write('src/input/gamepad.js', `import { GAMEPAD_DEAD_ZONE } from '../constants/theme.js'

${slice(893, 921)}

export {
  getActiveGamepad,
  readGamepadVertical
}
`)

write('src/ui/fullscreen.js', PHASER + slice(923, 951) + `

export {
  isFullscreenAvailable,
  getFullscreenLabel,
  toggleGameFullscreen,
  registerFullscreenRefresh
}
`)

write('src/state/economy.js', `import { RESOURCE_TYPES } from '../constants/resources.js'

${slice(953, 1017)}

export {
  getResourceAmount,
  addResource,
  resetCargo,
  getCargoAmount,
  getCargoTotal,
  addToCargo,
  transferCargoToResources,
  canAffordCost,
  spendCost
}
`)

write('src/ui/resourceHud.js', `import { RESOURCE_TYPES, RESOURCE_COLORS, RESOURCE_LABELS } from '../constants/resources.js'
import { getResourceAmount } from '../state/economy.js'

${slice(1019, 1124)}

export {
  createResourceIcon,
  createResourceHudBoxes,
  updateResourceHudBoxes,
  setResourceHudCostHighlight
}
`)

write('src/render/asteroid.js', `import { RESOURCE_COLORS } from '../constants/resources.js'
import { MEDIUM_RADIUS } from '../constants/asteroids.js'

${slice(1126, 1170)}

${slice(1223, 1255)}

export {
  getRandomAsteroidResourceType,
  shadeHexColor,
  getAsteroidColorsForResource,
  getAsteroidMineralCapacity,
  drawAsteroid
}
`)

write('src/render/player.js', slice(1171, 1221) + '\n\nexport { drawPlayerShipIcon, getPlayerShipMetrics }\n')

write('src/render/starfield.js', PHASER + `import { SPACE_BG_COLOR, SPACE_ACCENT_COLOR } from '../constants/theme.js'

${slice(1257, 1359)}

export {
  createParallaxStarfield,
  renderParallaxStarfield
}
`)

write('src/game/transitions.js', slice(1361, 1368) + '\n\nexport { startMothershipTransition }\n')

write('src/ui/hud.js', PHASER + `import { SPACE_ACCENT_COLOR } from '../constants/theme.js'
import {
  FUEL_LOW_THRESHOLD,
  BATTERY_LOW_THRESHOLD
} from '../constants/player.js'

${slice(1370, 1500)}

export {
  createHudText,
  syncHudTextBox,
  blendHexColor,
  applyHullIntegrityHudStyle,
  applyFuelHudStyle,
  applyBatteryHudStyle
}
`)

// Scene classes
write('src/scenes/DeathScene.js', PHASER + `import { createParallaxStarfield, renderParallaxStarfield } from '../render/starfield.js'
import { createSimpleMenuButton, layoutDeathScreen, startNewGame } from '../shop/menu.js'

${slice(1502, 1554)}

export { DeathScene }
`)

write('src/scenes/MothershipScene.js', PHASER + `import {
  ShopItemSpeed,
  ShopItemHealth,
  ShopItemTractorBeam,
  ShopItemShipScanner,
  ShopItemRepair,
  ShopItemExplosiveCharge,
  ShopItemEndGirderCount
} from '../shop/items.js'
import {
  getTechTreeNodePosition,
  isMenuButtonNavigable,
  isMenuButtonPurchasable
} from '../shop/menu.js'
import { canAffordCost, spendCost } from '../state/economy.js'
import { TECH_TREE_EDGES } from '../constants/techTree.js'
import { createParallaxStarfield, renderParallaxStarfield } from '../render/starfield.js'
import { createResourceHudBoxes, updateResourceHudBoxes, setResourceHudCostHighlight } from '../ui/resourceHud.js'
import { createHudText, syncHudTextBox, applyHullIntegrityHudStyle } from '../ui/hud.js'
import { buildScreenMothershipLayout, drawMothershipHull } from '../render/mothership.js'
import { drawPlayerShipIcon } from '../render/player.js'
import { getScreenEdgePointFromAngle } from '../utils/geometry.js'
import { getActiveGamepad, readGamepadVertical } from '../input/gamepad.js'
import { GAMEPAD_MENU_REPEAT_MS } from '../constants/theme.js'
import { toggleGameFullscreen, getFullscreenLabel, registerFullscreenRefresh } from '../ui/fullscreen.js'

${slice(1556, 2759)}

export { MothershipScene }
`)

// LevelScene - extract methods into modules via prototype mixins
const levelSceneBody = slice(2761, 5440)
const constructorMatch = levelSceneBody.match(/constructor \(\) \{[\s\S]*?\n  \}/)
const constructorBlock = constructorMatch ? constructorMatch[0] : 'constructor () {\n  }'

function extractMethods (source, methodNames) {
  const chunks = []
  for (const name of methodNames) {
    const re = new RegExp(`  ${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\([^)]*\\) \\{`, 'm')
    const startMatch = source.match(re)
    if (!startMatch) {
      throw new Error('Method not found: ' + name)
    }
    const start = startMatch.index
    let i = startMatch.index + startMatch[0].length
    let depth = 1
    while (i < source.length && depth > 0) {
      const ch = source[i]
      if (ch === '{') depth++
      if (ch === '}') depth--
      i++
    }
    chunks.push(source.slice(start, i).trimEnd())
  }
  return chunks.join(',\n\n')
}

const levelModules = {
  'src/level/world.js': [
    'setupWorld', 'createFieldMothership', 'registerShieldOverlap', 'updateMothershipShield',
    'repelAsteroidFromShield', 'repelAsteroidFromCollision', 'onAsteroidHitShield'
  ],
  'src/level/run.js': [
    'initDirectorState', 'returnToMothership', 'quitLevel', 'initMiningRun',
    'getDirectorWaveBalance', 'nudgeDirectorPressure'
  ],
  'src/level/asteroidField.js': [
    'initMiningField', 'pickAsteroidSpawnPosition', 'clearAsteroids',
    'registerAsteroidAsteroidColliders', 'onAsteroidsCollide', 'tryFractureAsteroidFromCollision',
    'registerGrappleOverlap', 'spawnAsteroid', 'fractureAsteroid',
    'refreshAsteroidVisual', 'ensureAsteroidMineralLabel', 'revealAsteroidMinerals',
    'shouldShowAsteroidMineralLabel', 'shouldShowScannedAsteroidNav', 'removeScannedAsteroidMarker',
    'updateAsteroidMineralLabel', 'updateAsteroidMineralLabels'
  ],
  'src/level/grapple.js': [
    'onGrappleHitAsteroid', 'releaseGrapple', 'attachToAsteroid', 'syncPlayerToGrappleTarget',
    'getGrappleAnchorPoint', 'renderGrappleLine', 'updateGrapple', 'fireGrappleHook'
  ],
  'src/level/drilling.js': ['startDrilling', 'stopDrilling', 'renderDrillArm', 'updateDrilling'],
  'src/level/tractor.js': [
    'dampAsteroidSpin', 'getTractorHoldDistance', 'applyTractorPull',
    'applyTractorThrustToAsteroid', 'updateTractorBeam'
  ],
  'src/level/scanner.js': [
    'createScannerHud', 'updateScannerHudLayout', 'resetScannerCharge', 'resetScannerState',
    'updateScannerChargeHud', 'beginScanPulse', 'renderScanPulseRing', 'updateScanPulse',
    'updateScannedAsteroidNav', 'updateScanner'
  ],
  'src/level/explosives.js': [
    'clearPlacedCharges', 'removePlacedCharge', 'placeExplosiveCharge', 'renderChargeMarker',
    'spawnChargeBlastFx', 'applyChargeBurstDamage', 'detonateCharge', 'updateExplosiveCharges'
  ],
  'src/level/player.js': [
    'onAsteroidHitPlayer', 'triggerShipDamageFeedback', 'createPlayer', 'renderPlayerThrusters',
    'renderPlayerShip', 'collectFragment', 'renderPlayerDamageOverlay', 'updatePlayerMovement',
    'addCollectedCargo', 'changeHealth', 'triggerLostInSpace'
  ],
  'src/level/fuelBattery.js': ['updateFuelState', 'updateBattery', 'getFuelHudLabel', 'getBatteryHudLabel'],
  'src/level/docking.js': ['createDockingNavHud', 'updateDockingNavHud', 'checkAutoDock'],
  'src/level/hud.js': [
    'registerLevelResizeHandler', 'onLevelResize', 'updateLevelHudLayout', 'fixHudToCamera', 'createHud'
  ],
  'src/level/pause.js': [
    'createPauseMenu', 'layoutPauseMenu', 'setPauseMenuVisible', 'applyPauseButtonSelection',
    'movePauseSelection', 'activatePauseSelection', 'pollPauseGamepad', 'updatePauseMenu',
    'setPaused', 'togglePause', 'quitLevelFromPause'
  ],
  'src/level/devMenu.js': [
    'createDevMenu', 'setDevMenuVisible', 'toggleDevMenu', 'refreshDevMenu', 'togglePhysicsDebug'
  ],
  'src/level/core.js': ['create', 'setupInput', 'update']
}

const levelImports = PHASER + `import { prepareShipForUndock, consumeShipFuel, consumeBattery, getScannerBatteryDrainRate } from '../state/ship.js'
import { resetCargo, transferCargoToResources, getCargoAmount, getCargoTotal, addToCargo } from '../state/economy.js'
import { startMothershipTransition } from '../game/transitions.js'
import { createParallaxStarfield, renderParallaxStarfield } from '../render/starfield.js'
import { createResourceHudBoxes, updateResourceHudBoxes } from '../ui/resourceHud.js'
import {
  createHudText,
  syncHudTextBox,
  applyHullIntegrityHudStyle,
  applyFuelHudStyle,
  applyBatteryHudStyle
} from '../ui/hud.js'
import { createSimpleMenuButton } from '../shop/menu.js'
import { toggleGameFullscreen, getFullscreenLabel, registerFullscreenRefresh } from '../ui/fullscreen.js'
import { getActiveGamepad, readGamepadVertical } from '../input/gamepad.js'
import { GAMEPAD_MENU_REPEAT_MS } from '../constants/theme.js'
import { WORLD_SCALE, PLAYER_MAX_SPEED, PLAYER_DRAG, PLAYER_ROT_SPEED, GRAPPLE_SPEED, GRAPPLE_COOLDOWN_MS, GRAPPLE_MAX_RANGE, GRAPPLE_PULL_SPEED, GRAPPLE_ATTACH_DISTANCE, ATTACH_RELEASE_REVERSE_BOOST, PLAYER_FUEL_MAX_DEFAULT, FUEL_LOST_GRACE_MS, BATTERY_DRAIN_GRAPPLE_PER_SEC, BATTERY_DRAIN_TRACTOR_PER_SEC, BATTERY_SCAN_PULSE_DRAIN_MULT, BATTERY_FUEL_PER_PCT, BATTERY_RECHARGE_PCT_PER_SEC } from '../constants/player.js'
import { TRACTOR_BEAM_CONE_RADIANS, TRACTOR_SPIN_DAMP_PER_SEC, TRACTOR_THRUST_TRANSFER, SCANNER_HOLD_MS, SCANNER_PULSE_MS, CHARGE_FUSE_MS, CHARGE_BLAST_RADIUS, CHARGE_BLAST_DAMAGE_MAX, CHARGE_BLAST_DAMAGE_MIN } from '../constants/tools.js'
import { getTractorBeamRange, getTractorBeamPull, getTractorEffectiveness, getScannerRange, worldDistanceToMeters } from '../utils/tools.js'
import { getMiningFieldParams, shouldSmallAsteroidDeflectOffLarge } from '../utils/asteroids.js'
import { rotateAsteroidLocalPoint, worldPointToAsteroidLocal, worldToScreenPoint, isScreenPointVisible, getScreenEdgePointFromAngle } from '../utils/geometry.js'
import { buildLevelMothershipLayout, drawMothershipHull } from '../render/mothership.js'
import { drawAsteroid, getAsteroidColorsForResource, getRandomAsteroidResourceType, getAsteroidMineralCapacity } from '../render/asteroid.js'
import { drawPlayerShipIcon, getPlayerShipMetrics } from '../render/player.js'
import { drawTractorBeamCone } from '../render/tractorBeam.js'
import { DEPLETED_ASTEROID_COLORS, DRILL_MS_PER_UNIT, FRAGMENT_RADIUS, MEDIUM_RADIUS, ASTEROID_SAFE_RADIUS, MOTHERSHIP_SAFE_RADIUS, MOTHERSHIP_FIELD_HEIGHT, MOTHERSHIP_SHIELD_RADIUS, SHIELD_HIT_COOLDOWN_MS, SHIELD_REPEL_SPEED_MIN, SHIELD_REPEL_SPEED_MAX, ASTEROID_COLLISION_FRACTURE_COOLDOWN_MS, ASTEROID_FRACTURE_IMPACT_SPEED_MIN, DOCK_AUTO_DISTANCE_PX, DOCK_ARRIVAL_METERS, PIXELS_PER_METER } from '../constants/asteroids.js'
import { SPACE_ACCENT_COLOR } from '../constants/theme.js'
import { getScannerMarkerColor } from '../utils/tools.js'
`

for (const [file, methods] of Object.entries(levelModules)) {
  const methodsBody = extractMethods(levelSceneBody, methods)
  const exportName = path.basename(file, '.js') + 'Methods'
  write(file, `${levelImports}\nexport const ${exportName} = {\n${methodsBody.split('\n').map(line => line.replace(/^  /, '  ')).join('\n')}\n}\n`)
}

write('src/scenes/LevelScene.js', PHASER + `import { worldMethods } from '../level/world.js'
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
import { coreMethods } from '../level/core.js'

class LevelScene extends Phaser.Scene {
  ${constructorBlock}
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
  coreMethods
)

export { LevelScene }
`)

write('src/main.js', PHASER + `import { GameState } from './state/GameState.js'
import { MothershipScene } from './scenes/MothershipScene.js'
import { LevelScene } from './scenes/LevelScene.js'
import { DeathScene } from './scenes/DeathScene.js'

export function main () {
  const config = {
    type: Phaser.AUTO,
    parent: 'gamearea',
    backgroundColor: '#05070d',
    scene: [MothershipScene, LevelScene, DeathScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
      gamepad: true
    },
    autoRound: true,
    audio: {
      disableWebAudio: true
    },
    physics: {
      default: 'arcade',
      arcade: {
        debug: false
      }
    }
  }

  window.gameState = new GameState()
  window.phaserGame = new Phaser.Game(config)
}
`)

write('main.js', "export { main } from './src/main.js'\n")

console.log('Split complete')
