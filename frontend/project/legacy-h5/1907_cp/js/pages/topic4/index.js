import Hilo from 'hilo'
import asset from './asset'
import Global from '../../Class/Global'
import EventUtil from '../../Class/EventUtil'
import $ from '$'
import NewDom from '../../Class/NewDom'
import Topic from '../../Class/Topic'

export default class Topic4 extends Topic {
  constructor (p) {
    super(p)
    this.asset = asset
    this.isEnd = false
    new NewDom(document.getElementById('videoQ4'), {
      top: 374,
      left: 50,
      width: 660,
      height: 380
    }).listenChange()
  }
  playVideo () {
    const video = $('#videoQ4')
    video[0].addEventListener('play', () => {
      video.show()
      // this.videoBitmap.removeFromParent()
    })
    video[0].play()
  }
  createA () {
    const view = new Hilo.Container()
    new Hilo.Bitmap({
      x: 60,
      y: 832,
      image: asset.getContent('A/before.png')
    }).addTo(view)
    const car = new Hilo.Bitmap({
      x: 125,
      y: 1210,
      image: asset.getContent('A/car.png')
    }).addTo(view)
    const ps = new Hilo.ParticleSystem({
      emitNum: 1,
      emitNumVar: 2,
      emitterX: 55,
      emitterY: 1200,
      // emitTime: 1,
      // emitTimeVar: 0,
      // gx: 0,
      // gy: 10,
      particle: {
        vx: 200,
        vy: 5,
        ax: 500,
        ay: 5,
        vxVar: 100,
        vyVar: 100,
        // axVar: 300,
        // ayVar: 100,
        life: 3,
        // alphaV: -0.006,
        scale: 0.9,
        scaleV: 0.004,
        scaleVVar: 0.0005,
        image: asset.getContent('A/car.png')
      }
    }).addTo(view)
    new Hilo.Bitmap({
      x: 60,
      y: 800,
      image: asset.getContent('A/bg.png')
    }).addTo(view)

    new EventUtil(view).on('click', () => {
      this.chooseAnswer('A', () => {
        new Hilo.Bitmap({
          x: 90,
          y: 831,
          image: asset.getContent('A/after.png')
        }).addTo(view, 1)
        setTimeout(() => {
          ps.start()
        }, 1000)
        Hilo.Tween.to(car, {
          x: 800
        }, {
          duration: 2500
        })
      })
    })
    return view
  }
  createB () {
    const that = this
    const view = new Hilo.Container()
    new Hilo.Bitmap({
      x: 223,
      y: 878,
      image: asset.getContent('B/before.png')
    }).addTo(view)
    const heart = new Hilo.Bitmap({
      x: 305,
      y: 1320,
      image: asset.getContent('B/heart.png')
    }).addTo(view)
    new Hilo.Bitmap({
      x: 223,
      y: 850,
      image: asset.getContent('B/bg.png')
    }).addTo(view)
    new EventUtil(view).on('click', () => {
      this.chooseAnswer('B', () => {
        new Hilo.Bitmap({
          x: 255,
          y: 880,
          image: asset.getContent('B/after.png')
        }).addTo(view, 1)
        Hilo.Tween.to(heart, {
          x: 355,
          y: 780
        }, {
          duration: 2500,
          ease: Hilo.Ease.Quad.EaseIn,
          onComplete: function () {
            Hilo.Tween.to(heart, {
              alpha: 0.3
            }, {
              duration: 1000,
              onComplete: function () {
                heart.setImage(that.asset.getContent('B/heart-broken.png'))
                Hilo.Tween.to(heart, {
                  alpha: 1
                }, {
                  duration: 1000
                })
              }
            })
          }
        })
      })
    })
    return view
  }
  createC () {
    const view = new Hilo.Container()

    new Hilo.Bitmap({
      x: 391,
      y: 977,
      image: asset.getContent('C/before.png')
    }).addTo(view)

    const icon = new Hilo.Bitmap({
      x: 444,
      y: 1186,
      image: asset.getContent('C/icon.png')
    }).addTo(view)

    new Hilo.Bitmap({
      x: 392,
      y: 947,
      image: asset.getContent('C/bg.png')
    }).addTo(view)

    new EventUtil(view).on('click', () => {
      this.chooseAnswer('C', () => {
        const gif = this.gif = new Image()
        gif.className = 'gif'
        gif.src = `${Global.publicPath}/topic4/C.gif?t=${Global.timeStamp}`
        icon.removeFromParent()
        document.getElementById('app').appendChild(gif)
        new NewDom(gif, {
          top: 815,
          left: 362,
          width: 280,
          height: 478
        }).listenChange()
      })
    })

    return view
  }
  createD () {
    const view = new Hilo.Container()
    const D = new Hilo.Container().addTo(view)
    new Hilo.Bitmap({
      x: 558,
      y: 864,
      image: asset.getContent('D-option/before.png')
    }).addTo(D)

    new Hilo.Bitmap({
      x: 630,
      y: 1186,
      image: asset.getContent('D-option/tree.png')
    }).addTo(D)

    new Hilo.Bitmap({
      x: 557,
      y: 834,
      image: asset.getContent('D-option/bg.png')
    }).addTo(D)

    const DFrames = []
    for (let i = 1; i <= 20; i++) {
      DFrames.push({
        image: asset.getContent(`D/${i}.png`),
        rect: [0, 0, 420, 488]
      })
    }

    const DSprite = this.DSprite = new Hilo.Sprite({
      x: 315,
      y: 830,
      frames: DFrames,
      timeBased: true,
      loop: false,
      interval: 200
    }).stop()

    new EventUtil(D).on('click', () => {
      this.chooseAnswer('D', () => {
        D.removeFromParent()
        DSprite.addTo(this.view, this.view.children.length)
        DSprite.play()
      })
    })
    return view
  }
  toReadyView () {
    const content = new Hilo.Container()
    var frames = []
    for (var i = 1; i <= 2; i++) {
      frames.push({
        image: asset.getContent(`raindrop${i}.png`),
        rect: [0, 0, 750, 203]
      })
    }
    new Hilo.Sprite({
      frames,
      timeBased: true,
      interval: 200
    }).addTo(content)
    this.videoBitmap = new Hilo.Bitmap({
      // width: 640,
      // height: 362,
      x: 50,
      y: 374,
      image: asset.getContent('video_q2.png')
    }).addTo(content)
    new Hilo.Bitmap({
      x: 50,
      y: 246,
      image: asset.getContent('topic4.png')
    }).addTo(content)

    // B
    this.createB().addTo(content)

    // D
    this.createD().addTo(content)

    // C
    this.createC().addTo(content)

    // A
    this.createA().addTo(content)

    return content
  }
  chooseAnswer (answer, run) {
    if (this.isEnd) return
    this.isEnd = true
    if (run instanceof Function) run()
    this.fire('chooseAnswer', {
      instance: this,
      topic: 'q4',
      answer
    })
  }
  show (parent, time) {
    this.view.addTo(parent.getStage())

    this.view.y = Global.height
    Hilo.Tween.to(this.view, {
      y: 0
    }, {
      duration: time,
      onComplete: () => {
        this.playVideo()
      }
    })
  }
  end (time) {
    this.gif = null
    $('.gif').remove()
    $('#videoQ4').remove()
    Hilo.Tween.to(this.view, {
      y: -Global.height - 300
    }, {
      duration: time,
      complete: () => {
        this.view.removeFromParent()
        this.clear()
      }
    })
  }
}
