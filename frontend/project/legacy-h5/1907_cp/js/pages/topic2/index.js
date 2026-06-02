import Hilo from 'hilo'
import $ from '$'
import asset from './asset'
import Global from '../../Class/Global'
import NewDom from '../../Class/NewDom'
import EventUtil from '../../Class/EventUtil'
import Topic from '../../Class/Topic'

export default class Topic2 extends Topic {
  constructor (p) {
    super(p)
    this.asset = asset
    this.isEnd = false
    this.heartTween = [] // 保存我们心跳动画
  }
  createAdronTopView () {
    const content = new Hilo.Container()
    new Hilo.Bitmap({
      y: 50,
      image: asset.getContent('line.png')
    }).addTo(content)
    const heart1 = new Hilo.Bitmap({
      x: 500,
      y: 85,
      image: asset.getContent('heart1.png')
    })
    const heart2 = new Hilo.Bitmap({
      x: 500,
      y: 85,
      image: asset.getContent('heart2.png')
    })
    const tween2 = Hilo.Tween.to(heart2, {
      x: 550,
      y: 30,
      alpha: 0.2,
      scaleX: 1.4,
      scaleY: 1.4
    }, {
      delay: 500,
      duration: 1500,
      loop: true
    }).stop()

    const heart3 = new Hilo.Bitmap({
      width: 20,
      height: 20,
      x: 500,
      y: 85,
      image: asset.getContent('heart3.png')
    })
    const tween3 = Hilo.Tween.to(heart3, {
      x: 530,
      y: 40,
      alpha: 0.1
    }, {
      duration: 1500,
      loop: true
    }).stop()

    const heart4 = new Hilo.Bitmap({
      x: 500,
      y: 85,
      image: asset.getContent('heart4.png')
    })
    const tween4 = Hilo.Tween.to(heart4, {
      x: 500,
      y: 10,
      scaleX: 1.1,
      scaleY: 1.1,
      alpha: 0
    }, {
      duration: 1500,
      loop: true
    }).stop()
    const tween1 = new Hilo.Tween(heart1, {
      scaleX: 0.5,
      scaleY: 0.5
    }, {
      scaleX: 1.6,
      scaleY: 1.6
    }, {
      duration: 500
    }).link(new Hilo.Tween(heart1, {
      scaleX: 1.6,
      scaleY: 1.6
    }, {
      scaleX: 1,
      scaleY: 1
    }, {
      duration: 500,
      onComplete: () => {
        heart2.addTo(content)
        heart3.addTo(content)
        heart4.addTo(content)
        tween2.start()
        tween3.start()
        tween4.start()
      }
    }))
    const cover = new Hilo.Container({
      y: 50,
      width: 505,
      height: 95,
      background: 'white'
    }).addTo(content)
    const coverTween = Hilo.Tween.to(cover, {
      x: 505
    }, {
      duration: 2000,
      onComplete: () => {
        heart1.addTo(content)
        tween1.start()
      }
    }).stop()
    this.heartTween.push(coverTween)
    return content
  }
  createOptionA () {
    const option = {}
    const view = option.view = new Hilo.Container({
      x: 50,
      y: 332
    })

    new Hilo.Bitmap({
      width: 260,
      height: 300,
      image: asset.getContent('A.png')
    }).addTo(view)

    new EventUtil(view).on('click', () => {
      this.chooseAnswer('A', option)
    })
    option.params = {
      top: 332,
      left: 50,
      width: 260,
      height: 300
    }
    return option
  }
  createOptionB () {
    const option = {}
    const view = option.view = new Hilo.Container({
      x: 440,
      y: 332
    })
    new Hilo.Bitmap({
      image: asset.getContent('B.png')
    }).addTo(view)
    new EventUtil(view).on('click', () => {
      this.chooseAnswer('B', option)
    })
    option.params = {
      top: 332,
      left: 440,
      width: 260,
      height: 310
    }
    return option
  }
  createOptionC () {
    const option = {}
    const view = option.view = new Hilo.Container({
      x: 248,
      y: 643
    })
    new Hilo.Bitmap({
      image: asset.getContent('C.png')
    }).addTo(view)
    new EventUtil(view).on('click', () => {
      this.chooseAnswer('C', option)
    })
    option.params = {
      top: 643,
      left: 248,
      width: 272,
      height: 330
    }
    return option
  }
  createOptionD () {
    const option = {}
    const view = option.view = new Hilo.Container({
      x: 50,
      y: 992
    })
    new Hilo.Bitmap({
      image: asset.getContent('D.png')
    }).addTo(view)
    new EventUtil(view).on('click', () => {
      this.chooseAnswer('D', option)
    })
    option.params = {
      top: 992,
      left: 50,
      width: 260,
      height: 294
    }
    return option
  }
  createOptionE () {
    const option = {}
    const view = option.view = new Hilo.Container({
      x: 440,
      y: 992
    })
    new Hilo.Bitmap({
      image: asset.getContent('E.png')
    }).addTo(view)
    new EventUtil(view).on('click', () => {
      this.chooseAnswer('E', option)
    })
    option.params = {
      top: 992,
      left: 440,
      width: 260,
      height: 316
    }
    return option
  }
  toReadyView () {
    const content = new Hilo.Container()
    this.createAdronTopView().addTo(content)
    this.createAdronBottomView().addTo(content)
    this.createOptionA().view.addTo(content)
    this.createOptionB().view.addTo(content)
    this.createOptionC().view.addTo(content)
    this.createOptionD().view.addTo(content)
    this.createOptionE().view.addTo(content)
    new Hilo.Bitmap({
      x: 50,
      y: 194,
      image: asset.getContent('topic2.png')
    }).addTo(content)
    return content
  }
  chooseAnswer (answer, option) {
    if (this.isEnd) return
    this.isEnd = true
    // 处理bitmap
    const gif = this.gif = new Image()
    gif.className = 'gif'
    gif.src = `${Global.publicPath}/topic2/${answer}.gif?t=${Global.timeStamp}`
    document.getElementById('app').appendChild(gif)
    new NewDom(gif, option.params).listenChange()

    this.fire('chooseAnswer', {
      instance: this,
      topic: 'q2',
      answer
    })
  }
  createAdronBottomView () {
    const content = new Hilo.Container()
    new Hilo.Bitmap({
      x: 245,
      y: 1346,
      image: asset.getContent('line.png')
    }).addTo(content)

    const heart1 = new Hilo.Bitmap({
      x: 230,
      y: 1396,
      pivotX: 10,
      pivotY: 10,
      image: asset.getContent('heart1.png')
    })
    const heart2 = new Hilo.Bitmap({
      x: 230,
      y: 1396,
      image: asset.getContent('heart2.png')
    })
    const tween2 = Hilo.Tween.to(heart2, {
      x: 200,
      y: 1350,
      alpha: 0.2,
      scaleX: 1.4,
      scaleY: 1.4
    }, {
      delay: 500,
      duration: 1500,
      loop: true
    }).stop()

    const heart3 = new Hilo.Bitmap({
      width: 20,
      height: 20,
      x: 230,
      y: 1396,
      image: asset.getContent('heart3.png')
    })
    const tween3 = Hilo.Tween.to(heart3, {
      x: 180,
      y: 1350,
      alpha: 0.1
    }, {
      duration: 1500,
      loop: true
    }).stop()

    const heart4 = new Hilo.Bitmap({
      x: 230,
      y: 1396,
      image: asset.getContent('heart4.png')
    })
    const tween4 = Hilo.Tween.to(heart4, {
      x: 250,
      y: 1300,
      scaleX: 1.1,
      scaleY: 1.1,
      alpha: 0
    }, {
      duration: 1500,
      loop: true
    }).stop()
    const tween1 = new Hilo.Tween(heart1, {
      scaleX: 0.5,
      scaleY: 0.5
    }, {
      scaleX: 1.6,
      scaleY: 1.6
    }, {
      duration: 500
    }).link(new Hilo.Tween(heart1, {
      scaleX: 1.6,
      scaleY: 1.6
    }, {
      scaleX: 1,
      scaleY: 1
    }, {
      duration: 500,
      onComplete: () => {
        heart2.addTo(content)
        heart3.addTo(content)
        heart4.addTo(content)
        tween2.start()
        tween3.start()
        tween4.start()
      }
    }))
    const cover = new Hilo.Container({
      x: 245,
      y: 1346,
      width: 505,
      height: 95,
      background: 'white'
    }).addTo(content)
    const coverTween = Hilo.Tween.to(cover, {
      x: -300
    }, {
      duration: 2000,
      onComplete: () => {
        heart1.addTo(content)
        tween1.start()
      }
    }).stop()
    this.heartTween.push(coverTween)
    return content
  }
  show (parent, time) {
    this.view.addTo(parent.getStage())
    this.audio.src = `${Global.publicPath}/topic2/audio.mp3`
    this.audio.play()
    this.view.y = Global.height
    parent.setBalanceType('none')
    Hilo.Tween.to(this.view, {
      y: 0
    }, {
      duration: time,
      onComplete: () => {
        this.heartTween.forEach(t => t.start())
      }
    })
  }
  end (time) {
    this.gif = null
    this.audio.pause()
    $('.gif').remove()
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
