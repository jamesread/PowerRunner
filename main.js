class GameState {
  constructor() {
    this.level = 1
    this.coins = 25
    this.girderValue = 20
    this.endGirderCount = 1
    this.playerSpeed = 70
    this.playerMaxHealth = 100
    this.playerCurrentHealth = this.playerMaxHealth
  }
}

class ShopItem {
  constructor() {
    this.level = 1
    console.log("creating shop item")
  }

  getLevel() {
    return this.level
  }
}

class ShopItemEndGirderCount extends ShopItem {
  onBuy() {
    window.gameState.endGirderCount++
  }

  getName() {
    return "Extra End Girder"
  }

  getCost() {
    return this.level * 70
  }
}

class ShopItemRepair extends ShopItem {
  onBuy() {
    window.gameState.playerCurrentHealth = Math.min(window.gameState.playerCurrentHealth + 30, window.gameState.playerMaxHealth)
  }

  getCost() {
    return 30
  }

  getName() {
    return "Repair 30 HP"
  }
}

class ShopItemSpeed extends ShopItem {
  onBuy() {
    window.gameState.playerSpeed += 30
  }

  getName() {
    return "Speed"
  }

  getCost() {
    return this.level * 30
  }
}

class ShopItemRefinery extends ShopItem {
  onBuy() {
    window.gameState.girderValue += 5
  }

  getName() {
    return "Refinery"
  }

  getCost() {
    return this.level * 45
  }
}

class ShopItemHealth extends ShopItem {
  onBuy() {
    window.gameState.playerMaxHealth += 50
  }

  getName() {
    return "Max HP +50"
  }

  getCost() {
    return Math.floor((this.level * 3) * 14)
  }
}

import Phaser from 'phaser'

class DeathScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'death',
      active: false,
    })
  }

  create() {
    this.txtTitle = this.add.text(300, 10, "GAME OVER", {fontSize: 30, color: "black" })
    this.txtTitle = this.add.text(300, 200, "Ending Level: " + window.gameState.level, {fontSize: 30, color: "black" })
  }
}

class BonusScene extends Phaser.Scene {
  constructor() {
    super({
      key: "bonus",
      active: false,
    })
  }

  create() {
    this.txtTitle = this.add.text(300, 10, "Bonus!", {fontSize: 30, color: "black" })
    this.txt = this.add.text(300, 300, "?", {fontFamily: "sans-serif", fontSize: 42, color: "black" })

    this.block = this.add.rectangle(300, 500, 50, 50, 0x448833)

    this.animation = this.tweens.addCounter({
      from: -300,
      to: 300,
      yoyo: true,
      duration: 1000,
      persist: true,
      repeat: -1,
      onUpdate: (tween) => {
        this.block.setPosition(400 + (tween.getValue()), 400)
        this.block.setFillStyle(tween.getValue() * 100)
        this.txt.setText(Math.round(tween.getValue()))
      },
    })


    this.tweenGetBonus = this.tweens.addCounter({
      forom: 42,
      to: 60,
      yoyo: true,
      duration: 500,
      repeat: 1,
      start: false,
      onUpdate: (tween) => {
        this.txt.setFontSize(Math.round(tween.getValue()))
      }
    })

    this.input.on('pointerdown', (p) => {
      this.onPoint()
    })
  }

  onPoint() {
    this.animation.stop()
    this.tweenGetBonus.restart()

    window.gameState.coins += Math.round(this.animation.getValue())


    setTimeout(() => {
      this.scene.start('shop')
    }, 1000)
  }
}

class ShopScene extends Phaser.Scene {
  constructor() {
    super({
      key: "shop",
      active: false,
    })

    this.shopItems = []
    this.constructShopItem(new ShopItemSpeed())
    this.constructShopItem(new ShopItemRefinery())
    this.constructShopItem(new ShopItemHealth())
    this.constructShopItem(new ShopItemRepair())
    this.constructShopItem(new ShopItemEndGirderCount())
  }

  constructShopItem(i) {
    this.shopItems.push(i)
  }

