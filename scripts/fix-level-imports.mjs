import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const levelDir = path.join(ROOT, 'src/level')

const importsByFile = {
  'world.js': `import { Phaser } from '../phaser.js'
import { buildLevelMothershipLayout, drawMothershipHull } from '../render/mothership.js'
import { WORLD_SCALE } from '../constants/player.js'
import {
  MOTHERSHIP_SHIELD_RADIUS,
  SHIELD_HIT_COOLDOWN_MS,
  SHIELD_REPEL_SPEED_MIN,
  SHIELD_REPEL_SPEED_MAX,
  DOCK_AUTO_DISTANCE_PX
} from '../constants/asteroids.js'
`,
  'run.js': `import { Phaser } from '../phaser.js'
import { prepareShipForUndock } from '../state/ship.js'
import { resetCargo, transferCargoToResources } from '../state/economy.js'
import { startMothershipTransition } from '../game/transitions.js'
`,
  'asteroidField.js': `import { Phaser } from '../phaser.js'
import { getMiningFieldParams, shouldSmallAsteroidDeflectOffLarge } from '../utils/asteroids.js'
import {
  ASTEROID_SAFE_RADIUS,
  MOTHERSHIP_SAFE_RADIUS,
  MEDIUM_RADIUS,
  FRAGMENT_RADIUS,
  DEPLETED_ASTEROID_COLORS,
  ASTEROID_COLLISION_FRACTURE_COOLDOWN_MS,
  ASTEROID_FRACTURE_IMPACT_SPEED_MIN
} from '../constants/asteroids.js'
import {
  drawAsteroid,
  getAsteroidColorsForResource,
  getRandomAsteroidResourceType,
  getAsteroidMineralCapacity
} from '../render/asteroid.js'
`,
  'grapple.js': `import {
  getGrappleMaxRange,
  getGrapplePullSpeed,
  getGrappleHookSpeed,
  getGrappleCooldownMs
} from '../utils/upgrades.js'
import { isCollectOnlyAsteroid } from '../utils/asteroids.js'
import { GRAPPLE_ATTACH_DISTANCE } from '../constants/player.js'
import { rotateAsteroidLocalPoint, worldPointToAsteroidLocal } from '../utils/geometry.js'
`,
  'drilling.js': `import { getDrillMsPerUnit, getDrillUnitsPerCycle } from '../utils/upgrades.js'
import { isDrillableAsteroid } from '../utils/asteroids.js'
import { addToCargo } from '../state/economy.js'
`,
  'tractor.js': `import { Phaser } from '../phaser.js'
import {
  TRACTOR_BEAM_CONE_RADIANS,
  TRACTOR_SPIN_DAMP_PER_SEC,
  TRACTOR_THRUST_TRANSFER,
  TRACTOR_HOLD_PADDING,
  TRACTOR_HOLD_FORWARD_PADDING,
  TRACTOR_COLLECT_PULL_MULT,
  TRACTOR_COLLECT_FALLOFF_FLOOR,
  TRACTOR_HOLD_DAMP_MULT
} from '../constants/tools.js'
import {
  getTractorBeamRange,
  getTractorBeamPull,
  getTractorEffectiveness,
  getTractorMode,
  getTractorCollectForceMult
} from '../utils/tools.js'
import { drawTractorBeamCone } from '../render/tractorBeam.js'
`,
  'scanner.js': `import {
  SCANNER_HOLD_MS,
  SCANNER_PULSE_MS
} from '../constants/tools.js'
import { getScannerRange, getScannerMarkerColor } from '../utils/tools.js'
import { worldToScreenPoint, isScreenPointVisible, getScreenEdgePointFromAngle } from '../utils/geometry.js'
import { SPACE_ACCENT_COLOR } from '../constants/theme.js'
`,
  'explosives.js': `import { Phaser } from '../phaser.js'
import {
  CHARGE_FUSE_MS,
  CHARGE_BLAST_RADIUS,
  CHARGE_BLAST_DAMAGE_MAX,
  CHARGE_BLAST_DAMAGE_MIN
} from '../constants/tools.js'
import { rotateAsteroidLocalPoint } from '../utils/geometry.js'
`,
  'player.js': `import { Phaser } from '../phaser.js'
import { addToCargo, resetCargo } from '../state/economy.js'
import { consumeShipFuel } from '../state/ship.js'
import {
  PLAYER_MAX_SPEED,
  PLAYER_ROT_SPEED,
  ATTACH_RELEASE_REVERSE_BOOST
} from '../constants/player.js'
import { GAMEPAD_DEAD_ZONE } from '../constants/theme.js'
import { drawPlayerShipIcon, getPlayerShipMetrics } from '../render/player.js'
`,
  'fuelBattery.js': `import {
  PLAYER_FUEL_MAX_DEFAULT,
  FUEL_LOST_GRACE_MS,
  BATTERY_DRAIN_TRACTOR_PER_SEC,
  BATTERY_SCAN_PULSE_DRAIN_MULT,
  BATTERY_RECHARGE_PCT_PER_SEC
} from '../constants/player.js'
import { consumeBattery, getScannerBatteryDrainRate, getNanobotBatteryDrainRate } from '../state/ship.js'
import { getBatteryRechargeFuelPerPct, getGrappleBatteryDrainRate } from '../utils/upgrades.js'
`,
  'nanobots.js': `import { getNanobotRepairRate } from '../state/ship.js'
`,
  'docking.js': `import {
  DOCK_AUTO_DISTANCE_PX,
  DOCK_ARRIVAL_METERS
} from '../constants/asteroids.js'
import { worldDistanceToMeters } from '../utils/tools.js'
import { worldToScreenPoint, isScreenPointVisible, getScreenEdgePointFromAngle } from '../utils/geometry.js'
import { SPACE_ACCENT_COLOR } from '../constants/theme.js'
`,
  'hud.js': `import { Phaser } from '../phaser.js'
import {
  createHudText,
  syncHudTextBox
} from '../ui/hud.js'
import { createResourceHudBoxes } from '../ui/resourceHud.js'
`,
  'pause.js': `import { Phaser } from '../phaser.js'
import { createSimpleMenuButton } from '../shop/menu.js'
import { getActiveGamepad, readGamepadVertical } from '../input/gamepad.js'
import { GAMEPAD_MENU_REPEAT_MS, SPACE_BG_COLOR } from '../constants/theme.js'
`,
  'devMenu.js': `import { Phaser } from '../phaser.js'
import { toggleGameFullscreen, getFullscreenLabel, registerFullscreenRefresh } from '../ui/fullscreen.js'
`,
  'destruction.js': `import { Phaser } from '../phaser.js'
import { SHIP_DESTRUCTION_MS } from '../constants/player.js'
import { drawPlayerShipDebrisShard, SHIP_DEBRIS_SHARDS } from '../render/player.js'
`,
  'core.js': `import { Phaser } from '../phaser.js'
import { createParallaxStarfield, renderParallaxStarfield } from '../render/starfield.js'
import { getActiveGamepad } from '../input/gamepad.js'
import { getCargoAmount, getCargoTotal } from '../state/economy.js'
import {
  syncHudTextBox,
  applyHullIntegrityHudStyle,
  applyFuelHudStyle,
  applyBatteryHudStyle
} from '../ui/hud.js'
import { updateResourceHudBoxes } from '../ui/resourceHud.js'
import { PLAYER_FUEL_MAX_DEFAULT } from '../constants/player.js'
`
}

for (const [file, imports] of Object.entries(importsByFile)) {
  const full = path.join(levelDir, file)
  let body = fs.readFileSync(full, 'utf8')
  const exportIdx = body.indexOf('export const ')
  if (exportIdx < 0) {
    throw new Error('Missing export in ' + file)
  }
  body = imports + '\n' + body.slice(exportIdx)
  fs.writeFileSync(full, body)
}

console.log('Level imports fixed')
