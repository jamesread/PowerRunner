import { Phaser } from '../phaser.js'

function isFullscreenAvailable (scene) {
  return scene.scale.fullscreen.available
}

function getFullscreenLabel (scene) {
  if (!isFullscreenAvailable(scene)) {
    return 'Unavailable'
  }

  return scene.scale.isFullscreen ? 'On' : 'Off'
}

function toggleGameFullscreen (scene) {
  if (!isFullscreenAvailable(scene)) {
    return false
  }

  scene.scale.toggleFullscreen()
  return true
}

function registerFullscreenRefresh (scene, callback) {
  scene.scale.on('enterfullscreen', callback, scene)
  scene.scale.on('leavefullscreen', callback, scene)
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off('enterfullscreen', callback, scene)
    scene.scale.off('leavefullscreen', callback, scene)
  })
}

export {
  isFullscreenAvailable,
  getFullscreenLabel,
  toggleGameFullscreen,
  registerFullscreenRefresh
}
