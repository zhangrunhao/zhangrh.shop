import Hilo from 'hilo'
import $ from '$'
import asset from './asset'
import Global from '../../Class/Global'
import EventUtil from '../../Class/EventUtil'
import NewDom from '../../Class/NewDom'
import Topic from '../../Class/Topic'
import {
  getRandomNumBoth
} from '../../../../legacy/utils/legacy-utils.js'
export default class Topic3 extends Topic {
  constructor (p) {
    super(p)
    this.asset = asset
    this.isEnd = false
  }
  createStaff () {
    const view = new Hilo.Container({
      y: 230
    })
    new Hilo.Bitmap({
      image: asset.getContent('staff.png')
    }).addTo(view)
    new Hilo.Bitmap({
      x: Global.width,
      image: asset.getContent('staff.png')
    }).addTo(view)

    for (let i = 0; i < 750; i += 36) {
      const y = getRandomNumBoth(5, 40)
      const jump = y + getRandomNumBoth(-10, 15)
      const note = new Hilo.Bitmap({
        x: i,
        y,
        image: asset.getContent(`note${i % 5 + 1}.png`)
      }).addTo(view)
      const other = new Hilo.Bitmap({
        x: i + 750,
        y,
        image: asset.getContent(`note${i % 5 + 1}.png`)
      }).addTo(view)
      Hilo.Tween.to([note, other], {
        y: jump
      }, {
        duration: 300,
        reverse: true,
        loop: true
      })
      Hilo.Tween.to(view, {
        x: -Global.width
      }, {
        duration: 5000,
        loop: true
      })
    }
    return view
  }
  createCD () {
    const view = new Hilo.Container()
    new Hilo.ParticleSystem({
      emitNum: 1,
      emitterX: 50,
      emitterY: 1350,
      emitNumVar: 0,
      particle: {
        frame: [
          [0, 12, 25, 22],
          [44, 5, 12, 38],
          [84, 10, 22, 30],
          [136, 14, 10, 30],
          [170, 0, 34, 50]
        ],
        vx: 80,
        vy: -120,
        ax: 10,
        ay: 10,
        vxVar: 100,
        vyVar: 200,
        axVar: 10,
        ayVar: 100,
        life: 2.0,
        alpha: 0.7,
        alphaV: -0.001,
        scale: 1.0,
        scaleV: 0.004,
        scaleVVar: 0.00005,
        image: asset.getContent('note.png')
      }
    }).addTo(view).start()
    const record = new Hilo.Bitmap({
      x: 60 + 40,
      y: 1200 + 115,
      pivotX: 115,
      pivotY: 115,
      image: asset.getContent('record.png')
    }).addTo(view)
    new Hilo.Bitmap({
      x: 150,
      y: 1185,
      image: asset.getContent('machine.png')
    }).addTo(view)
    Hilo.Tween.to(record, {
      rotation: 360
    }, {
      duration: 1500,
      loop: true
    })
    return view
  }
  toReadyView () {
    const content = new Hilo.Container()
    this.createStaff().addTo(content)
    this.createCD().addTo(content)
    new Hilo.Bitmap({
      x: 48,
      y: 108,
      image: asset.getContent('topic3.png')
    }).addTo(content)

    // A
    const A = new Hilo.Bitmap({
      x: 70,
      y: 334,
      image: asset.getContent('A.png')
    }).addTo(content)
    new EventUtil(A).on('click', () => {
      this.chooseAnswer('A', {
        top: 334,
        left: 70,
        width: 280,
        height: 320
      })
    })

    // B
    const B = new Hilo.Bitmap({
      x: 394,
      y: 516,
      image: asset.getContent('B.png')
    }).addTo(content)
    new EventUtil(B).on('click', () => {
      this.chooseAnswer('B', {
        top: 516,
        left: 394,
        width: 300,
        height: 365
      })
    })

    // C
    const C = new Hilo.Bitmap({
      x: 70,
      y: 750,
      image: asset.getContent('C.png')
    }).addTo(content)
    new EventUtil(C).on('click', () => {
      this.chooseAnswer('C', {
        top: 750,
        left: 70,
        width: 300,
        height: 360
      })
    })
    const D = new Hilo.Bitmap({
      x: 394,
      y: 1000,
      image: asset.getContent('D.png')
    }).addTo(content)
    new EventUtil(D).on('click', () => {
      this.chooseAnswer('D', {
        top: 1000,
        left: 394,
        width: 300,
        height: 340
      })
    })
    return content
  }
  chooseAnswer (answer, domParams) {
    if (this.isEnd) return
    this.isEnd = true
    const gif = this.gif = new Image()
    gif.className = 'gif'
    gif.src = `${Global.publicPath}/topic3/${answer}.gif?t=${Global.timeStamp}`
    document.getElementById('app').appendChild(gif)
    new NewDom(gif, domParams).listenChange()

    this.fire('chooseAnswer', {
      instance: this,
      topic: 'q3',
      answer
    })
  }
  show (parent, time) {
    this.view.addTo(parent.getStage())

    this.audio.src = `${Global.publicPath}/topic3/audio.mp3`
    this.audio.play()
    this.view.y = Global.height
    Hilo.Tween.to(this.view, {
      y: 0
    }, {
      duration: time
    })
  }
  end (time) {
    $('.gif').remove()
    this.gif = null
    this.audio.pause()
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