  create() {
    var textStyle = {color: "#000000", fontSize: 16, fontFamily: "sens-serif"}

    this.txtCoins = this.add.text(10, 10, "coins", textStyle)
    this.txtHp = this.add.text(100, 10, "hp", textStyle)

    this.txtShopTitle = this.add.text(70, 120, "Shop", textStyle)
    this.txtShopTitle.setFontSize(30);

    this.btnNextLevel = this.createGuiButton('Start Level ' + window.gameState.level, () => { this.onBtnNextLevelClicked() }, {region: "br", style: "good"})

    this.createShopButtons()
  }

  onBtnNextLevelClicked() {
    this.scene.start("level")
  }

  onBtnSellCoinsClicked() {
    console.log("sell!!")
  }

  regionToAbsolute(position) {
    if (typeof(position.x) !== "undefined") {
      return position
    }

    if (position.region == "bl") {
      position.x = 250
      position.y = 500
    }

    if (position.region == "br") {
      position.x = this.sys.game.canvas.width - 150;
      position.y = this.sys.game.canvas.height - 50;
    }

    return position
  }

  applyColorsFromProps(props, btn) {
    var ret = 0x333333

    if (props.style == "good") {
      ret = 0x005000
    }

    return ret
   }

  createGuiButton(name, onclick, props) {
    let position = this.regionToAbsolute(props)
    const x = position.x
    const y = position.y

    const btn = this.add.rectangle(x, y, 250, 50, 0x000000)
    btn.setInteractive()

    btn.updateColors = (col) => {
      btn.bgInactive = col
      btn.setFillStyle(col)

      btn.bgHover = btn.bgInactive * 2
      btn.bgFocus = btn.bgInactive / 3
    }

    btn.updateColors(this.applyColorsFromProps(props))

    btn.label = this.add.text(x, y, name, {fontFamily: "sans-serif", fontSize: 16, color: "#ffffff"})
    btn.label.setPosition(x - btn.label.width / 2, y - (16/2))

    btn.on('pointerover', () => {
      btn.setFillStyle(btn.bgHover);
    })

    btn.on('pointerout', () => {
      btn.setFillStyle(btn.bgInactive);
    })

    btn.on('pointerdown', () => {
      btn.setFillStyle(btn.bgFocus);
      onclick()
    })

    btn.on('pointerup', () => {
      btn.setFillStyle(btn.bgInactive);
    })

    return btn
  }

  createShopButtons() {
    var y = 200;

    for (let item of this.shopItems) {
      var btn = this.createGuiButton("", () => {
        var cost = item.getCost()

        if (cost <= window.gameState.coins) {
          window.gameState.coins -= cost

          item.level++
          item.onBuy()
        }

        this.refreshShopButtons()
      }, {"x": 200, "y": y})

      item.button = btn

      y += 60
    }

    this.refreshShopButtons()
  }

  refreshShopButtons() {
    for (let item of this.shopItems) {
      if (item.getCost() > window.gameState.coins) {
        item.button.updateColors(0x990000)
      } else {
        item.button.updateColors(0x009900)
      }

      item.button.label.setText(item.getName() + " Level " + item.getLevel() + " (" + item.getCost() + " coins)")
      item.button.label.setPosition(item.button.x - item.button.label.width / 2, item.button.y - (16/2))
    }
  }

  update() {
    this.txtCoins.setText("Coins: " + window.gameState.coins)

    this.txtHp.setText("Health: " + window.gameState.playerCurrentHealth + " / " + window.gameState.playerMaxHealth)
  }
}

function randomBool() {
  return Math.random() < .5
}

class LevelScene extends Phaser.Scene {
  constructor() {
    super({
      key: "level"
    });

    this.destructableGirdersRemaining = 0;
  }

  create() {
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => { this.quitLevel() });

    this.createFloor();
    this.createPlayer();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.usingCursors = false;

    this.endGirderCount = window.gameState.endGirderCount

    this.createHud()

    this.nextLevel()

