import Global from '../class/Global'
import Part from '../class/Part'
import Hilo from 'hilo'

const p = Hilo.Class.create({
  Extends: Part,
  constructor: function (properties) {
    this.paperHideHeight = 290
    this.bgHeight = 2300
    this.floatNewsH = 2559
    this.pileNewsH = 600
    this.keepH = 200
    p.superclass.constructor.call(this, Hilo.Class.mix(properties, {
      name: 'p5',
      height: this.bgHeight + Global.height,
      disappear: Global.height
    }))
  },
  init: function () {
    this.initBg()
    this.initFloatNews()
    this.initPileNews()
    this.initThree()
    this.initPaper()
  },
  shouldUpdate: function (th) {
    this.excePaper(th)
    this.exceFloatNews(th)
    if (th < 0) {
      this.content.y = 0
    } else if (th < this.bgHeight - Global.height) {
      this.content.y = -th
    } else if (th < (this.bgHeight - Global.height) + this.keepH) {
      this.content.y = -(this.bgHeight - Global.height)
    } else {
      this.content.y = -(th - this.keepH)
    }

    if (th < -this.paperHideHeight) { // 需要th在负数的时候, 就把背景切换了
      this.bg.alpha = 0
      this.pileNews.alpha = 0
      this.floatNews.alpha = 0
    } else {
      this.bg.alpha = 1
      this.pileNews.alpha = 1
      this.floatNews.alpha = 1
    }

    if (th > this.partHeight - Global.height) {
      this.next()
    }
  },
  exceFloatNews (th) {
    if (th > this.floatNewsH) th = this.floatNewsH
    var step = parseInt(th * this.floatNews.getNumFrames() / this.floatNewsH)
    this.floatNews.goto(step, true)
  },
  excePaper: function (th) {
    if (th >= 0) th = 0
    var prevDisH = this.getDisappearPrev() || 1000
    var x1 = (Global.width + 1344) * (th + prevDisH) / prevDisH - 1344
    var x2 = (th + prevDisH) * (-2000 - (2000 + Global.width)) / prevDisH + (2000 + Global.width)
    this['paper1'].x = x1
    this['paper2'].x = x2
  },
  initFloatNews: function () {
    var frames = []
    for (var i = 0; i <= 59; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 5, `float_news/${i}.png`),
        rect: [0, 0, Global.width, 2559]
      })
    }
    this['floatNews'] = new Hilo.Sprite({
      frames: frames,
      timeBased: true,
      interval: 100,
      y: 0,
      alpha: 0
    }).addTo(this.content).stop()
  },
  initPileNews: function () {
    var frames = []
    for (var i = 0; i <= 30; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 5, `pile_news/${i}.png`),
        rect: [0, 0, Global.width, 1607]
      })
    }
    this['pileNews'] = new Hilo.Sprite({
      frames: frames,
      timeBased: true,
      interval: 100,
      y: this.bgHeight - this.pileNewsH,
      alpha: 0
    }).addTo(this.content)
  },
  initPaper: function () {
    this['paper1'] = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 5, 'paper1.png'),
      rect: [0, 0, 1344, 2226],
      x: -1344,
      y: -300
    }).addTo(this.content)
    this['paper2'] = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 5, 'paper2.png'),
      rect: [0, 0, 2000, 1910],
      x: 2000 + Global.width,
      y: -300
    }).addTo(this.content)
  },
  initBg: function () {
    this['bg'] = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 5, 'bg.jpg'),
      scaleX: 2,
      scaleY: 2,
      alpha: 0
    }).addTo(this.content)
  },
  initThree: function () {
    this['three'] = new Hilo.Bitmap({
      id: '11',
      image: Global.asset.getAsset('s1', 5, 'three.png'),
      x: 200,
      y: this.bgHeight + 800
    }).addTo(this.content)
  }
})
export default p
