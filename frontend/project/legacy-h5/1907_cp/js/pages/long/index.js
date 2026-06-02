import Hilo from 'hilo'
import asset from './asset'
import Global from '../../Class/Global'
import Topic from '../../Class/Topic'
export default class Long extends Topic {
  constructor (p) {
    super(p)
    this.asset = asset

    this.changeTime = 10000
    this.startScale = 1
    this.endScale = 750 / 1555
    this.startX = -(1555 - 750) / 2
    this.endX = 0
    this.startY = 0
    this.endY = -(4178 * this.endScale - Global.height)
  }
  createSinglePerson (params) {
    const view = new Hilo.Container(params)
    new Hilo.Bitmap({
      image: asset.getContent('person.png')
    }).addTo(view)
    const r = new Hilo.Bitmap({
      x: 24,
      y: 30,
      image: asset.getContent('leg-r.png')
    }).addTo(view)
    Hilo.Tween.to(r, {
      rotation: 50
    }, {
      reverse: true,
      loop: true
    })
    const l = new Hilo.Bitmap({
      x: 24,
      y: 30,
      rotation: 50,
      image: asset.getContent('leg-r.png')
    }).addTo(view)
    Hilo.Tween.to(l, {
      rotation: 0
    }, {
      ease: Hilo.Ease.Linear.EaseNone,
      duration: 1000,
      reverse: true,
      loop: true
    })
    return view
  }
  createPerson (stage) {
    const peronPostion = [
      {
        x: 1000,
        y: 45
      },
      {
        x: 950,
        y: 55
      },
      {
        x: 900,
        y: 65
      },
      {
        x: 620,
        y: 120
      },
      {
        x: 570,
        y: 130
      },
      {
        x: 520,
        y: 140
      },
      {
        x: 580,
        y: 825
      }
    ]
    peronPostion.map(p => {
      this.createSinglePerson({
        x: p.x,
        y: p.y
      }).addTo(stage)
    })
  }
  toReadyView () {
    const view = new Hilo.Container()
    const stage = this.animationStage = new Hilo.Container({
      x: this.startX
    }).addTo(view)
    new Hilo.Bitmap({
      image: asset.getContent('line.png')
    }).addTo(stage)
    this.createPerson(stage)
    this.point = new Hilo.Bitmap({
      x: 720,
      y: 1208,
      image: asset.getContent('point.png')
    }).addTo(stage)
    this.shelder = new Hilo.Bitmap({
      rotation: -10,
      x: -Global.width / 2,
      width: Global.width * 2,
      height: Global.height * 2,
      background: 'white'
    }).addTo(view)
    return view
  }
  toPlay () {
    Hilo.Tween.to(this.point, {
      x: 1030,
      y: 1288
    }, {
      delay: 1000,
      duration: 2000
    })
    Hilo.Tween.to(this.animationStage, {
      x: this.endX,
      y: this.endY,
      scaleX: this.endScale,
      scaleY: this.endScale
    }, {
      ease: Hilo.Ease.Linear.EaseNone,
      duration: this.changeTime,
      onComplete: () => {
        setTimeout(() => {
          this.fire('next', {
            instance: this
          })
        }, 1500)
      }
    })
    Hilo.Tween.to(this.shelder, {
      rotation: 10
    }, {
      duration: 1000,
      reverse: true,
      loop: true
    })
    Hilo.Tween.to(this.shelder, {
      y: Global.height
    }, {
      duration: this.changeTime
    })
  }
  show (parent, time) {
    this.view.addTo(parent.getStage())
    this.audio.src = `${Global.publicPath}/long/audio.mp3`
    this.audio.play()
    this.view.y = Global.height
    parent.setBalanceType('width')
    Hilo.Tween.to(this.view, {
      y: 0
    }, {
      duration: time,
      onComplete: () => {
        this.toPlay()
      }
    })
  }
  end (time) {
    this.audio.pause()
    this.view.removeFromParent()
    this.clear()
  }
}
