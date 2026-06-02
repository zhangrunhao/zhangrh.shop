import Global from '../class/Global'
import Part from '../class/Part'
import util from '../util/util'
import Hilo from 'hilo'

const p = Hilo.Class.create({
  Extends: Part,
  constructor: function (properties) {
    this.l1 = 800 // 翻书需要滚动的距离
    this.disappear = 500 // 消失的需要的高度
    p.superclass.constructor.call(this, Hilo.Class.mix(properties, {
      name: 'p2',
      height: this.l1 + this.disappear,
      disappear: this.disappear
    }))
    this.initElement()
  },
  shouldUpdate: function (th, direction) {
    if (th <= 0) { // 开始的滚动
      this.content.y = -th
    } else {
      this.content.y = 0
    }
    this.exceAnimationFirst(th)

    if (th > this.l1) {
      this.next()
      this.shadow.alpha = (th - this.l1) / this.disappear
    } else {
      this.shadow.alpha = 0
    }
  },
  exceAnimationFirst: function (th) {
    if (th < 0) th = 0
    if (th > this.l1) th = this.l1
    this.exceText(th)
    this.exceLittleLightStep(th)
    this.exceBookStep(th)
  },
  exceText: function (th) {
    if (th === 0) {
      this['text1'].alpha = 0
      this['text2'].alpha = 0
      this['text3'].alpha = 0
    } else if (th < (this.l1 / 3)) {
      this['text1'].alpha = th / (this.l1 / 3)
      this['text2'].alpha = 0
      this['text3'].alpha = 0
    } else if (th < (this.l1 / 3) * 2) {
      this['text1'].alpha = 1
      this['text2'].alpha = (th - this.l1 / 3) / (this.l1 / 3)
      this['text3'].alpha = 0
    } else if (th < this.l1) {
      this['text1'].alpha = 1
      this['text2'].alpha = 1
      this['text3'].alpha = (th - this.l1 * 2 / 3) / (this.l1 * 2 / 3)
    } else {
      this['text1'].alpha = 1
      this['text2'].alpha = 1
      this['text3'].alpha = 1
    }
  },
  exceLittleLightStep: function (touchHeight) {
    var step = parseInt(touchHeight * this['little_light'].getNumFrames() / this.l1)
    if (step >= 0) {
      this['little_light'].goto(step, true)
    }
  },
  exceBookStep: function (touchHeight) {
    var step = parseInt(touchHeight * this['open_book'].getNumFrames() / this.l1)
    if (step >= 0) {
      this['open_book'].goto(step, true)
    }
  },
  initElement: function () {
    this.initBg()
    this.initFlowerBook()
    this.initFlowerBig()
    this.initBook()
    this.initGhost()
    this.initSpirit()
    this.initText()
    this.initLitterLight()
    this.initShadow()
  },
  initShadow: function () {
    this.shadow = new Hilo.Container({
      alpha: 0,
      id: 'shadow',
      background: '#000',
      x: 0,
      y: 0,
      width: Global.width,
      height: Global.height
    }).addTo(this.content)
  },
  initText: function () {
    this['text1'] = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 2, 'text1.png'),
      x: 0,
      y: 300,
      alpha: 0
    }).addTo(this.content)
    this['text2'] = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 2, 'text2.png'),
      x: 200,
      y: 400,
      alpha: 0
    }).addTo(this.content)
    this['text3'] = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 2, 'text3.png'),
      x: 150,
      y: 500,
      alpha: 0
    }).addTo(this.content)
  },
  initBg: function () {
    this['bg.png'] = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 2, 'bg.jpg')
    }).addTo(this.content)
  },
  initFlowerBook: function () {
    var frames = []
    for (var i = 0; i <= 11; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 2, `flower_book/${i}.png`),
        rect: [0, 0, 582, 274]
      })
    }
    this['flower_book'] = new Hilo.Sprite({
      frames: frames,
      timeBased: true,
      interval: 60,
      x: 75,
      y: 742
    }).addTo(this.content)
  },
  initFlowerBig: function () {
    var frames = []
    for (var i = 0; i <= 15; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 2, `flower_big/${i}.png`),
        rect: [0, 0, 750, 991]
      })
    }
    this['flower_big'] = new Hilo.Sprite({
      frames: frames,
      timeBased: true,
      interval: 50,
      y: 500
    }).addTo(this.content)
  },
  initBook: function () {
    var frames = []
    for (var i = 2; i <= 11; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 2, `open_book/${i}.png`),
        rect: [0, 0, 697, 619]
      })
    }
    this['open_book'] = new Hilo.Sprite({
      frames: frames,
      loop: false,
      x: 0,
      y: 493
    }).addTo(this.content)
    this['open_book'].stop()
  },
  initGhost: function () {
    var getHostRect = function (key) {
      switch (key) {
        case 1:
          return [480, 500]
        case 2:
          return [260, 450]
        case 3:
          return [400, 360]
        case 4:
          return [540, 290]
        case 5:
          return [100, 220]
        case 6:
          return [460, 100]
        case 7:
          return [260, 10]
      }
    }
    for (var i = 1; i < 8; i++) {
      var name = `ghost${i}.png`
      this[name] = new Hilo.Bitmap({
        image: Global.asset.getAsset('s1', 2, name),
        x: getHostRect(i)[0],
        y: getHostRect(i)[1]
      }).addTo(this.content)
      Hilo.Tween.to(this[name], {
        y: getHostRect(i)[1] - util.RandomNumBoth(-50, 50)
      }, {
        duration: 2000,
        loop: true,
        delay: util.RandomNumBoth(200, 4000),
        repeatDelay: util.RandomNumBoth(200, 3000),
        ease: Hilo.Ease.Quad.EaseIn,
        reverse: true
      })
    }
  },
  initSpirit: function () {
    this['spiritContainer'] = new Hilo.Container().addTo(this.content)
    var getSpiritRect = function (key) {
      switch (key) {
        case 1:
          return [520, 1310]
        case 2:
          return [100, 560]
        case 3:
          return [180, 1000]
        case 4:
          return [310, 1100]
        case 5:
          return [360, 1180]
      }
    }
    for (var i = 1; i < 6; i++) {
      var name = `spirit${i}.png`
      this[name] = new Hilo.Bitmap({
        image: Global.asset.getAsset('s1', 2, name),
        x: getSpiritRect(i)[0],
        y: getSpiritRect(i)[1]
      }).addTo(this['spiritContainer'])
    }
    Hilo.Tween.to(this['spirit2.png'], {
      y: 560 - 45,
      alpha: 0.2
    }, {
      duration: 2000,
      loop: true,
      ease: Hilo.Ease.Quad.EaseIn,
      reverse: true
    })
    Hilo.Tween.from(this['spirit4.png'], {
      y: 1100 + 10
    }, {
      loop: true,
      ease: Hilo.Ease.Quart.EaseIn
    })
    Hilo.Tween.to(this['spirit4.png'], {
      y: 1180 - 10
    }, {
      loop: true,
      ease: Hilo.Ease.Quart.EaseOut
    })
  },
  initLitterLight: function () {
    var frames = []
    for (var i = 0; i <= 29; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 2, `little_light/${i}.png`),
        rect: [0, 0, 400, 890]
      })
    }
    this['little_light'] = new Hilo.Sprite({
      frames: frames,
      loop: false
    }).addTo(this.content)
    this['little_light'].stop()
  }
})

export default p
