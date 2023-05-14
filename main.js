class GameState {
  constructor() {
    this.coins = 0
  }
}

class ShopScene extends Phaser.Scene {
  constructor() {
    super({
      key: "shop",
      active: false,
    })

    this.countShopItems = 0
  }

  create() {
    let textStyle = {color: "#000000", fontSize: 16, fontFamily: "sens-serif"}

    this.txtCoins = this.add.text(10, 10, "coins", textStyle)
    this.txtShopTitle = this.add.text(300, 10, "Shop", textStyle)
    this.txtShopTitle.setFontSize(30);
    
    this.btnClose = this.createGuiButton("Close", this.onBtnCloseClicked, {region: "bl"})
    this.btnSellCoins = this.createGuiButton("Sell", this.onBtnSellCoinsClicked, {region: "br"})

    this.createShopItem("speed", 100)
    this.createShopItem("armour", 50)
  }
  
  onBtnCloseClicked() {
    console.log("close")
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
      position.x = 550
      position.y = 500
    }

    return position
  }

  createGuiButton(name, onclick, position) {
    const colorBgInactive = 0x333333
    const colorBgHover = 0x555555
    const colorBgClick = 0x666666

    position = this.regionToAbsolute(position)
    const x = position.x
    const y = position.y

    const btn = this.add.rectangle(x, y, 250, 50, colorBgInactive)
    btn.setInteractive()

    let txt = this.add.text(x, y, name, {fontFamily: "sans-serif", fontSize: 16, color: "#ffffff"})
    txt.setPosition(x - txt.width / 2, y - (16/2))

    btn.on('pointerover', () => {
      btn.setFillStyle(colorBgHover);
    })

    btn.on('pointerout', () => {
      btn.setFillStyle(colorBgInactive);
    })

    btn.on('pointerdown', () => {
      btn.setFillStyle(colorBgClick);
      onclick()
    })

    btn.on('pointerup', () => {
      btn.setFillStyle(colorBgInactive);
    })

    return btn
  }

  createShopItem(name, cost) {
    this.countShopItems++;
    let y = 200 + (this.countShopItems * 60)
    this.createGuiButton(name + " (" + cost + ")", (cost) => {
      this.onBuy(cost)
    }, {"x": 200, "y": y})
  }

  onBuy(cost) {
    console.log("buy", cost)
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

    this.playerSpeed = 70;
    this.girderSpeed = 130;
    this.girdersRemaining = 0;

    // hud
    this.coins = 0;
    this.level = 0;
  }

  create() {
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => { this.quitLevel() });

    this.createFloor();
    this.createPlayer();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.usingCursors = false;

    this.createHud()

    this.nextLevel()
  }

  quitLevel() {
    this.scene.start("shop")
  }

  nextLevel() {
    this.levelUpAnimation.restart()
    this.tweenLevelCounter.restart();

    this.level++;

    let girderCount = this.level * 2;
    let girderInterval = 900 - (this.level / 5);

    for (let i = 0; i < girderCount; i++) {
      setTimeout(() => {
        this.createGirder()
      }, i * girderInterval)
    }

    this.girdersRemaining = girderCount
  }

  createHud() {
    let textStyle = {color: "#000000", fontSize: 16, fontFamily: "sens-serif"}

    this.txtCoins = this.add.text(10, 10, "coins", textStyle)
    this.txtLevel = this.add.text(200, 10, "lvl", textStyle)

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
  }

  createFloor() {
    let w = this.sys.game.canvas.width;
    let h = 5;
    let rect = new Phaser.Geom.Rectangle(0, 0, w, 5)

    this.floor = this.add.graphics({fillStyle: { color: 0x000099 }})
    this.floor.fillRectShape(rect)
    this.physics.world.enable(this.floor)
    this.floor.setPosition(0, this.sys.game.canvas.height - 2)
    this.floor.body.setImmovable(true)
    this.floor.body.setSize(w, h)
  }

  createGirder() {
    let w = 100
    let h = 20
    let rect = new Phaser.Geom.Rectangle(0, 0, w, h)

    this.girder = this.add.graphics()
    this.girder.isGood = randomBool()
    this.girder.fillStyle(this.girder.isGood ? 0x009900 : 0x990000 )
    this.girder.fillRectShape(rect)
    this.physics.world.enable(this.girder);
    this.girder.setPosition(Math.random() * (this.sys.game.canvas.width - 100), 100)
    this.girder.body.setSize(w, h)
    this.girder.body.setVelocityY(this.girderSpeed)

    this.physics.add.collider(this.girder, this.player, (g, p) => { this.onGirderCollidePlayer(g, p) } )
    this.physics.add.collider(this.girder, this.floor, (g, f) => { this.onGirderCollideFloor(g, f) } )
  }

  onGirderCollidePlayer(girder, player) {
    girder.destroy();

    if (girder.isGood) {
      this.coins += 5
    } else {
      this.coins -= 5
    }

    this.onGirderDestroyed()
  }

  onGirderCollideFloor(girder, floor) {
    girder.destroy();

    this.onGirderDestroyed()
  }

  onGirderDestroyed() {
    this.girdersRemaining--;

    if (this.girdersRemaining == 0 && this.level < 50) {
      this.scene.start("shop")
//      this.nextLevel()
    }
  }

  createPlayer() {
    let tri = Phaser.Geom.Triangle.BuildEquilateral(35, 0, 70);

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
        this.player.body.setVelocityX(-this.playerSpeed)
      } else {
        this.player.body.setVelocityX(this.playerSpeed)
      }
    })
    this.input.on('pointerup', () => {
      this.player.body.setVelocity(0)
    });
  }

  update() {
    const { left, right } = this.cursors;

    if (left.isDown) {
      this.player.body.setVelocityX(-this.playerSpeed)
      self.usingCursors = true
    } else if (right.isDown) {
      this.player.body.setVelocityX(this.playerSpeed)
      self.usingCursors = true
    } else if (self.usingCursors) {
      this.player.body.setVelocityX(0)
    }

    this.txtCoins.setText("Coins: " + this.coins)
    this.txtLevel.setText("Level: " + this.level)
    this.txtGirders.setText("Girders: " + this.girdersRemaining)
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'gamearea',
  backgroundColor: '#dee3e7',
  width: 800,
  height: 600,
  scene: [ LevelScene, ShopScene ],
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

new Phaser.Game(config)
