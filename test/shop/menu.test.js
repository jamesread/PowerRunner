import { describe, it, expect } from 'vitest'
import {
  getTechTreeNodePosition,
  getMenuButtonPosition,
  findInitialMenuSelectionIndex,
  findMenuSelectionInDirection,
  isMenuButtonNavigable,
  isMenuButtonPurchasable
} from '@/shop/menu.js'
import {
  TECH_TREE_ORIGIN_X,
  TECH_TREE_ORIGIN_Y,
  TECH_TREE_COL_WIDTH,
  TECH_TREE_ROW_HEIGHT
} from '@/constants/techTree.js'

describe('getTechTreeNodePosition', () => {
  it('returns layout coordinates for known tech ids', () => {
    const pos = getTechTreeNodePosition('tractor')

    expect(pos.x).toBe(TECH_TREE_ORIGIN_X + TECH_TREE_COL_WIDTH)
    expect(pos.y).toBe(TECH_TREE_ORIGIN_Y)
  })

  it('falls back to origin for unknown tech ids', () => {
    const pos = getTechTreeNodePosition('missing')

    expect(pos.x).toBe(TECH_TREE_ORIGIN_X)
    expect(pos.y).toBe(TECH_TREE_ORIGIN_Y)
  })
})

describe('menu button helpers', () => {
  it('respects explicit navigable and purchasable flags', () => {
    expect(isMenuButtonNavigable({ isNavigable: false })).toBe(false)
    expect(isMenuButtonPurchasable({ isPurchasable: false })).toBe(false)
  })

  it('allows focus on disabled buttons while blocking activation', () => {
    expect(isMenuButtonNavigable({ isEnabled: false })).toBe(true)
    expect(isMenuButtonNavigable({ isNavigable: false, isEnabled: true })).toBe(false)
    expect(isMenuButtonPurchasable({ isEnabled: false })).toBe(false)
  })

  it('defaults purchasable to enabled buttons when flags are absent', () => {
    expect(isMenuButtonPurchasable({ isEnabled: true })).toBe(true)
  })

  it('returns false for missing buttons', () => {
    expect(isMenuButtonNavigable(null)).toBe(false)
    expect(isMenuButtonPurchasable(undefined)).toBe(false)
  })

  it('reads button positions from baseX/baseY so selection lift does not skew navigation', () => {
    expect(getMenuButtonPosition({ baseX: 118, baseY: 188, x: 118, y: 183 })).toEqual({ x: 118, y: 188 })
    expect(getMenuButtonPosition({ x: 10, y: 20 })).toEqual({ x: 10, y: 20 })
  })
})

function makePositionedButton (x, y, options = {}) {
  return {
    isNavigable: true,
    x,
    y,
    ...options
  }
}

function makeTechButton (techId) {
  const pos = getTechTreeNodePosition(techId)

  return makePositionedButton(pos.x, pos.y, {
    shopItem: { getTechId: () => techId },
    baseX: pos.x,
    baseY: pos.y
  })
}

describe('directional menu navigation', () => {
  const buttons = [
    makeTechButton('speed'),
    makeTechButton('health'),
    makeTechButton('tractor'),
    makeTechButton('scanner'),
    makeTechButton('nanobots'),
    makeTechButton('grapple')
  ]

  it('selects the top-left button as the initial focus target', () => {
    expect(findInitialMenuSelectionIndex(buttons)).toBe(0)
    expect(findInitialMenuSelectionIndex([
      makePositionedButton(300, 200),
      makePositionedButton(100, 150),
      makePositionedButton(120, 150)
    ])).toBe(1)
  })

  it('moves down to the item below even when the current button is visually lifted', () => {
    buttons[0].y = buttons[0].baseY ?? buttons[0].y - 5

    expect(findMenuSelectionInDirection(buttons, 0, 'down')).toBe(1)
  })

  it('moves up and down to the nearest button on screen', () => {
    const healthIndex = 1

    expect(findMenuSelectionInDirection(buttons, healthIndex, 'up')).toBe(0)
    expect(findMenuSelectionInDirection(buttons, healthIndex, 'down')).toBe(4)
  })

  it('moves left and right to the nearest button on screen', () => {
    const healthIndex = 1

    expect(findMenuSelectionInDirection(buttons, healthIndex, 'right')).toBe(3)
    expect(findMenuSelectionInDirection(buttons, healthIndex, 'left')).toBe(healthIndex)
  })

  it('prefers same-row neighbors when moving horizontally', () => {
    const withGrapple = [...buttons.slice(0, 5), makeTechButton('grapple'), makeTechButton('drill')]

    expect(findMenuSelectionInDirection(withGrapple, 5, 'right')).toBe(6)
  })

  it('moves from an implicit top-left start when nothing is selected', () => {
    expect(findMenuSelectionInDirection(buttons, -1, 'down')).toBe(1)
  })

  it('moves between chrome buttons on the same row before nearby off-row items', () => {
    const treeButtons = ['speed', 'health', 'tractor', 'scanner', 'nanobots', 'cargo'].map((techId) => makeTechButton(techId))
    const menuButtons = [
      ...treeButtons,
      makePositionedButton(110, 500, { baseX: 110, baseY: 500, titleLabel: { text: 'Fullscreen' } }),
      makePositionedButton(900, 500, { baseX: 900, baseY: 500, titleLabel: { text: 'Undock' } })
    ]
    const fullscreenIndex = menuButtons.length - 2
    const undockIndex = menuButtons.length - 1
    const cargoIndex = 5

    expect(findMenuSelectionInDirection(menuButtons, fullscreenIndex, 'right')).toBe(undockIndex)
    expect(findMenuSelectionInDirection(menuButtons, undockIndex, 'left')).toBe(fullscreenIndex)
    expect(findMenuSelectionInDirection(menuButtons, fullscreenIndex, 'up')).toBe(4)
    expect(findMenuSelectionInDirection(menuButtons, cargoIndex, 'down')).toBe(undockIndex)
    expect(findMenuSelectionInDirection(menuButtons, fullscreenIndex, 'left')).toBe(fullscreenIndex)
    expect(findMenuSelectionInDirection(menuButtons, undockIndex, 'right')).toBe(undockIndex)
  })

  it('moves vertically through stacked pause menu buttons', () => {
    const pauseButtons = [
      makePositionedButton(400, 300),
      makePositionedButton(400, 360)
    ]

    expect(findMenuSelectionInDirection(pauseButtons, 0, 'down')).toBe(1)
    expect(findMenuSelectionInDirection(pauseButtons, 1, 'up')).toBe(0)
    expect(findMenuSelectionInDirection(pauseButtons, 0, 'left')).toBe(0)
  })
})