    this.girderSpeed = 130 + (this.level * 5);
  }

  quitLevel() {
    this.scene.start("shop")
  }

  nextLevel() {
    this.levelUpAnimation.restart()
    this.tweenLevelCounter.restart();

    this.level = window.gameState.level // temporary hack until all references are updated
    window.gameState.level++;

    this.countGoodGirdersMissed = 0;

    var girderCount = this.level * 2;
    var girderInterval = 900 - (this.level / 5);

    for (let i = 0; i < girderCount; i++) {
      setTimeout(() => {
        this.createGirder(true)
      }, i * girderInterval)
    }

    this.destructableGirdersRemaining = girderCount
  }

  createHud() {
    var textStyle = {color: "#000000", fontSize: 16, fontFamily: "sens-serif"}

    this.txtCoins = this.add.text(10, 10, "coins", textStyle)
    this.txtCoins.setShadow(1, 1, '#ffffff')
    this.txtLevel = this.add.text(300, 10, "lvl", textStyle)
    this.txtHp = this.add.text(100, 10, "hp", textStyle)

    this.tweenLevelCounter = this.tweens.addCounter({
      from: 0,
      to: 1,
      yoyo: true,
      duration: 200,
      onUpdate: (tween) => {
        this.txtLevel.setFontSize(16 + (3 * tween.getValue()))
      },
    })

    this.txtGirders = this.add.text(400, 10, "girders", textStyle)

    this.txtLevelUp = this.add.text(-200, 30, "LEVEL UP!", {
      color: "limegreen",
      fontSize: 32,
      fontFamily: "impact",
    })

    this.txtLevelUp.setShadow(2, 2)

    this.levelUpAnimation = this.tweens.chain({
      targets: this.txtLevelUp,
      tweens: [
        {
          x: 200,
          duration: 500,
          repeat: 0,
          hold: 1500,
          ease: 'quad.in',
        },
        {
          x: -200, 
          duration: 2000,
          repeat: 0,
          hold: 0,
          ease: 'quad.out',
        }
      ]
    })

    this.tweenCoinsChanged = this.tweens.addCounter({
      from: 0,
      to: 1,
      yoyo: true,
      repeat: 0,
      persist: true,
      duration: 100,
      onUpdate: (tween) => {
        this.txtCoins.setFontSize(16 + (3 * tween.getValue()))
      }
    })

    this.tweenHpChanged = this.tweens.addCounter({
      from: 0,
      to: 1,
      yoyo: true,
      repeat: 0,
      persist: true,
      duration: 100,
      onUpdate: (tween) => {
        this.txtHp.setFontSize(16 + (3 * tween.getValue()))

        let r = parseInt((window.gameState.playerCurrentHealth / window.gameState.playerMaxHealth) * 100)
        r = 100 - r
        r = Math.max(10, r)
        r = Math.min(99, r)
        r = "#" + r.toString() + "0000"

        this.txtHp.setColor(r)
      }
    });
  }

  addCoins(v) {
    window.gameState.coins += v
    this.tweenCoinsChanged.restart()
  }

  changeHealth(x) {
    window.gameState.playerCurrentHealth += x

    if (window.gameState.playerCurrentHealth <= 0) {
      this.scene.start('death')
    }

    this.tweenHpChanged.restart()
  }

  createFloor() {
    var w = this.sys.game.canvas.width;
    var h = 5;
    var rect = new Phaser.Geom.Rectangle(0, 0, w, 5)

    this.floor = this.add.graphics({fillStyle: { color: 0x000099 }})
    this.floor.fillRectShape(rect)
    this.physics.world.enable(this.floor)
    this.floor.setPosition(0, this.sys.game.canvas.height - 2)
    this.floor.body.setImmovable(true)
    this.floor.body.setSize(w, h)
  }

  createGirder(isDestructable) {
    var w = 100
    var h = 20
    var x = Math.random() * (this.sys.game.canvas.width - 100)
    var isGood = randomBool()
    var color = isGood ? 0x009900 : 0x990000

    if (!isDestructable) {
      x = 0
      w = this.sys.game.canvas.width
      color = 0x000000
    }

    var rect = new Phaser.Geom.Rectangle(0, 0, w, h)

    this.girder = this.add.graphics()
    this.girder.isGood = isGood
    this.girder.isDestructable = isDestructable
    this.girder.fillStyle(color)
    this.girder.fillRectShape(rect)
    this.physics.world.enable(this.girder);
    this.girder.setPosition(x, 100)
    this.girder.body.setSize(w, h)

    this.girder.body.setVelocityY(this.girderSpeed)

    this.physics.add.collider(this.girder, this.player, (g, p) => { this.onGirderCollidePlayer(g, p) } )
    this.physics.add.collider(this.girder, this.floor, (g, f) => { this.onGirderCollideFloor(g, f) } )
  }

  createEndGirder() {
    this.endGirderCount--

    this.girderSpeed += (50 * this.endGirderCount)

    this.createGirder(false)
  }


  onGirderCollidePlayer(girder, player) {
    girder.destroy();

    if (girder.isDestructable) {
      if (girder.isGood) {
        this.addCoins(window.gameState.girderValue)
      } else {
        this.addCoins(-10)
        this.changeHealth(-10)
      }
    } else {
      this.tweenHpChanged.restart()
      this.addCoins(window.gameState.girderValue)
    }

    this.onGirderDestroyed(girder.isDestructable)
  }

  onGirderCollideFloor(girder, floor) {
    girder.destroy();

    if (girder.isGood) {
      this.countGoodGirdersMissed++
    }

    this.onGirderDestroyed(girder.isDestructable)
  }

  onGirderDestroyed(isDestructable) {
    if (isDestructable) {
      this.destructableGirdersRemaining--;
    }

    if (this.destructableGirdersRemaining == 0 && this.level < 50) {
      if (this.endGirderCount > 0) {
        this.createEndGirder()
      } else {
        if (this.countGoodGirdersMissed == 0) {
          this.scene.start("bonus")
        } else {
          this.scene.start("shop")
        }
      }
    }
  }

  createPlayer() {
    var tri = Phaser.Geom.Triangle.BuildEquilateral(35, 0, 70);

    this.player = this.add.graphics({lineStyle: { width: 2, color: 0x0 }})
    this.player.strokeTriangleShape(tri)

    this.physics.world.enable(this.player)

    this.player.body.setAllowGravity(false)
    this.player.body.setSize(70, 60)
    this.player.body.setCollideWorldBounds(true)
//    this.player.body.setImovable(true)
    this.player.setPosition((this.sys.game.canvas.width / 2) - 70, this.sys.game.canvas.height - 100)

    this.input.on('pointerdown', (p) => {
      let isLeft = p.x < (this.sys.game.canvas.width / 2);
      self.usingCursors = false

      if (isLeft) {
        this.player.body.setVelocityX(-window.gameState.playerSpeed)
      } else {
        this.player.body.setVelocityX(window.gameState.playerSpeed)
      }
    })
    this.input.on('pointerup', () => {
      this.player.body.setVelocity(0)
    });
  }

  update() {
    const { left, right } = this.cursors;

    if (left.isDown) {
      this.player.body.setVelocityX(-window.gameState.playerSpeed)
      self.usingCursors = true
    } else if (right.isDown) {
      this.player.body.setVelocityX(window.gameState.playerSpeed)
      self.usingCursors = true
    } else if (self.usingCursors) {
      this.player.body.setVelocityX(0)
    }

    this.txtCoins.setText("Coins: " + window.gameState.coins)
    this.txtLevel.setText("Level: " + this.level)
    this.txtGirders.setText("Girders: " + this.destructableGirdersRemaining)
    this.txtHp.setText("Health: " + window.gameState.playerCurrentHealth + " / " + window.gameState.playerMaxHealth)
  }
}

export function main() {
  const config = {
    type: Phaser.AUTO,
    parent: 'gamearea',
    backgroundColor: '#dee3e7',
    scene: [ ShopScene, LevelScene, BonusScene, DeathScene ],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    autoRound: true,
    audio: {
      disableWebAudio: true,
    },
    physics: {
      default: 'arcade',
      arcade: {
        debug: true,
      },
    },
  }

  window.gameState = new GameState()
  new Phaser.Game(config)
}
