import $ from '$'
import Hilo from 'hilo'
import asset from './asset'
import Global from '../../Class/Global'
import NewDom from '../../Class/NewDom'
import Topic from '../../Class/Topic'

import {
  getStringCodeLength,
  isAndroid,
  isIOS
} from '../../../../legacy/utils/legacy-utils.js'

export default class Information extends Topic {
  constructor () {
    super()
    this.info = {
      gender: 'woman',
      state: 'single',
      name: ''
    }
    this.asset = asset
    this.tickGender = null // 性别问题上的对号
    this.tickState = null // 状态问题上的对号
  }
  toReadyView () {
    const content = new Hilo.Container()
    const runView = this.runView = new Hilo.Container({
      background: 'white'
    }).addTo(content)
    new Hilo.Container({
      width: 50,
      height: 20,
      x: 0,
      y: 130,
      background: 'white'
    }).addTo(content)

    new Hilo.Container({
      width: 50,
      height: 20,
      x: Global.width - 50,
      y: 130,
      background: 'white'
    }).addTo(content)

    new Hilo.Container({
      width: Global.width,
      height: 130,
      background: 'white'
    }).addTo(content)

    new Hilo.Bitmap({
      x: 50,
      y: 130,
      image: asset.getContent('rod.png')
    }).addTo(content)

    var frames = []
    for (var i = 1; i <= 3; i++) {
      frames.push({
        image: asset.getContent(`load${i}.png`),
        rect: [0, 0, 261, 101]
      })
    }
    frames.push({
      image: asset.getContent(`load2.png`),
      rect: [0, 0, 260, 100]
    })
    this.loadSprite = new Hilo.Sprite({
      x: 270,
      y: 400,
      frames,
      timeBased: true,
      interval: 300
    })

    // 背景
    new Hilo.Bitmap({
      x: 80,
      y: 140,
      image: asset.getContent('shadow.png')
    }).addTo(runView)
    new Hilo.Bitmap({
      x: 60,
      y: 130,
      image: asset.getContent('paper.png')
    }).addTo(runView)

    // 问题1
    new Hilo.Bitmap({
      x: 104,
      y: 216,
      image: asset.getContent('gender.png')
    }).addTo(runView)
    new Hilo.Bitmap({
      x: 152,
      y: 300,
      image: asset.getContent('woman.png')
    }).on(Hilo.event.POINTER_START, () => {
      this.chooseAnswer({
        question: 'gender',
        answer: 'woman'
      })
    }).addTo(runView)
    new Hilo.Bitmap({
      x: 436,
      y: 300,
      image: asset.getContent('man.png')
    }).on(Hilo.event.POINTER_START, () => {
      this.chooseAnswer({
        question: 'gender',
        answer: 'man'
      })
    }).addTo(runView)

    // 问题2
    new Hilo.Bitmap({
      x: 104,
      y: 624,
      image: asset.getContent('emotionalstate.png')
    }).addTo(runView)
    new Hilo.Bitmap({
      x: 104,
      y: 706,
      image: asset.getContent('single.png')
    }).on(Hilo.event.POINTER_START, () => {
      this.chooseAnswer({
        question: 'state',
        answer: 'single'
      })
    }).addTo(runView)
    new Hilo.Bitmap({
      x: 282,
      y: 706,
      image: asset.getContent('companion.png')
    }).on(Hilo.event.POINTER_START, () => {
      this.chooseAnswer({
        question: 'state',
        answer: 'companion'
      })
    }).addTo(runView)
    new Hilo.Bitmap({
      x: 488,
      y: 706,
      image: asset.getContent('married.png')
    }).on(Hilo.event.POINTER_START, () => {
      this.chooseAnswer({
        question: 'state',
        answer: 'married'
      })
    }).addTo(runView)

    // 问题3
    new Hilo.Bitmap({
      x: 104,
      y: 844,
      image: asset.getContent('name.png')
    }).addTo(runView)
    this.bitmapInput = new Hilo.Bitmap({
      x: 100,
      y: 912,
      image: asset.getContent('name_input.png')
    }).addTo(runView)

    // 提交按钮
    new Hilo.Bitmap({
      x: 100,
      y: 1100,
      image: asset.getContent('submission.png')
    }).on(Hilo.event.POINTER_START, () => {
      this.submit()
    }).addTo(runView)

    // 选择符号
    this.tickGender = new Hilo.Bitmap({
      x: 162,
      y: 314,
      image: asset.getContent('tick.png')
    }).addTo(runView)

    this.tickState = new Hilo.Bitmap({
      x: 114,
      y: 720,
      image: asset.getContent('tick.png')
    }).addTo(runView)
    return content
  }
  chooseAnswer (obj) {
    const question = obj.question
    const answer = obj.answer
    if (question === 'gender') { // 处理性别问题
      this.handleGenderQustion(answer)
    } else if (question === 'state') { // 处理状态问题
      this.handleStateQustion(answer)
    }
  }
  handleStateQustion (answer) {
    let x = {
      single: 114,
      companion: 293,
      married: 496
    }
    this.info.state = answer
    this.tickState.x = x[answer]
  }
  handleGenderQustion (answer) {
    this.info.gender = answer
    this.tickGender.x = (answer === 'woman' ? 162 : 444)
  }
  getName () {
    return document.getElementById('infoInput').value
  }
  checkNameLegal (name, cb) {
    if (!name) return cb(false, 'empty')
    if (getStringCodeLength(name) > 12) return cb(false, 'tooLong')
    cb(true)
    return true
  }
  submit () {
    const name = this.info.name = this.getName()
    if (isIOS()) document.getElementById('infoInput').blur() // 如果是在ios里面, 提交就让其失去焦点, 并让键盘落下
    this.checkNameLegal(name, (isLegal, info) => {
      if (isLegal) { // 合法
        // 收回键盘
        setTimeout(() => {
          window.scrollTo(0, 0)
          this.fire('submit', {
            instance: this,
            info: this.info
          })
        }, 100)
      } else { // 不合法
        const falut = new Hilo.Bitmap({
          x: 110,
          y: 1040,
          image: asset.getContent(`${info}.png`)
        }).addTo(this.view)
        $('#infoInput').bind('input porpertychange', () => {
          falut.removeFromParent()
        })
      }
    })
  }
  handleBanlence () {
    const banlanceDom = new NewDom(document.getElementById('infoInput'), {
      top: 910,
      left: 100,
      width: isIOS() ? 550 - 50 : 550 - 30,
      height: isIOS() ? 100 - 20 : 100,
      paddingLeft: 30,
      fontSize: 40
    }).listenChange()
    // 处理安卓键盘抬起事件
    if (isAndroid()) this.handleAndroidInput(banlanceDom)
    if (isIOS()) this.handleIosInput()
  }
  handleIosInput () {
    $('input').on('blur', function () { // 失去焦点, 页面回滚到原来地方
      setTimeout(function () {
        window.scrollTo(0, 0)
      }, 100)
    })
  }
  handleAndroidInput (banlanceInput) {
    const originalHeight = document.documentElement.clientHeight || document.body.clientHeight // 变化之前的高度
    window.addEventListener('resize', () => {
      const resizeHeight = document.documentElement.clientHeight || document.body.clientHeight // 变化之后的高度
      if (resizeHeight < originalHeight) { // 变小了, 证明键盘抬起, 然后移动页面, 并调整dom的高度
        this.view.y = -600
        banlanceInput.fouceSetStyle('top', '138px')
      } else { // 键盘放下去了, 回到之前的状态
        this.view.y = 0
        banlanceInput.autoChange()
      }
    })
  }
  show (parent, time) {
    this.view.addTo(parent.getStage())
    this.handleBanlence()
    this.view.y = Global.height
    Hilo.Tween.to(this.view, {
      y: 0
    }, {
      duration: time,
      onComplete: () => {
        this.bitmapInput.removeFromParent()
        $('#infoInput').show()
      }
    })
  }
  end (time, cb) {
    this.bitmapInput.addTo(this.runView)
    $('#infoInput').hide()
    Hilo.Tween.to(this.runView, {
      y: -Global.height + 300
    }, {
      duration: time,
      onComplete: () => {
        this.loadSprite.addTo(this.view)
        this.clear()
        if (cb instanceof Function) cb()
      }
    })
  }
}
