import { RESOURCE_TYPES, RESOURCE_COLORS, RESOURCE_LABELS } from '../constants/resources.js'
import { getResourceAmount } from '../state/economy.js'
import { createHudText, syncHudTextBox } from './hud.js'

function createResourceIcon (scene, resourceKey, x, y, size = 5) {
  const icon = scene.add.graphics()
  const color = RESOURCE_COLORS[resourceKey]

  icon.lineStyle(1.2, 0x1b2230, 0.9)
  icon.fillStyle(color, 1)

  if (resourceKey === 'iron') {
    icon.fillRect(-size, -size, size * 2, size * 2)
    icon.strokeRect(-size, -size, size * 2, size * 2)
  } else if (resourceKey === 'helium3') {
    icon.fillCircle(0, 0, size)
    icon.strokeCircle(0, 0, size)
  } else {
    const diamond = [
      { x: 0, y: -size - 1 },
      { x: size + 1, y: 0 },
      { x: 0, y: size + 1 },
      { x: -size - 1, y: 0 }
    ]
    icon.fillPoints(diamond, true)
    icon.strokePoints(diamond, true)
  }

  icon.setPosition(x, y)
  return icon
}

function createResourceHudBoxes (scene, x, y, options = {}) {
  const gap = options.gap ?? 10
  const iconOffsetX = options.iconOffsetX ?? 12
  const iconOffsetY = options.iconOffsetY ?? 11
  const paddingX = options.paddingX ?? 22
  const paddingY = options.paddingY ?? 4
  const style = options.style ?? { color: '#000000', fontSize: 16, fontFamily: 'sans-serif' }
  const items = {}
  let xOffset = x

  for (const resourceKey of RESOURCE_TYPES) {
    const label = createHudText(
      scene,
      xOffset + paddingX,
      y,
      RESOURCE_LABELS[resourceKey] + ': 0',
      style,
      { paddingX, paddingY }
    )
    const icon = createResourceIcon(scene, resourceKey, label.hudBox.x + iconOffsetX, y + iconOffsetY, 5)
    icon.setDepth(label.depth)

    items[resourceKey] = { label, icon }
    xOffset = label.hudBox.x + label.hudBox.width + gap
  }

  return {
    items,
    x,
    y,
    gap,
    paddingX,
    iconOffsetX,
    iconOffsetY
  }
}

function updateResourceHudBoxes (resourceHudBoxes, amountGetter = getResourceAmount) {
  let xOffset = resourceHudBoxes.x

  for (const resourceKey of RESOURCE_TYPES) {
    const hudItem = resourceHudBoxes.items[resourceKey]
    if (!hudItem) {
      continue
    }

    hudItem.label.setText(RESOURCE_LABELS[resourceKey] + ': ' + amountGetter(resourceKey))
    hudItem.label.setPosition(xOffset + resourceHudBoxes.paddingX, resourceHudBoxes.y)
    syncHudTextBox(hudItem.label)
    hudItem.icon.setPosition(hudItem.label.hudBox.x + resourceHudBoxes.iconOffsetX, resourceHudBoxes.y + resourceHudBoxes.iconOffsetY)

    xOffset = hudItem.label.hudBox.x + hudItem.label.hudBox.width + resourceHudBoxes.gap
  }
}

function setResourceHudCostHighlight (resourceHudBoxes, cost = null) {
  const hasCost = !!cost

  for (const resourceKey of RESOURCE_TYPES) {
    const hudItem = resourceHudBoxes.items[resourceKey]
    if (!hudItem) {
      continue
    }

    const isHighlighted = hasCost && (cost[resourceKey] ?? 0) > 0
    if (isHighlighted) {
      hudItem.label.hudBox.setFillStyle(RESOURCE_COLORS[resourceKey], 0.25)
      hudItem.label.hudBox.setStrokeStyle(2, RESOURCE_COLORS[resourceKey], 1)
      hudItem.icon.setScale(1.3)
      hudItem.label.setColor('#ffffff')
    } else {
      hudItem.label.hudBox.setFillStyle(0xffffff, 0.55)
      hudItem.label.hudBox.setStrokeStyle(1, 0x000000, 0.25)
      hudItem.icon.setScale(1)
      hudItem.label.setColor('#000000')
    }
  }
}

export {
  createResourceIcon,
  createResourceHudBoxes,
  updateResourceHudBoxes,
  setResourceHudCostHighlight
}
