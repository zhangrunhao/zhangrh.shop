// 动画高度: 0 - 2700
import Global from '../class/Global'
import Part from '../class/Part'
import Hilo from 'hilo'

const p1 = Hilo.Class.create({
  Extends: Part,
  constructor: function (properties) {
    p1.superclass.constructor.call(this, Hilo.Class.mix(properties, {
      name: 'p1',
      height: Global.height,
      disappear: Global.height
    }))
    this.initfirstLevel()
    this.initSecondLevel()
  },
  shouldUpdate: function (touchHeight, direction) {
    if (touchHeight >= 0) {
      this.firstLevel.y = -touchHeight
      this.secondLevel.y = -(touchHeight / 1.5)
    } else {
      this.firstLevel.y = 0
      this.secondLevel.y = 0
    }

    if (touchHeight >= 0 && direction === 'down') {
      this.next()
    }
  },
  initfirstLevel () {
    this.firstLevel = new Hilo.Container()
    this.initBg()
    this.initBoat()
    this.initCurtain()
    this.initBubble()
    this.initPerson()
    this.initStar()
    this.firstLevel.addTo(this.content)
  },
  initSecondLevel () {
    this.secondLevel = new Hilo.Container()
    this.initGame()
    this.initApp()
    this.initSwitch()
    this.secondLevel.addTo(this.content)
  },
  initBg: function () {
    this['bg'] = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 1, 'bg.jpg')
    }).addTo(this.firstLevel)
    this['window.png'] = new Hilo.Bitmap({
      id: 'window',
      image: Global.asset.getAsset('s1', 1, 'window.png'),
      x: 230
    }).addTo(this.firstLevel)
  },
  initBoat: function () {
    this['boat.png'] = new Hilo.Bitmap({
      id: 'boat',
      image: Global.asset.getAsset('s1', 1, 'boat.png'),
      rect: [0, 0, 192, 165],
      x: 240,
      y: 1020
    }).addTo(this.firstLevel)
    Hilo.Tween.from(this['boat.png'], {
      x: 270
    }, {
      duration: 2000,
      loop: true,
      reverse: true
    })
    Hilo.Tween.to(this['boat.png'], {
      x: 210
    }, {
      duration: 2000,
      loop: true,
      reverse: true
    })
  },
  initBubble: function () {
    this.bubbleContainer = new Hilo.Container()
    this['bubble01.png'] = new Hilo.Bitmap({
      id: 'bubble01',
      image: Global.asset.getAsset('s1', 1, 'bubble01.png'),
      rect: [0, 0, 144, 135],
      x: 300,
      y: 100
    }).addTo(this.bubbleContainer)

    this['bubble02.png'] = new Hilo.Bitmap({
      id: 'bubble02',
      image: Global.asset.getAsset('s1', 1, 'bubble02.png'),
      rect: [0, 0, 174, 237],
      x: 380,
      y: 300
    }).addTo(this.bubbleContainer)

    this['bubble03.png'] = new Hilo.Bitmap({
      id: 'bubble03',
      image: Global.asset.getAsset('s1', 1, 'bubble03.png'),
      rect: [0, 0, 153, 288],
      x: 380,
      y: 300
    }).addTo(this.bubbleContainer)

    this['bubble04.png'] = new Hilo.Bitmap({
      id: 'bubble04',
      image: Global.asset.getAsset('s1', 1, 'bubble04.png'),
      rect: [0, 0, 141, 144],
      x: 380,
      y: 300
    }).addTo(this.bubbleContainer)

    this['bubble05.png'] = new Hilo.Bitmap({
      id: 'bubble05',
      image: Global.asset.getAsset('s1', 1, 'bubble05.png'),
      rect: [0, 0, 234, 234]
    }).addTo(this.firstLevel)
    this.bubbleContainer.addTo(this.firstLevel)
    Hilo.Tween.to(this.bubbleContainer, {
      x: 10,
      y: 10
    }, {
      duration: 1000,
      ease: Hilo.Ease.Quad.EaseIn,
      loop: true,
      reverse: true
    })
  },
  initCurtain: function () {
    var frames = []
    for (var i = 0; i <= 15; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 1, `curtain/${i}.png`),
        rect: [0, 0, 690, 564]
      })
    }
    this['curtain'] = new Hilo.Sprite({
      frames: frames,
      x: 58,
      timeBased: true,
      interval: 80
    }).addTo(this.firstLevel)
  },
  initPerson: function () {
    var that = this
    this['person.png'] = new Hilo.Bitmap({
      id: 'person',
      image: Global.asset.getAsset('s1', 1, 'person.png'),
      rect: [0, 0, 750, 1464]
    }).addTo(this.firstLevel)
    this['heart01.png'] = new Hilo.Bitmap({
      id: 'heart01',
      image: Global.asset.getAsset('s1', 1, 'heart01.png'),
      rect: [0, 0, 117, 135],
      x: 460,
      y: 500,
      scaleX: 0.01,
      scaleY: 0.01
    }).addTo(this.firstLevel)
    Hilo.Tween.to(this['heart01.png'], {
      x: 480,
      y: 400,
      scaleX: 1,
      scaleY: 1,
      alpha: 0
    }, {
      duration: 1000,
      ease: Hilo.Ease.Quad.EaseIn,
      loop: true
    })

    this['heart02.png'] = new Hilo.Bitmap({
      id: 'heart02',
      image: Global.asset.getAsset('s1', 1, 'heart02.png'),
      rect: [0, 0, 117, 123],
      x: 100,
      y: 500,
      scaleX: 0.01,
      scaleY: 0.01
    }).addTo(this.firstLevel)
    Hilo.Tween.to(that['heart02.png'], {
      x: 0,
      y: 400,
      scaleX: 1,
      scaleY: 1,
      alpha: 0
    }, {
      repeatDelay: 1000,
      duration: 1000,
      ease: Hilo.Ease.Quad.EaseIn,
      loop: true
    })
  },
  initStar: function () {
    this['star01.png'] = new Hilo.Bitmap({
      id: 'star01',
      image: Global.asset.getAsset('s1', 1, 'star01.png'),
      rect: [0, 0, 750, 1464]
    }).addTo(this.firstLevel)
    Hilo.Tween.to(this['star01.png'], {
      alpha: 0.5
    }, {
      duration: 200,
      loop: true,
      reverse: true
    })
    this['star02.png'] = new Hilo.Bitmap({
      id: 'star02',
      image: Global.asset.getAsset('s1', 1, 'star02.png'),
      rect: [0, 0, 750, 1464]
    }).addTo(this.firstLevel)
    Hilo.Tween.from(this['star02.png'], {
      alpha: 0.8
    }, {
      duration: 100,
      loop: true,
      reverse: true
    })
  },
  initGame: function () {
    var gameContainer = new Hilo.Container()
    this['game01.png'] = new Hilo.Bitmap({
      id: 'game01',
      image: Global.asset.getAsset('s1', 1, 'game01.png'),
      rect: [0, 0, 210, 129],
      x: 300,
      y: 780
    }).addTo(gameContainer)
    this['game02.png'] = new Hilo.Bitmap({
      id: 'game02',
      image: Global.asset.getAsset('s1', 1, 'game02.png'),
      rect: [0, 0, 225, 192],
      x: 50,
      y: 250
    }).addTo(gameContainer)
    this['game03.png'] = new Hilo.Bitmap({
      id: 'game03',
      image: Global.asset.getAsset('s1', 1, 'game03.png'),
      rect: [0, 0, 141, 120],
      x: 200,
      y: 30
    }).addTo(gameContainer)
    this['game04.png'] = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 1, 'game04.png'),
      rect: [0, 0, 183, 117],
      x: 500,
      y: 70
    }).addTo(gameContainer)
    Hilo.Tween.to(gameContainer, {
      x: 10,
      y: -40
    }, {
      duration: 1800,
      loop: true,
      reverse: true
    })
    gameContainer.addTo(this.secondLevel)
  },
  initApp: function () {
    var appContainer = new Hilo.Container()
    this['app01.png'] = new Hilo.Bitmap({
      id: 'app01',
      image: Global.asset.getAsset('s1', 1, 'app01.png'),
      rect: [0, 0, 156, 177],
      x: 230,
      y: 100
    }).addTo(appContainer)
    this['app02.png'] = new Hilo.Bitmap({
      id: 'app02',
      image: Global.asset.getAsset('s1', 1, 'app02.png'),
      rect: [0, 0, 189, 189],
      x: 540,
      y: 850
    }).addTo(appContainer)
    this['app03.png'] = new Hilo.Bitmap({
      id: 'app03',
      image: Global.asset.getAsset('s1', 1, 'app03.png'),
      rect: [0, 0, 192, 174],
      x: 500,
      y: 100
    }).addTo(appContainer)
    Hilo.Tween.to(appContainer, {
      x: -20,
      y: -10
    }, {
      duration: 1500,
      loop: true,
      reverse: true
    })
    appContainer.addTo(this.secondLevel)
  },
  initSwitch: function () {
    var switchContainer = new Hilo.Container()
    this['swtich01.png'] = new Hilo.Bitmap({
      id: 'swtich01',
      image: Global.asset.getAsset('s1', 1, 'swtich01.png'),
      rect: [0, 0, 243, 183],
      x: 80,
      y: 870
    }).addTo(switchContainer)
    this['swtich02.png'] = new Hilo.Bitmap({
      id: 'swtich02',
      image: Global.asset.getAsset('s1', 1, 'swtich02.png'),
      rect: [0, 0, 180, 174],
      x: 570,
      y: 360
    }).addTo(switchContainer)
    Hilo.Tween.to(switchContainer, {
      x: -20,
      y: -10
    }, {
      duration: 1900,
      loop: true,
      reverse: true
    })
    switchContainer.addTo(this.secondLevel)
  }
})
export default p1
