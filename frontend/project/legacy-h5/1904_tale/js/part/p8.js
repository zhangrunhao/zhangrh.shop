import Global from '../class/Global'
import Part from '../class/Part'
import Hilo from 'hilo'

const p = Hilo.Class.create({
  Extends: Part,
  constructor: function (properties) {
    p.superclass.constructor.call(this, Hilo.Class.mix(properties, {
      name: 'p8',
      height: Global.height,
      disappear: Global.height
    }))
  },
  init: function () {
    this.initBg()
  },
  shouldUpdate: function (th) {
    this.content.y = -th
    this.exceDolphin(th)
    if (th < -this.getDisappearPrev()) {
      this.content.alpha = 0
    } else {
      this.content.alpha = 1
    }
    if (th > 0) this.next()
  },
  exceDolphin (th) {
    var min = -this.getDisappearPrev() || 1000
    var max = 0
    if (th < min) th = min
    if (th > max) th = max
    var numsStep = this.dolphin.getNumFrames()
    var step = (th - min) * numsStep / (max - min)
    this.dolphin.goto(parseInt(step), true)
  },
  initBg: function () {
    this['bg'] = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 8, 'bg.jpg')
    }).addTo(this.content)
    this.initkelpBlue()
    this['water'] = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 8, 'water.png')
    }).addTo(this.content)
    this.initkelpBlack()
    this.initFish()
    this['bg2'] = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 8, 'bg2.png')
    }).addTo(this.content)
    this.initDolphin()
    this['tail'] = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 8, 'fish_tail.png'),
      x: 335,
      y: 1160,
      pivotX: 55,
      pivotY: 120
    }).addTo(this.content)
    Hilo.Tween.to(this.tail, {
      rotation: 10
    }, {
      loop: true,
      reverse: true
    })
    this.initBubble()
    this.initHair()
    this.initEye()
  },
  initkelpBlack: function () {
    var frames = []
    for (var i = 0; i <= 14; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 8, `kelp_black/${i}.png`),
        rect: [0, 0, 750, 990]
      })
    }
    new Hilo.Sprite({
      frames: frames,
      timeBased: true,
      interval: 100
    }).addTo(this.content)
  },
  initkelpBlue: function () {
    var frames = []
    for (var i = 0; i <= 15; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 8, `kelp_blue/${i}.png`),
        rect: [0, 0, 750, 1104]
      })
    }
    new Hilo.Sprite({
      frames: frames,
      timeBased: true,
      interval: 100
    }).addTo(this.content)
  },
  initHair: function () {
    var frames = []
    for (var i = 0; i <= 15; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 8, `hair/${i}.png`),
        rect: [0, 0, 600, 600]
      })
    }
    new Hilo.Sprite({
      frames: frames,
      x: 100,
      y: 200,
      timeBased: true,
      interval: 100
    }).addTo(this.content)
  },
  initEye: function () {
    var frames = []
    for (var i = 0; i <= 11; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 8, `eye/${i}.png`),
        rect: [0, 0, 117, 100]
      })
    }
    new Hilo.Sprite({
      frames: frames,
      x: 310,
      y: 650,
      timeBased: true,
      interval: 150
    }).addTo(this.content)
  },
  initBubble: function () {
    this.bubble = new Hilo.ParticleSystem({
      emitNum: 5,
      emitterX: 375,
      emitterY: 1300,
      emitNumVar: 3,
      gx: 0,
      gy: -10,
      particle: {
        frame: [0, 0, Global.width, Global.height],
        image: Global.asset.getAsset('s1', 8, 'bubble.png'),
        vx: -5,
        vy: -100,
        ax: 10,
        ay: -100,
        vxVar: 100,
        vyVar: 3,
        axVar: 100,
        ayVar: 100,
        life: 3.5,
        alphaV: -0.005,
        scale: 0.08,
        scaleV: 0.004,
        scaleVVar: 0.0005,
        rotationVar: 60,
        rotationVVar: 2
      }
    }).addTo(this.content).start()
  },
  initFish: function () {
    this.fish = new Hilo.ParticleSystem({
      alpha: 0,
      emitNum: 5,
      emitterX: 900,
      emitterY: 300,
      emitNumVar: 3,
      gx: 0,
      gy: 0,
      particle: {
        image: Global.asset.getAsset('s1', 8, 'fish.png'),
        vx: -300,
        vy: -10,
        ax: 10,
        ay: 10,
        vxVar: 10,
        vyVar: 50,
        axVar: 100,
        ayVar: 100,
        life: 3.5,
        alphaV: -0.0005,
        scale: 0.07,
        scaleV: 0.004,
        scaleVVar: 0.0005
      }
    }).addTo(this.content).start()
  },
  initDolphin: function () {
    var frames = []
    for (var i = 24; i <= 59; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 8, `dolphin/${i}.png`),
        rect: [0, 0, 750, 2576]
      })
    }
    this['dolphin'] = new Hilo.Sprite({
      frames: frames,
      y: -1650
    }).addTo(this.content).stop()
    this['dolphinBg2'] = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 6, 'bg2.png'),
      y: -800
    }).addTo(this.content)
  }
})
export default p
