import Hilo from 'hilo'
import $ from '$'
import asset from './asset'
import Global from '../../Class/Global'
import EventUtil from '../../Class/EventUtil'
import NewDom from '../../Class/NewDom'
import Topic from '../../Class/Topic'
export default class Tocpic1 extends Topic {
  constructor (p) {
    super(p)
    this.asset = asset
    this.isEnd = false
    this.view = null // 整体视图
    new NewDom(document.getElementById('videoQ1'), {
      top: 386,
      left: 50,
      width: 660,
      height: 380
    }).listenChange()
  }
  playVideo () {
    const video = $('#videoQ1')
    // 需要将视频静音, 否则不允许播放
    video[0].addEventListener('play', () => {
      video.show()
    })
    document.getElementById('videoQ1').play()
  }
  createAdornArr (obj) {
    const arr = new Hilo.Container(obj)
    new Hilo.Bitmap({
      x: 0,
      image: asset.getContent('adorn/frog1.png')
    }).addTo(arr)
    new Hilo.Bitmap({
      x: 160,
      image: asset.getContent('adorn/frog2.png')
    }).addTo(arr)
    const grass = new Hilo.Bitmap({
      y: 40,
      x: 80 + 26,
      pivotX: 26,
      pivotY: 30,
      rotation: 0,
      image: asset.getContent('adorn/grass.png')
    }).addTo(arr)
    const roose = new Hilo.Bitmap({
      y: 32,
      x: 260,
      pivotX: 20,
      pivotY: 17,
      rotation: -60,
      image: asset.getContent('adorn/roose.png')
    }).addTo(arr)
    setInterval(() => {
      roose.rotation = roose.rotation === 0 ? -60 : 0
      grass.rotation = grass.rotation === 0 ? -60 : 0
    }, 500)
    return arr
  }
  createAdorn (postion) {
    const tax = 320
    const bottom = new Hilo.Container({
      x: postion === 'top' ? -Global.width + 110 : 0,
      y: postion === 'top' ? 100 : 1292
    })
    this.createAdornArr({
      x: 0 * tax
    }).addTo(bottom)
    this.createAdornArr({
      x: 1 * tax
    }).addTo(bottom)
    this.createAdornArr({
      x: 2 * tax
    }).addTo(bottom)
    this.createAdornArr({
      x: 3 * tax
    }).addTo(bottom)
    this.createAdornArr({
      x: 4 * tax
    }).addTo(bottom)
    Hilo.Tween.to(bottom, {
      x: postion === 'top' ? 0 : -Global.width + 110
    }, {
      duration: 3000,
      loop: true
    })
    return bottom
  }
  createAdornView () {
    const content = new Hilo.Container()
    this.createAdorn('top').addTo(content)
    this.createAdorn('bottom').addTo(content)
    return content
  }
  toReadyView () {
    const content = new Hilo.Container({
      id: 'topic1 view'
    })
    this.createAdornView().addTo(content)
    new Hilo.Bitmap({
      x: 50,
      y: 386,
      image: asset.getContent('video_q1.png')
    }).addTo(content)
    new Hilo.Bitmap({
      x: 50,
      y: 256,
      image: asset.getContent('topic1.png')
    }).addTo(content)

    // A
    const A = new Hilo.Bitmap({
      x: 70 + 72,
      y: 816,
      pivotX: 72,
      image: asset.getContent('topic1A.png')
    }).addTo(content)
    new EventUtil(A).on('click', () => {
      this.chooseAnswer('A', A)
    })

    // B
    const B = new Hilo.Bitmap({
      x: 400 + 110,
      y: 816,
      pivotX: 110,
      image: asset.getContent('topic1B.png')
    }).addTo(content)
    new EventUtil(B).on('click', () => {
      this.chooseAnswer('B', B)
    })

    // C
    const C = new Hilo.Bitmap({
      x: 46 + 110,
      y: 990,
      pivotX: 110,
      image: asset.getContent('topic1C.png')
    }).addTo(content)
    new EventUtil(C).on('click', () => {
      this.chooseAnswer('C', C)
    })

    // D
    const D = new Hilo.Bitmap({
      x: 362 + 150,
      y: 1105,
      pivotX: 150,
      image: asset.getContent('topic1D.png')
    }).addTo(content)
    new EventUtil(D).on('click', () => {
      this.chooseAnswer('D', D)
    })
    return content
  }
  chooseAnswer (answer, bitmap) {
    if (this.isEnd) return
    this.isEnd = true
    Hilo.Tween.to(bitmap, {
      scaleX: 0
    }, {
      duration: 300,
      onComplete: () => {
        bitmap.setImage(asset.getContent(`${answer}.png`))
        Hilo.Tween.to(bitmap, {
          scaleX: 1
        }, {
          duration: 300,
          onComplete: () => {
            this.fire('chooseAnswer', {
              instance: this,
              topic: 'q1',
              answer
            })
          }
        })
      }
    })
  }
  show (parent, time) {
    this.view.addTo(parent.getStage())
    this.playVideo()
  }
  end (time) {
    $('#videoQ1').remove()
    Hilo.Tween.to(this.view, {
      y: -Global.height - 300
    }, {
      duration: time,
      onComplete: () => {
        this.view.removeFromParent()
        this.clear()
      }
    })
  }
}
