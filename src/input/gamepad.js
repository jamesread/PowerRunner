import { GAMEPAD_DEAD_ZONE } from '../constants/theme.js'

function getActiveGamepad (scene) {
  const plugin = scene.input?.gamepad
  if (!plugin?.total) {
    return null
  }

  return plugin.pad1 ?? plugin.getPad(0) ?? null
}

function readGamepadVertical (pad) {
  if (!pad) {
    return 0
  }

  const stickY = Math.abs(pad.leftStick.y) >= GAMEPAD_DEAD_ZONE ? pad.leftStick.y : 0
  if (stickY !== 0) {
    return stickY > 0 ? 1 : -1
  }

  if (pad.up) {
    return -1
  }

  if (pad.down) {
    return 1
  }

  return 0
}

function readGamepadHorizontal (pad) {
  if (!pad) {
    return 0
  }

  const stickX = Math.abs(pad.leftStick.x) >= GAMEPAD_DEAD_ZONE ? pad.leftStick.x : 0
  if (stickX !== 0) {
    return stickX > 0 ? 1 : -1
  }

  if (pad.right) {
    return 1
  }

  if (pad.left) {
    return -1
  }

  return 0
}

function isGamepadPausePressed (pad) {
  if (!pad?.buttons) {
    return false
  }

  return !!(pad.buttons[8]?.pressed || pad.buttons[9]?.pressed)
}

function isGamepadScannerHeld (pad) {
  return (pad?.L1 ?? 0) >= 0.5
}

function isGamepadTractorHeld (pad) {
  return (pad?.R1 ?? 0) >= 0.5
}

export {
  getActiveGamepad,
  readGamepadVertical,
  readGamepadHorizontal,
  isGamepadPausePressed,
  isGamepadScannerHeld,
  isGamepadTractorHeld
}
