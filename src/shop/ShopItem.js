class ShopItem {
  constructor () {
    this.level = 0
  }

  getTechId () {
    return null
  }

  getPrerequisites () {
    return []
  }

  getTechLevel () {
    return this.level
  }

  isUnlocked (shopItemsByTechId) {
    for (const req of this.getPrerequisites()) {
      const dependency = shopItemsByTechId[req.techId]

      if (!dependency || dependency.getTechLevel() < req.minLevel) {
        return false
      }
    }

    return true
  }

  getPrerequisiteHint (shopItemsByTechId) {
    for (const req of this.getPrerequisites()) {
      const dependency = shopItemsByTechId[req.techId]

      if (!dependency || dependency.getTechLevel() < req.minLevel) {
        const name = dependency?.getName?.() ?? req.techId
        return 'Requires ' + name + ' Lv ' + req.minLevel
      }
    }

    return ''
  }

  getMissingPrerequisites (shopItemsByTechId) {
    const missing = []

    for (const req of this.getPrerequisites()) {
      const dependency = shopItemsByTechId[req.techId]

      if (!dependency || dependency.getTechLevel() < req.minLevel) {
        missing.push({
          techId: req.techId,
          minLevel: req.minLevel,
          dependency
        })
      }
    }

    return missing
  }

  getLevel () {
    return this.level
  }

  canBuy () {
    return true
  }

  hasLevel () {
    return true
  }
}

export { ShopItem }
