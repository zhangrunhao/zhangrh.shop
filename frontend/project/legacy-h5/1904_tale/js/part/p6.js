import Global from '../class/Global'
import Part from '../class/Part'
import Hilo from 'hilo'

const p = Hilo.Class.create({
  Extends: Part,
  constructor: function (properties) {
    this.l1 = 3153 // 整副图的长度
    this.l2 = 800 // 海洋馆的高度
    this.DolphinFakeOriginPosition = {
      x: 135,
      y: 2600
    }
    p.superclass.constructor.call(this, Hilo.Class.mix(properties, {
      name: 'p6',
      height: this.l1 + Global.height,
      disappear: Global.height
    }))
  },
  init: function () {
    this.initMoment()
    this.initDolphinFake()
    this.initSecondContainer()
  },
  shouldUpdate: function (th) {
    if (th < this.l1 - Global.height) { // 滑动朋友圈
      this.content.y = -th
    } else if (th < this.l1) { // 放大海洋馆
      this.content.y = -(this.l1 - Global.height)
    } else { // 海洋馆上移
      this.content.y = -(th - (this.l1 - Global.height) + 222)
      this.next()
    }
    this.zoomDolphinFake(th)
    if (th > this.l1) {
      this.secondContainer.alpha = 1
    } else {
      this.secondContainer.alpha = 0
    }
  },
  zoomDolphinFake (th) {
    var min = this.l1 - Global.height
    var max = this.l1
    if (th < min) th = min
    if (th > max) th = max
    var scale = (th - min) * 0.5 / (max - min) + 0.5
    var x = (th - min) * (-this.DolphinFakeOriginPosition.x) / (max - min) + this.DolphinFakeOriginPosition.x
    var y = (th - min) * (this.l1 - this.l2 - this.DolphinFakeOriginPosition.y) / (max - min) + this.DolphinFakeOriginPosition.y
    this.dolphinFake.scaleX = scale
    this.dolphinFake.scaleY = scale
    this.dolphinFake.x = x
    this.dolphinFake.y = y
  },
  initDolphinFake: function () {
    this['dolphinFake'] = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 6, 'dolphin.jpg'),
      x: this.DolphinFakeOriginPosition.x,
      y: this.DolphinFakeOriginPosition.y,
      scaleX: 0.5,
      scaleY: 0.5
    }).addTo(this.content)
  },
  initMoment: function () {
    this['moment'] = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 6, 'moment.jpg'),
      rect: [0, 0, Global.width, 3158]
    }).addTo(this.content)
  },
  initSecondContainer: function () {
    var parent = this.secondContainer = new Hilo.Container()
    this.initDolphinBg(parent)
    parent.x = 0
    parent.y = this.l1 - this.l2
    parent.addTo(this.content)
  },
  initChild: function (parent) {
    var frames = []
    for (var i = 0; i <= 5; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 6, `child/${i}.png`),
        rect: [0, 0, 242, 257]
      })
    }
    this['child'] = new Hilo.Sprite({
      id: 'child',
      frames: frames,
      x: 325,
      y: 510,
      timeBased: true,
      interval: 200
    }).addTo(parent)
  },
  initDolphinBg: function (parent) {
    this['dolphinBg1'] = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 6, 'bg1.jpg')
    }).addTo(parent)
    this.initMother(parent)
    this.initStar(parent)
    this.initChild(parent)
  },
  initMother: function (parent) {
    this['mother'] = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 6, 'mather.png'),
      x: 200,
      y: 480
    }).addTo(parent)
  },
  initStar: function (parent) {
    var frames = []
    for (var i = 0; i <= 11; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 6, `star/${i}.png`),
        rect: [0, 0, 750, 797]
      })
    }
    this['star'] = new Hilo.Sprite({
      frames: frames
    }).addTo(parent)
  }
})
export default p
