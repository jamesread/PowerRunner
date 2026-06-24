import { Phaser } from '../phaser.js'

import { SPACE_ACCENT_COLOR } from '../constants/theme.js'
import {
  FUEL_LOW_THRESHOLD,
  BATTERY_LOW_THRESHOLD
} from '../constants/player.js'

function createHudText (scene, x, y, text, style, options = {}) {
  const paddingX = options.paddingX ?? 6
  const paddingY = options.paddingY ?? 4
  const minWidth = options.minWidth ?? 0
  const depth = options.depth ?? 5

  const box = scene.add.rectangle(x - paddingX, y - paddingY, 0, 0, SPACE_ACCENT_COLOR, 0.55)
  box.setOrigin(0, 0)
  box.setStrokeStyle(1, 0x000000, 0.25)
  box.setDepth(depth - 1)

  const label = scene.add.text(x, y, text, style)
  label.hudBox = box
  label.hudPadding = { x: paddingX, y: paddingY, minWidth }
  label.setDepth(depth)

  syncHudTextBox(label)

  return label
}

function syncHudTextBox (label) {
  if (!label.hudBox || !label.hudPadding) {
    return
  }

  const boxWidth = Math.max(label.width + (label.hudPadding.x * 2), label.hudPadding.minWidth)
  const boxHeight = label.height + (label.hudPadding.y * 2)

  label.hudBox.setSize(boxWidth, boxHeight)
  label.hudBox.setPosition(label.x - label.hudPadding.x, label.y - label.hudPadding.y)
}

function blendHexColor (colorA, colorB, t) {
  const r1 = (colorA >> 16) & 0xff
  const g1 = (colorA >> 8) & 0xff
  const b1 = colorA & 0xff
  const r2 = (colorB >> 16) & 0xff
  const g2 = (colorB >> 8) & 0xff
  const b2 = colorB & 0xff

  const r = Math.round(r1 + ((r2 - r1) * t))
  const g = Math.round(g1 + ((g2 - g1) * t))
  const b = Math.round(b1 + ((b2 - b1) * t))

  return ((r << 16) | (g << 8) | b) >>> 0
}

function applyHullIntegrityHudStyle (scene, label, currentHealth, maxHealth) {
  if (!label || !label.hudBox) {
    return
  }

  const maxHp = Math.max(1, maxHealth)
  const hp = Math.max(0, currentHealth)
  const ratio = Phaser.Math.Clamp(hp / maxHp, 0, 1)

  let bgColor = blendHexColor(0xd83030, SPACE_ACCENT_COLOR, ratio)
  let bgAlpha = Phaser.Math.Linear(0.86, 0.55, ratio)
  let borderColor = blendHexColor(0x701414, 0x000000, ratio)
  let borderAlpha = Phaser.Math.Linear(0.9, 0.25, ratio)
  let borderWidth = 1

  if (hp < 30) {
    const pulse = (Math.sin(scene.game.loop.time * 0.02) + 1) / 2
    bgColor = blendHexColor(bgColor, 0xff6868, pulse * 0.65)
    bgAlpha = 0.66 + (pulse * 0.26)
    borderColor = blendHexColor(0xb51f1f, 0xff9a9a, pulse * 0.55)
    borderAlpha = 0.92
    borderWidth = 2
  }

  label.hudBox.setFillStyle(bgColor, bgAlpha)
  label.hudBox.setStrokeStyle(borderWidth, borderColor, borderAlpha)
}

function applyFuelHudStyle (scene, label, currentFuel, maxFuel) {
  if (!label || !label.hudBox) {
    return
  }

  const max = Math.max(1, maxFuel)
  const fuel = Math.max(0, currentFuel)
  const ratio = Phaser.Math.Clamp(fuel / max, 0, 1)

  let bgColor = blendHexColor(0xd83030, 0xc8943a, ratio)
  let bgAlpha = Phaser.Math.Linear(0.86, 0.55, ratio)
  let borderColor = blendHexColor(0x701414, 0x000000, ratio)
  let borderAlpha = Phaser.Math.Linear(0.9, 0.25, ratio)
  let borderWidth = 1

  if (fuel <= FUEL_LOW_THRESHOLD) {
    const pulse = (Math.sin(scene.game.loop.time * 0.02) + 1) / 2
    bgColor = blendHexColor(bgColor, 0xff6868, pulse * 0.65)
    bgAlpha = 0.66 + (pulse * 0.26)
    borderColor = blendHexColor(0xb51f1f, 0xff9a9a, pulse * 0.55)
    borderAlpha = 0.92
    borderWidth = 2
  }

  label.hudBox.setFillStyle(bgColor, bgAlpha)
  label.hudBox.setStrokeStyle(borderWidth, borderColor, borderAlpha)
}

function applyBatteryHudStyle (scene, label, currentBattery, maxBattery) {
  if (!label || !label.hudBox) {
    return
  }

  const max = Math.max(1, maxBattery)
  const charge = Math.max(0, currentBattery)
  const ratio = Phaser.Math.Clamp(charge / max, 0, 1)

  let bgColor = blendHexColor(0xd83030, 0x4a78a8, ratio)
  let bgAlpha = Phaser.Math.Linear(0.86, 0.55, ratio)
  let borderColor = blendHexColor(0x701414, 0x000000, ratio)
  let borderAlpha = Phaser.Math.Linear(0.9, 0.25, ratio)
  let borderWidth = 1

  if (charge <= BATTERY_LOW_THRESHOLD) {
    const pulse = (Math.sin(scene.game.loop.time * 0.02) + 1) / 2
    bgColor = blendHexColor(bgColor, 0xff6868, pulse * 0.65)
    bgAlpha = 0.66 + (pulse * 0.26)
    borderColor = blendHexColor(0xb51f1f, 0xff9a9a, pulse * 0.55)
    borderAlpha = 0.92
    borderWidth = 2
  }

  label.hudBox.setFillStyle(bgColor, bgAlpha)
  label.hudBox.setStrokeStyle(borderWidth, borderColor, borderAlpha)
}

export {
  createHudText,
  syncHudTextBox,
  blendHexColor,
  applyHullIntegrityHudStyle,
  applyFuelHudStyle,
  applyBatteryHudStyle
}
