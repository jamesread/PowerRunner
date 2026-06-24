import { readGamepadVertical, readGamepadHorizontal } from './gamepad.js'
import { GAMEPAD_MENU_REPEAT_MS } from '../constants/theme.js'

function resolveMenuNavigationDirection (pad) {
  if (!pad) {
    return null
  }

  const vertical = readGamepadVertical(pad)
  const horizontal = readGamepadHorizontal(pad)

  if (vertical < 0) {
    return 'up'
  }

  if (vertical > 0) {
    return 'down'
  }

  if (horizontal < 0) {
    return 'left'
  }

  if (horizontal > 0) {
    return 'right'
  }

  return null
}

function pollDirectionalMenuGamepad (delta, pad, state, onDirection) {
  if (!pad) {
    state.lastDirection = null
    state.holdMs = 0
    return
  }

  const direction = resolveMenuNavigationDirection(pad)

  if (direction === null) {
    state.lastDirection = null
    state.holdMs = 0
    return
  }

  if (direction !== state.lastDirection) {
    onDirection(direction)
    state.lastDirection = direction
    state.holdMs = 0
    return
  }

  state.holdMs += delta
  if (state.holdMs >= GAMEPAD_MENU_REPEAT_MS) {
    onDirection(direction)
    state.holdMs = 0
  }
}

function pollDirectionalMenuGamepadAction (pad, state, onAction) {
  if (!pad) {
    state.actionWasDown = false
    return
  }

  if (pad.A && !state.actionWasDown) {
    onAction()
  }

  state.actionWasDown = pad.A
}

export {
  resolveMenuNavigationDirection,
  pollDirectionalMenuGamepad,
  pollDirectionalMenuGamepadAction
}
