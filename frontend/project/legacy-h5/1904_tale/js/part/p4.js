import Global from '../class/Global'
import Part from '../class/Part'
import util from '../util/util'
import Hilo from 'hilo'
const p = Hilo.Class.create({
  Extends: Part,
  constructor: function (properties) {
    this.l1 = 1300 // 表情出来需要的高度
    this.l2 = 528 // 向下滚动出现表情
    this.l3 = 200 // 啥也不干
    this.disappear = 1000 // 消失的滚动高度
    p.superclass.constructor.call(this, Hilo.Class.mix(properties, {
      name: 'p4',
      height: this.l1 + this.l2 + this.l3 + this.disappear, // 总高度
      disappear: this.disappear // 消失需要滑动的高度
    }))
  },
  init: function () {
    this.initBg()
    this.initGril()
    this.initMusic()
    this.initExpresson()
    this.initChat()
  },
  shouldUpdate: function (th) {
    this.toShow(th)
    this.toScrolleAll(th)
    this.exceStepExpress(th)
    if (th > this.l1 + this.l2 + this.l3) {
      this.next()
    }
  },
  toShow: function (th) {
    if (th > 0) th = 0
    this.content.x = th
  },
  toScrolleAll: function (th) {
    if (th < this.l1) th = this.l1
    if (th > this.l1 + this.l2) th = this.l1 + this.l2
    this.content.y = -(th - this.l1)
  },
  exceStepExpress: function (th) {
    if (th < 100) {
      // 1234隐藏
      this[`ex1`].x = -300
      this[`ex2`].x = -300
      this[`ex3`].x = -300
      this[`ex4`].x = -300

      this.t1.x = -300
      this.t2.x = -300
      this.t4.x = -300
    } else if (th < 400) {
      // 1推出, 234隐藏
      this[`ex1`].x = th - 300
      this[`ex2`].x = -300
      this[`ex3`].x = -300
      this[`ex4`].x = -300

      this.t1.x = th - 100
      this.t2.x = -300
      this.t4.x = -300
    } else if (th < 700) {
      // 1展示, 2推出, 34隐藏
      this[`ex1`].x = 100
      this[`ex2`].x = th - 600
      this[`ex3`].x = -300
      this[`ex4`].x = -300

      this.t1.x = 300
      this.t2.x = th - 400
      this.t4.x = -300
    } else if (th < 1000) {
      // 12展示, 3推出, 4隐藏
      this[`ex1`].x = 100
      this[`ex2`].x = 100
      this[`ex3`].x = th - 900
      this[`ex4`].x = -300

      this.t1.x = 300
      this.t2.x = 300
      this.t4.x = -300
    } else if (th < 1300) {
      // 123展示, 4推出
      this[`ex1`].x = 100
      this[`ex2`].x = 100
      this[`ex3`].x = 100
      this[`ex4`].x = th - 1200

      this.t1.x = 300
      this.t2.x = 300
      this.t4.x = th - 1000
    } else {
      // 1234展示
      this[`ex1`].x = 100
      this[`ex2`].x = 100
      this[`ex3`].x = 100
      this[`ex4`].x = 100

      this.t1.x = 300
      this.t2.x = 300
      this.t4.x = 300
    }
  },
  initBg: function () {
    var frames = []
    for (var i = 0; i <= 15; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 4, `bg/${i}.jpg`),
        rect: [0, 0, 750, 1464]
      })
    }
    this['bg'] = new Hilo.Sprite({
      frames: frames,
      timeBased: true,
      interval: 100
    }).addTo(this.content)

    new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 4, 'bg_add.jpg'),
      rect: [0, 0, 750, 1464 + 528],
      y: Global.height
    }).addTo(this.content)
  },
  initChat: function () {
    this.t1 = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 4, `text1.png`),
      x: -275,
      y: 0
    }).addTo(this.content)

    this.t2 = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 4, `text2.png`),
      x: -275,
      y: 360
    }).addTo(this.content)

    this.t4 = new Hilo.Bitmap({
      image: Global.asset.getAsset('s1', 4, `text4.png`),
      x: -275,
      y: 1100
    }).addTo(this.content)
  },
  initExpresson: function (name, total, rect) {
    var frames = []
    for (var i = 0; i <= 5; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 4, `expression1/${i}.png`),
        rect: [0, 0, 275, 319]
      })
    }
    this[`ex1`] = new Hilo.Sprite({
      frames: frames,
      x: -300,
      y: 5,
      timeBased: true,
      interval: 100
    }).addTo(this.content)

    var frames2 = []
    for (var j = 0; j <= 19; j++) {
      frames2.push({
        image: Global.asset.getAsset('s1', 4, `expression2/${j}.png`),
        rect: [0, 0, 275, 319]
      })
    }
    this[`ex2`] = new Hilo.Sprite({
      frames: frames2,
      x: -300,
      y: 360,
      timeBased: true,
      interval: 100
    }).addTo(this.content)
    var frames3 = []
    for (var K = 0; K <= 7; K++) {
      frames3.push({
        image: Global.asset.getAsset('s1', 4, `expression3/${K}.png`),
        rect: [0, 0, 275, 319]
      })
    }
    this[`ex3`] = new Hilo.Sprite({
      frames: frames3,
      x: -300,
      y: 750,
      timeBased: true,
      interval: 100
    }).addTo(this.content)
    var frames4 = []
    for (var q = 0; q <= 7; q++) {
      frames4.push({
        image: Global.asset.getAsset('s1', 4, `expression4/${q}.png`),
        rect: [0, 0, 275, 319]
      })
    }
    this[`ex4`] = new Hilo.Sprite({
      frames: frames4,
      x: -300,
      y: 1130,
      timeBased: true,
      interval: 100
    }).addTo(this.content)
  },
  getMusicRect: function (i) {
    switch (i) {
      case 1:
        return {
          x: 200,
          y: 1200
        }
      case 2:
        return {
          x: 300,
          y: 100
        }
      case 3:
        return {
          x: 100,
          y: 400
        }
      case 4:
        return {
          x: 200,
          y: 300
        }
      case 5:
        return {
          x: 200,
          y: 600
        }
      case 6:
        return {
          x: 400,
          y: 100
        }
      case 7:
        return {
          x: 100,
          y: 100
        }
      case 8:
        return {
          x: 100,
          y: 800
        }
    }
  },
  initMusic: function () {
    for (var i = 1; i < 9; i++) {
      var name = `music${i}.png`
      this[name] = new Hilo.Bitmap({
        image: Global.asset.getAsset('s1', 4, name),
        x: this.getMusicRect(i).x,
        y: this.getMusicRect(i).y,
        alpha: 0
      }).addTo(this.content)
      Hilo.Tween.from(this[name], {
        x: this[name].x + util.RandomNumBoth(-100, 150),
        y: this[name].y + util.RandomNumBoth(-100, 100),
        alpha: 1
      }, {
        loop: true,
        delay: util.RandomNumBoth(500, 5000),
        repeatDelay: util.RandomNumBoth(500, 5000),
        duration: util.RandomNumBoth(2000, 4000)
      })
      Hilo.Tween.to(this[name], {
        x: this[name].x + util.RandomNumBoth(-100, 150),
        y: this[name].y + util.RandomNumBoth(-100, 100),
        alpha: 0
      }, {
        loop: true,
        delay: util.RandomNumBoth(500, 5000),
        repeatDelay: util.RandomNumBoth(500, 5000),
        duration: util.RandomNumBoth(2000, 4000)
      })
    }
  },
  initGril: function () {
    var frames = []
    for (var i = 0; i <= 7; i++) {
      frames.push({
        image: Global.asset.getAsset('s1', 4, `girl/${i}.png`),
        rect: [0, 0, 500, 384]
      })
    }
    new Hilo.Sprite({
      frames: frames,
      timeBased: true,
      interval: 100,
      x: 100,
      y: Global.height + 50
    }).addTo(this.content)
  }
})
export default p
