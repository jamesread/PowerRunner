function startMothershipTransition (scene, fromSceneKey, options = {}) {
  scene.scene.start('mothership', {
    flyIn: true,
    fromSceneKey,
    flyInStartX: options.flyInStartX,
    flyInStartY: options.flyInStartY
  })
}

export { startMothershipTransition }
