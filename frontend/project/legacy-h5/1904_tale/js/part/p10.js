import Global from '../class/Global'
import Part from '../class/Part'
import Hilo from 'hilo'

const p = Hilo.Class.create({
  Extends: Part,
  constructor: function (properties) {
    this.l1 = 8075
    p.superclass.constructor.call(this, Hilo.Class.mix(properties, {
      name: 'p10',
      height: this.l1,
      disappear: Global.height
    }))
  },
  init: function () {
    this.initBg()
    this.initFour()
    this.initButton()
    this.initShadow()
  },
  shouldUpdate: function (th) {
    this.content.y = -th
    if (th > this.l1 - Global.height) {
      this.content.y = -(this.l1 - Global.height)
    }
  },
  initBg: function () {
    new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 10, 'bg.jpg')
    }).addTo(this.content)
    new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 10, 'text.png'),
      y: -500
    }).addTo(this.content)
  },
  initFour: function () {
    var frames = []
    for (var i = 0; i <= 14; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 10, `four/${i}.png`),
        rect: [0, 0, 750, 625]
      })
    }
    new Hilo.Sprite({
      frames: frames,
      y: 5150,
      timeBased: true,
      interval: 200
    }).addTo(this.content)
  },
  initButton: function () {
    var that = this
    var share = new Hilo.Button({
      image: Global.asset.getAsset('s1', 10, 'share.png'),
      width: 163,
      height: 88,
      x: Global.width / 2 - 163 / 2,
      y: this.l1 - 620
    }).addTo(this.content)

    share.on(Hilo.event.POINTER_START, function (e) {
      e.preventDefault()
      that.shadow.alpha = 1
    })

    var again = new Hilo.Button({
      image: Global.asset.getAsset('s1', 10, 'again.png'),
      width: 177,
      height: 107,
      x: Global.width / 2 - 163 / 2,
      y: this.l1 - 500
    }).addTo(this.content)

    again.on(Hilo.event.POINTER_START, function (e) {
      e.preventDefault()
      that.end()
      that.parentNode.partMap[0].start()
      Global.scroller.scrollTo(0, 0, false)
    })
  },
  initShadow: function () {
    var that = this
    this.shadow = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 10, 'shadow.png'),
      alpha: 0,
      y: this.l1 - Global.height
    }).addTo(this.content)

    this.shadow.on(Hilo.event.POINTER_START, function (e) {
      e.preventDefault()
      that.shadow.alpha = 0
    })
  }
})
export default p
