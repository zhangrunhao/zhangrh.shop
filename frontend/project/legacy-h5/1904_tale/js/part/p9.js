import Global from '../class/Global'
import Part from '../class/Part'
import util from '../util/util'
import Hilo from 'hilo'

var nh = 2069
var nsy = Global.height / nh // 按照y轴缩放
const p = Hilo.Class.create({
  Extends: Part,
  constructor: function (properties) {
    this.l1 = 500 // 公主滑动
    this.l2 = 800 // 放大舞台
    this.l3 = 800 // 卡牌旋转
    this.l4 = 900 // 画面旋转

    this.disappear = Global.height

    p.superclass.constructor.call(this, Hilo.Class.mix(properties, {
      name: 'p9',
      height: this.l1 + this.l2 + this.l3 + this.l4 + this.disappear,
      disappear: this.disappear
    }))
  },
  init: function () {
    new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 9, 'closebg.jpg')
    }).addTo(this.content)
    this.firstCar = new Hilo.Container({
      x: -380,
      scaleX: nsy,
      scaleY: nsy,
      alpha: 1
    }).addTo(this.content)
    this.initBg()
    this.initStar()
    this.initBalloon()
    this.initStage()
    this.initLittleManFont()
    this.initCardSprite()
    this.initCloseBookSprite()
  },
  shouldUpdate: function (th) {
    if (th < 0) {
      this.content.y = -th
    } else if (th < this.l1 + this.l2 + this.l3 + this.l4) {
      this.content.y = 0
    } else {
      this.next()
      this.content.y = -th + (this.l1 + this.l2 + this.l3 + this.l4)
    }
    this.excePrincess(th)
    this.exceZoomStage(th)
    this.checkoutStageAsset(th)
    this.exceCard(th)
    this.exceCloseBook(th)
  },
  exceCard: function (th) {
    var min = this.l1 + this.l2
    var max = this.l1 + this.l2 + this.l3
    if (th < min) th = min
    if (th > max) th = max

    if (th <= min) {
      this.cardSprite.alpha = 0
      this.princessCon.alpha = 1
    } else {
      this.cardSprite.alpha = 1
      this.princessCon.alpha = 0
    }

    var step = (th - min) * this.cardSprite.getNumFrames() / (max - min)
    step = parseInt(step)
    this.cardSprite.goto(step, true)
  },
  exceCloseBook: function (th) {
    var min = this.l1 + this.l2 + this.l3
    var max = this.l1 + this.l2 + this.l3 + this.l4
    if (th < min) th = min
    if (th > max) th = max

    if (th <= min) {
      this.closeBook.alpha = 0
      this.firstCar.alpha = 1
    } else {
      this.closeBook.alpha = 1
      this.firstCar.alpha = 0
    }

    var step = (th - min) * this.closeBook.getNumFrames() / (max - min)
    step = parseInt(step)
    this.closeBook.goto(step, true)
  },
  checkoutStageAsset: function (th) {
    if (th > this.l1) { // after
      if (this.balloon.state === 'stop') {
        this.balloon.start()
        this.balloon.state = 'playing'
      }

      this.spritePrincess.play()
      this.littleManFont.alpha = 1
      this.littleManBack.alpha = 1
      this.stage.alpha = 0

      this.stageBgAfter.alpha = 1
      this.stageBackAfter.alpha = 1
      this.stageFontAfter.alpha = 1

      this.stageBgBefore.alpha = 0
      this.stageBackBefore.alpha = 0
      this.stageFontBefore.alpha = 0
    } else {
      if (this.balloon.state === 'playing') {
        this.balloon.stop()
        this.balloon.state = 'stop'
      }

      this.spritePrincess.stop()
      this.littleManFont.alpha = 0
      this.littleManBack.alpha = 0
      this.stage.alpha = 1

      this.stageBgAfter.alpha = 0
      this.stageBackAfter.alpha = 0
      this.stageFontAfter.alpha = 0

      this.stageBgBefore.alpha = 1
      this.stageBackBefore.alpha = 1
      this.stageFontBefore.alpha = 1
    }
  },
  exceZoomStage: function (th) {
    var min = this.l1
    var max = this.l1 + this.l2
    if (th < min) th = min
    if (th > max) th = max
    this.firstCar.scaleX = (th - min) * (nsy - 1) / (max - min) + 1
    this.firstCar.scaleY = (th - min) * (nsy - 1) / (max - min) + 1
    this.firstCar.x = (th - min) * (-160 + 380) / (max - min) - 380
    this.firstCar.y = (th - min) / (max - min)
  },
  excePrincess: function (th) {
    if (th < 0) th = 0
    if (th > this.l1) th = this.l1
    var y = th * -650 / this.l1 + 650
    this.princessCon.y = y
  },
  initGound: function () {
    new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 9, 'ground1.png'),
      y: 1350
    }).addTo(this.firstCar)
    this.initPrincess()
  },
  initBg: function () {
    new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 9, 'bg.jpg')
    }).addTo(this.firstCar)
  },
  initStar: function () {
    var star1 = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 9, 'star1.png'),
      alpha: 1
    }).addTo(this.firstCar)
    Hilo.Tween.to(star1, {
      alpha: 0
    }, {
      duration: 2000,
      loop: true,
      reverse: true
    })
    var star2 = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 9, 'star2.png'),
      alpha: 0
    }).addTo(this.firstCar)
    Hilo.Tween.to(star2, {
      alpha: 1
    }, {
      duration: 2000,
      loop: true,
      reverse: true
    })
  },
  initStage: function () {
    this.stageBgBefore = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 9, 'before/stage_bg.png'),
      x: 300,
      y: 150,
      alpha: 1
    }).addTo(this.firstCar)
    this.stageBgAfter = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 9, 'after/stage_bg.png'),
      x: 50,
      y: 150,
      alpha: 1
    }).addTo(this.firstCar)

    new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 9, 'ground2.png'),
      y: 1050
    }).addTo(this.firstCar)
    this.stageBackBefore = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 9, 'before/stage_back.png'),
      y: 950,
      alpha: 1
    }).addTo(this.firstCar)
    this.stageBackAfter = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 9, 'after/stage_back.png'),
      y: 1000,
      alpha: 1
    }).addTo(this.firstCar)

    this.initGound()
    this.initLittleManBack()

    this.stageFontBefore = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 9, 'before/stage_font.png'),
      x: 126,
      y: 1120,
      alpha: 1
    }).addTo(this.firstCar)

    this.stageFontAfter = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 9, 'after/stage_font.png'),
      x: 280,
      y: 1230,
      alpha: 0
    }).addTo(this.firstCar)
  },
  initLittleManFont: function () {
    var frames = []
    for (var i = 0; i <= 7; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 9, `after/little_font/${i}.png`),
        rect: [0, 0, 1503, 1169]
      })
    }
    this.littleManFont = new Hilo.Sprite({
      frames: frames,
      y: 800,
      timeBased: true,
      interval: 200
    }).addTo(this.firstCar)
  },
  initLittleManBack: function () {
    var frames = []
    for (var i = 0; i <= 7; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 9, `after/little_back/${i}.png`),
        rect: [0, 0, 1503, 1169]
      })
    }
    this.littleManBack = new Hilo.Sprite({
      frames: frames,
      y: 900,
      timeBased: true,
      interval: 200
    }).addTo(this.firstCar)
  },
  initPrincess: function () {
    this.princessCon = new Hilo.Container().addTo(this.firstCar)
    this.stage = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 9, 'before/stage.png'),
      x: 300,
      y: 1020
    }).addTo(this.princessCon)

    var frames = []
    for (var i = 0; i <= 11; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 9, `after/princess/${i}.png`),
        rect: [0, 0, 958, 904]
      })
    }
    this.spritePrincess = new Hilo.Sprite({
      frames: frames,
      x: 300,
      y: 450,
      timeBased: true,
      interval: 100
    }).addTo(this.princessCon).stop()
  },
  initCardSprite: function () {
    var frames = []
    for (var i = 0; i <= 5; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 9, `card/${i}.png`),
        rect: [0, 0, 804, 1131]
      })
    }
    this.cardSprite = new Hilo.Sprite({
      frames: frames,
      x: 350,
      y: 320,
      alpha: 0
    }).addTo(this.firstCar).stop()
  },
  initCloseBookSprite: function () {
    var frames = []
    for (var i = 0; i <= 27; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 9, `close/${i}.png`),
        rect: [0, 0, 750, 1464]
      })
    }
    this.closeBook = new Hilo.Sprite({
      frames: frames,
      alpha: 0
    }).addTo(this.content).stop()
  },
  initBalloon: function () {
    var that = this
    this.balloon = new Hilo.ParticleSystem({
      state: 'stop',
      emitNum: 5,
      emitterX: 200,
      emitterY: 600,
      emitNumVar: 5,
      gx: 0,
      gy: 0,
      particle: {
        frame: [
          [0, 0, 120, 144],
          [120, 0, 110, 144],
          [230, 0, 100, 144],
          [330, 0, 110, 144],
          [440, 0, 110, 144],
          [550, 0, 100, 144]
        ],
        image: Global.asset.getAsset('s1', 9, 'balloon.png'),
        vx: -10,
        vy: -150,
        ax: 10,
        ay: 10,
        vxVar: 10,
        vyVar: 50,
        axVar: 10,
        // ayVar:100,
        life: 4.5,
        alphaV: -0.0005,

        scale: 1.0,
        scaleV: 0.004,
        scaleVVar: 0.00005
      }
    }).addTo(this.firstCar)
    Global.ticker.addTick({
      tick: function () {
        that.balloon.emitterX = util.RandomNumBoth(0, 2000)
      }
    })
  }
})
export default p
