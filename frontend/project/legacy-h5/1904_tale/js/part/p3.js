import Global from '../class/Global'
import Part from '../class/Part'
import Hilo from 'hilo'

const p = Hilo.Class.create({
  Extends: Part,
  constructor: function (properties) {
    this.l1 = 1400 // 小女孩掉落的过程
    this.l2 = 0 // 啥也不干
    this.l3 = 600 // 开火车
    this.disappear = Global.width // 移动屏幕
    p.superclass.constructor.call(this, Hilo.Class.mix(properties, {
      name: 'p3',
      height: this.l1 + this.l2 + this.l3 + this.disappear,
      disappear: this.disappear
    }))
  },
  init: function () {
    this.content.pivotX = 500
    this.content.pivotY = 940
    this.content.x = 500
    this.content.y = 940
    this.content.scaleX = 0.1
    this.content.scaleY = 0.1
    this.initEdyy()
    this.initStar()
    this.initLizi()
    this.initGril()
    this.initTrain()
  },
  shouldUpdate: function (th) {
    this.zoomContainer(th)
    this.dropGril(th)
    this.goTrain(th)
    if (th > (this.l1 + this.l2 + this.l3)) {
      this.next()
    }
  },
  zoomContainer: function (th) {
    if (th < 0) {
      var scale = 1 - (-th / this.getDisappearPrev())
      this.eddy.background = null
      this.eddy.alpha = scale
      this.train.alpha = 0
      this.eddy.goto(1, true)
      this.content.scaleX = scale
      this.content.scaleY = scale
    } else {
      this.eddy.background = '#000'
      this.eddy.alpha = 1
      this.eddy.play()
      this.train.alpha = 1
      this.content.scaleX = 1
      this.content.scaleY = 1
    }
  },
  dropGril: function (th) {
    if (th < 0) {
      th = 0
    } else if (th > 0 && th < this.l1) {
      // th保持不变
    } else {
      th = this.l1
    }
    var rate = th / this.l1
    this['gril'].x = 650 - (650 * rate)
    this['gril'].y = (800 - 500) * rate + 500
    this['gril'].scaleX = rate
    this['gril'].scaleY = rate
  },
  goTrain (th) {
    var trainWidth = 2368
    var min = this.l1 + this.l2
    if (th < min) th = min

    if (th < min) {
      this.train.x = -trainWidth
    } else if (th > min && th < (min + this.l3)) {
      // 火车自己开出来
      this.train.x = trainWidth * (th - min) / this.l3 - trainWidth
    } else if (th > min + this.l3) {
      // 火车带着下一屏开走
      this.train.x = th - min - this.l3
    } else {
      this.train.x = -trainWidth
    }
  },
  initEdyy: function () {
    var frames = []
    for (var i = 0; i < 11; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 3, `eddy/${i}.png`),
        rect: [0, 0, 1714, 1808]
      })
    }
    this['eddy'] = new Hilo.Sprite({
      frames: frames,
      timeBased: true,
      interval: 100,
      x: -400,
      y: -100
    }).addTo(this.content).stop()
  },
  initStar: function () {
    this['star'] = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 3, 'star.png'),
      alpha: 0
    }).addTo(this.content)
    Hilo.Tween.to(this['star'], {
      alpha: 0.7
    }, {
      reverse: true,
      loop: true
    })

    this['star1'] = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 3, 'star1.png'),
      alpha: 0.4
    }).addTo(this.content)
    Hilo.Tween.to(this['star1'], {
      alpha: 0.9
    }, {
      reverse: true,
      loop: true,
      duration: 1000
    })

    this['star2'] = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 3, 'star2.png'),
      alpha: 1
    }).addTo(this.content)
    Hilo.Tween.to(this['star2'], {
      alpha: 0.3
    }, {
      reverse: true,
      loop: true,
      duration: 1500
    })
  },
  initGril: function () {
    this['gril'] = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 3, 'gril.png'),
      x: 650,
      y: 500,
      scaleX: 0.01,
      scaleY: 0.01
    }).addTo(this.content)
  },
  initLizi: function () {
    this.lizi = new Hilo.ParticleSystem({
      emitNum: 10,
      emitNumVar: 3,
      emitterX: 600,
      emitterY: 500,
      emitTime: 1,
      emitTimeVar: 0,
      gx: 0,
      gy: 10,
      particle: {
        frame: [0, 0, Global.width, Global.height],
        image: Global.asset.getAsset('s1', 3, 'lizi.png'),
        vx: -100,
        vy: 100,
        ax: -100,
        ay: -100,
        vxVar: 100,
        vyVar: 200,
        axVar: 300,
        ayVar: 100,
        life: 3,
        alphaV: -0.005,
        scale: 0.05,
        scaleV: 0.004,
        scaleVVar: 0.0005
      }
    }).addTo(this.content).start()
  },
  initTrain: function () {
    this.train = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 3, 'train.png'),
      rect: [0, 0, 2368, Global.height]
    }).addTo(this.content)
    this.train.x = -2368
    this.train.y = Global.height - 685
  }
})
export default p
