import { GameState } from '../state/GameState.js'
import {
  TECH_TREE_ORIGIN_X,
  TECH_TREE_ORIGIN_Y,
  TECH_TREE_COL_WIDTH,
  TECH_TREE_ROW_HEIGHT,
  TECH_TREE_LAYOUT
} from '../constants/techTree.js'

function getTechTreeNodePosition (techId) {
  const node = TECH_TREE_LAYOUT[techId]

  if (!node) {
    return { x: TECH_TREE_ORIGIN_X, y: TECH_TREE_ORIGIN_Y }
  }

  return {
    x: TECH_TREE_ORIGIN_X + (node.col * TECH_TREE_COL_WIDTH),
    y: TECH_TREE_ORIGIN_Y + (node.row * TECH_TREE_ROW_HEIGHT)
  }
}

function isMenuButtonNavigable (btn) {
  if (!btn) {
    return false
  }

  if (btn.isNavigable === false) {
    return false
  }

  if (btn.active === false) {
    return false
  }

  return true
}

function isMenuButtonPurchasable (btn) {
  if (!btn) {
    return false
  }

  if (btn.isPurchasable !== undefined) {
    return btn.isPurchasable
  }

  return btn.isEnabled !== false
}

function getMenuButtonPosition (btn) {
  if (!btn) {
    return null
  }

  const x = btn.baseX ?? btn.x
  const y = btn.baseY ?? btn.y

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null
  }

  return { x, y }
}

function findInitialMenuSelectionIndex (buttons) {
  let bestIndex = -1
  let bestY = Infinity
  let bestX = Infinity

  for (let i = 0; i < buttons.length; i++) {
    if (!isMenuButtonNavigable(buttons[i])) {
      continue
    }

    const pos = getMenuButtonPosition(buttons[i])

    if (!pos) {
      continue
    }

    if (pos.y < bestY || (pos.y === bestY && pos.x < bestX)) {
      bestY = pos.y
      bestX = pos.x
      bestIndex = i
    }
  }

  return bestIndex
}

const MENU_NAV_PERPENDICULAR_WEIGHT = 1000

function scoreDirectionalScreenMove (current, candidate, direction) {
  const dx = candidate.x - current.x
  const dy = candidate.y - current.y

  if (direction === 'up' && dy >= 0) {
    return null
  }

  if (direction === 'down' && dy <= 0) {
    return null
  }

  if (direction === 'left' && dx >= 0) {
    return null
  }

  if (direction === 'right' && dx <= 0) {
    return null
  }

  if (direction === 'up' || direction === 'down') {
    return (Math.abs(dx) * MENU_NAV_PERPENDICULAR_WEIGHT) + Math.abs(dy)
  }

  return (Math.abs(dy) * MENU_NAV_PERPENDICULAR_WEIGHT) + Math.abs(dx)
}

function isBetterDirectionalScore (next, best) {
  if (best === null) {
    return true
  }

  return next < best
}

function findMenuSelectionInDirection (buttons, currentIndex, direction) {
  if (!buttons?.length) {
    return -1
  }

  if (currentIndex < 0) {
    currentIndex = findInitialMenuSelectionIndex(buttons)

    if (currentIndex < 0) {
      return -1
    }
  }

  const current = getMenuButtonPosition(buttons[currentIndex])

  if (!current) {
    return currentIndex
  }

  let bestIndex = -1
  let bestScore = null

  for (let i = 0; i < buttons.length; i++) {
    if (i === currentIndex) {
      continue
    }

    if (!isMenuButtonNavigable(buttons[i])) {
      continue
    }

    const candidate = getMenuButtonPosition(buttons[i])

    if (!candidate) {
      continue
    }

    const score = scoreDirectionalScreenMove(current, candidate, direction)

    if (!score) {
      continue
    }

    if (isBetterDirectionalScore(score, bestScore)) {
      bestScore = score
      bestIndex = i
    }
  }

  return bestIndex >= 0 ? bestIndex : currentIndex
}

function startNewGame (fromScene) {
  window.gameState = new GameState()
  const mothershipScene = fromScene.scene.get('mothership')

  if (mothershipScene?.shopItems) {
    for (const item of mothershipScene.shopItems) {
      item.level = 0
    }
  }

  fromScene.scene.start('mothership')
}

function applySimpleMenuButtonFocus (menuButton, focused) {
  const btn = menuButton?.btn

  if (!btn) {
    return
  }

  if (focused) {
    btn.setStrokeStyle(3, 0xd6ecff, 1)
    btn.setFillStyle(0x3f7b49)
    return
  }

  btn.setStrokeStyle(2, 0x3f7b49, 0.9)
  btn.setFillStyle(0x2b5e35)
}

function createSimpleMenuButton (scene, x, y, label, onClick, options = {}) {
  const width = options.width ?? 240
  const height = options.height ?? 52
  const shadow = scene.add.rectangle(x + 2, y + 3, width, height, 0x121820, 0.35)
  shadow.setStrokeStyle(1, 0x000000, 0.25)
  shadow.setDepth(10)

  const btn = scene.add.rectangle(x, y, width, height, 0x2b5e35)
  btn.setStrokeStyle(2, 0x3f7b49, 0.9)
  btn.setInteractive({ useHandCursor: true })
  btn.setDepth(11)
  btn.isNavigable = true
  btn.baseX = x
  btn.baseY = y

  const text = scene.add.text(x, y, label, {
    fontFamily: 'sans-serif',
    fontSize: 18,
    color: '#ffffff'
  })
  text.setOrigin(0.5)
  text.setDepth(12)

  const menuButton = { btn, text, shadow }
  let focused = options.focused === true

  const setFocused = (nextFocused) => {
    focused = nextFocused
    applySimpleMenuButtonFocus(menuButton, focused)
  }

  btn.on('pointerover', () => {
    applySimpleMenuButtonFocus(menuButton, true)
  })
  btn.on('pointerout', () => {
    applySimpleMenuButtonFocus(menuButton, focused)
  })
  btn.on('pointerup', () => {
    onClick()
  })

  if (focused) {
    setFocused(true)
  }

  menuButton.setFocused = setFocused
  menuButton.isFocused = () => focused

  return menuButton
}

function layoutDeathScreen (scene) {
  const width = scene.scale.width || scene.sys.game.canvas.width
  const height = scene.scale.height || scene.sys.game.canvas.height
  const cx = width / 2
  const cy = height / 2

  scene.txtTitle.setPosition(cx, cy - 80)
  scene.txtLevel.setPosition(cx, cy - 28)
  scene.btnNewGame.btn.setPosition(cx, cy + 36)
  scene.btnNewGame.text.setPosition(cx, cy + 36)
  scene.btnNewGame.shadow.setPosition(cx + 2, cy + 39)
  scene.btnNewGame.btn.baseX = cx
  scene.btnNewGame.btn.baseY = cy + 36

  if (scene.starfield?.bg) {
    scene.starfield.bg.setSize(width, height)
  }
}

export {
  getTechTreeNodePosition,
  getMenuButtonPosition,
  findInitialMenuSelectionIndex,
  findMenuSelectionInDirection,
  isMenuButtonNavigable,
  isMenuButtonPurchasable,
  applySimpleMenuButtonFocus,
  startNewGame,
  createSimpleMenuButton,
  layoutDeathScreen
}
