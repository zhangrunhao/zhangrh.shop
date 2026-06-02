import $ from '$'
import Hilo from 'hilo'
import asset from './asset'
import Global from '../../Class/Global'
import NewDom from '../../Class/NewDom'
import EventUtil from '../../Class/EventUtil'
import Topic from '../../Class/Topic'
export default class Topic5 extends Topic {
  constructor (p) {
    super(p)
    this.asset = asset
    this.diff = {
      A: 55,
      B: 45,
      C: 20,
      D: 10
    }
    this.isEnd = false // 判断是否执行了结束
  }
  initGifAndPlay () {
    const that = this
    if (this.isEnd) return

    // A
    let gif = asset.getContent('5A-before.gif')
    gif.className = 'gif'
    gif.onclick = function () {
      that.chooseAnswer('A')
    }
    document.getElementById('app').appendChild(gif)
    new NewDom(gif, {
      top: 296 - this.diff.A,
      left: 50,
      width: 348,
      height: 220
    }).listenChange()

    // B
    gif = asset.getContent('5B-before.gif')
    gif.className = 'gif'
    gif.onclick = function () {
      that.chooseAnswer('B')
    }
    document.getElementById('app').appendChild(gif)
    new NewDom(gif, {
      top: 555 - this.diff.B,
      left: 92,
      width: 348,
      height: 220
    }).listenChange()

    // C
    gif = asset.getContent('5C-before.gif')
    gif.className = 'gif'
    gif.onclick = function () {
      that.chooseAnswer('C')
    }
    document.getElementById('app').appendChild(gif)
    new NewDom(gif, {
      top: 805 - this.diff.C,
      left: 50,
      width: 348,
      height: 220
    }).listenChange()

    // D
    gif = asset.getContent('5D-before.gif')
    gif.className = 'gif'
    gif.onclick = function () {
      that.chooseAnswer('D')
    }
    document.getElementById('app').appendChild(gif)
    new NewDom(gif, {
      top: 1076 - this.diff.D,
      left: 92,
      width: 348,
      height: 220
    }).listenChange()
  }
  toReadyView () {
    const content = new Hilo.Container()
    new Hilo.Bitmap({
      x: 50,
      y: 148 - 70,
      image: asset.getContent('topic5.png')
    }).addTo(content)
    const lineArrY = [
      480 - this.diff.A,
      740 - this.diff.B,
      990 - this.diff.C,
      1260 - this.diff.D]
    for (let i = 0; i < 4; i++) {
      new Hilo.Bitmap({
        y: lineArrY[i],
        image: asset.getContent('line.png')
      }).addTo(content)
    }
    // A
    new Hilo.Bitmap({
      x: 50,
      y: 296 - this.diff.A,
      image: asset.getContent('A-pic.png')
    }).addTo(content)
    const A = new Hilo.Bitmap({
      x: 510,
      y: 325 - this.diff.A,
      image: asset.getContent('A-word.png')
    }).addTo(content)
    new EventUtil(A).on('click', () => {
      this.chooseAnswer('A')
    })

    // B
    new Hilo.Bitmap({
      x: 92,
      y: 555 - this.diff.B,
      image: asset.getContent('B-pic.png')
    }).addTo(content)
    const B = new Hilo.Bitmap({
      x: 542,
      y: 580 - this.diff.B,
      image: asset.getContent('B-word.png')
    }).addTo(content)
    new EventUtil(B).on('click', () => {
      this.chooseAnswer('B')
    })

    // C
    new Hilo.Bitmap({
      x: 50,
      y: 805 - this.diff.C,
      image: asset.getContent('C-pic.png')
    }).addTo(content)
    const C = new Hilo.Bitmap({
      x: 510,
      y: 838 - this.diff.C,
      image: asset.getContent('C-word.png')
    }).addTo(content)
    new EventUtil(C).on('click', () => {
      this.chooseAnswer('C')
    })

    // D
    new Hilo.Bitmap({
      x: 92,
      y: 1076 - this.diff.D,
      image: asset.getContent('D-pic.png')
    }).addTo(content)
    const D = new Hilo.Bitmap({
      x: 542,
      y: 1105 - this.diff.D,
      image: asset.getContent('D-word.png')
    }).addTo(content)
    new EventUtil(D).on('click', () => {
      this.chooseAnswer('D')
    })
    return content
  }
  chooseAnswer (answer) {
    if (this.isEnd) return
    this.isEnd = true
    const positionAfter = {
      A: {
        top: 296 - 15 - this.diff.A,
        left: 50,
        width: 396,
        height: 236
      },
      B: {
        top: 555 - 12 - this.diff.B,
        left: 92,
        width: 396,
        height: 236
      },
      C: {
        top: 805 - 12 - this.diff.C,
        left: 50,
        width: 396,
        height: 236
      },
      D: {
        top: 1076 - 15 - this.diff.D,
        left: 92,
        width: 396,
        height: 236
      }
    }
    const that = this
    const gif = this.gif = new Image()
    gif.className = 'gif'
    gif.src = `${Global.publicPath}/topic5/5${answer}-after.gif?t=${Global.timeStamp}`
    gif.onload = function () {
      document.getElementById('app').appendChild(gif)
      new NewDom(gif, positionAfter[answer]).listenChange()
      that.fire('chooseAnswer', {
        instance: that,
        topic: 'q5',
        answer
      })
    }
  }
  show (parent, time) {
    this.view.addTo(parent.getStage())
    this.audio.src = `${Global.publicPath}/topic5/audio.mp3`
    this.audio.play()
    this.view.y = Global.height
    Hilo.Tween.to(this.view, {
      y: 0
    }, {
      duration: time,
      onComplete: () => {
        this.initGifAndPlay()
      }
    })
  }
  end (time) {
    this.audio.pause()
    $('.gif').remove()
    this.gif = null
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
