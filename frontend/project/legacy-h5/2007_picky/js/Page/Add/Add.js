/**
 * 扩充页
 * 提供用户自定义输入
 */
import $ from '$'
import Hilo from 'hilo'
import Handlebars from 'handlebars'
import Page from '../../Class/Page'
import asset from './asset'
import {
  getRandomNumBoth
} from '../../../../legacy/utils/legacy-utils.js'
import elemToShack from './elementShack'
import {
  isAndroid,
  isIOS
} from '../../../../legacy/utils/legacy-utils.js'
import {
  centerX,
  bottom,
  px,
  right
} from '../../Class/Util'
import {
  getElementLeft,
  getElementTop
} from './dom'

import addTemplateSource from './Add.hbs?raw'
import MyScroller from '../../Class/MyScroller'
import './Add.less'
import { getWinHeight, winWidth } from '../../Class/Global'
import AddBall from './addBall'

const AddHbs = Handlebars.compile(addTemplateSource)

export default class Add extends Page {
  constructor () {
    super()
    this.asset = asset
    this.customOptions = []
    this.isAnimating = false
  }
  ready () {
    this.view = new Hilo.Container({
      id: 'add-container',
      width: winWidth,
      height: getWinHeight()
    })
    this.topView = this.initTopView(this.view)
    this.bottomView = this.initBottomView(this.view)
  }
  initBottomView (parent) {
    const c = new Hilo.Container({
      width: 750,
      height: 561,
      x: centerX(750),
      y: bottom(0, 561)
    }).addTo(parent)

    new Hilo.Bitmap({
      width: 750,
      height: 561,
      image: asset.getContent('grid.png')
    }).addTo(c)

    new Hilo.Bitmap({
      y: 561 - 331,
      width: 750,
      height: 331,
      image: asset.getContent('mangguo.png')
    }).addTo(c)

    return c
  }
  initTopView (parent) {
    const c = new Hilo.Container({
      background: '#cdbafa',
      x: centerX(750),
      y: 0,
      width: 750,
      height: 1206
    }).addTo(parent)

    new Hilo.Bitmap({
      y: 435,
      x: (750 - 560) / 2,
      width: 560,
      height: 716,
      image: asset.getContent('bg-board.png')
    }).addTo(c)

    new Hilo.Bitmap({
      width: 750,
      height: 510,
      image: asset.getContent('bg-top.png')
    }).addTo(c)

    new Hilo.Bitmap({
      x: right(26, 13),
      y: 505,
      width: 13,
      height: 149,
      image: asset.getContent('adorn.png')
    }).addTo(c)

    new Hilo.Bitmap({
      x: 52,
      y: 455,
      width: 43,
      height: 158,
      image: asset.getContent('tip-num.png')
    }).addTo(c)

    return c
  }
  drawOptionsNum (num) {
    if (this.num) this.num.removeFromParent()
    this.num = new Hilo.Container({
      x: 52,
      y: 565
    }).addTo(this.topView)

    new Hilo.Text({
      width: 44,
      height: 50,
      y: 10,
      textAlign: 'center',
      font: `${px(28)}px arial`,
      color: '#60C756',
      text: String(num)
    }).addTo(this.num)
  }
  show (parent, options) {
    const that = this
    return new Promise((resolve, reject) => {
      that.options = options
      //  第一次绘制全部选项
      that.drawAllOptions(options)
      that.drawOptionsNum(options.length)
      that.view.alpha = 0
      that.view.addTo(parent)
      that.initScroller()
      new Hilo.Tween(that.view, {
        alpha: 0
      }, {
        alpha: 1
      }, {
        loop: false,
        onComplete: () => {
          that.renderHtml().then(() => {
            that.handleBanlence()
            that.scroller.setDimensionsY(that.getOptionsViewHeight(options) - 115)
            that.scroller.scrollTo(0, that.getOptionsViewHeight(options) - 115, true)
            resolve()
          })
        }
      }).start()
    })
  }
  hide () {
    const that = this
    return new Promise((resolve, reject) => {
      if (!document.getElementById('Add')) alert('运行错误: #Add 不存在')
      $('#Add').hide()
      new Hilo.Tween(that.view, {
        alpha: 1
      }, {
        alpha: 0
      }, {
        loop: false,
        onComplete: () => {
          this.view.removeFromParent()
          resolve()
        }
      }).start()
    })
  }
  renderHtml () {
    const that = this
    return new Promise((resolve, reject) => {
      let timer = null
      var html = AddHbs()
      $(html).appendTo($('#app'))
      function funcCycle () {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
          if ($('#Add .input .label')[0]) {
            that.bindEvent()
            resolve()
          } else {
            funcCycle()
          }
        }, 100)
      }
      funcCycle()
    })
  }
  bindEvent () {
    const self = this
    // 监听获取焦点
    $('#Add .input input').on('focus', () => {
      $('#Add .input input').val('')
      $('#Add .input input').attr('placeholder', '请输入补充的食物名称...')
    })

    // 监听点击 +1
    $('#Add .input .label').on('click', (e) => {
      if (self.isAnimating) return // 是否正在抛出小球
      const name = $('#Add .input input').val()
      self.judgeNameLegal(name).then(() => { // 判断合法性
        const num = getRandomNumBoth(0, 5)
        const image = self.asset.getContent(`random/${num}.png`)
        const option = {
          name,
          image
        }
        self.customOptions.push(option)
        self.options.push(option)
        // 添加选项
        self.drawAddOptions(option)
        self.ballMove(e).then(() => { // 抛出小球
          self.drawOptionsNum(self.options.length)
        })
        $('#Add .input input').val('')
      }).catch((err) => {
        $('#Add .input input').attr('placeholder', '你输入的好像不是食物哦')
        $('#Add .input input').val('')
        elemToShack($('#Add .input')[0])
        console.warn(err)
      })
    })

    // 监听点击 没有啦
    $('#Add .submit').on('click', () => {
      this.fire('submit', this.customOptions)
    })
  }
  judgeNameLegal (name) {
    return new Promise((resolve, reject) => {
      const normalized = String(name || '').trim()
      if (!normalized) {
        reject(new Error('输入为空'))
        return
      }
      if (normalized.length > 6) {
        reject(new Error('输入过长'))
        return
      }
      resolve()
    })
  }
  getOptionsViewHeight (options) {
    return Math.ceil(options.length / 5) * 115
  }
  drawAddOptions (option) {
    const index = this.options.length - 1
    const col = index % 5
    const row = Math.floor(index / 5)
    const x = col * 104
    const y = row * 115
    this.drawSingleOption(x, y, option, this.optionsView)

    // 不知道为啥, 到第二行, 就不走了...
    this.scroller.setDimensionsY(this.getOptionsViewHeight(this.options) - 115)
    this.scroller.scrollTo(0, this.getOptionsViewHeight(this.options) - 115, true)
  }
  drawAllOptions (options) {
    const h = this.getOptionsViewHeight(options)
    this.optionsView = new Hilo.Container({
      width: 500,
      height: h + 300,
      x: (750 - 500) / 2,
      y: 464
    }).addTo(this.topView, 1)
    options.map((item, index) => {
      const col = index % 5
      const row = Math.floor(index / 5)
      const x = col * 104
      const y = row * 115
      this.drawSingleOption(x, y, item, this.optionsView)
    })
  }
  drawSingleOption (x, y, optionInfo, parent) {
    const c = new Hilo.Container({
      x,
      y,
      width: 84,
      height: 84
    }).addTo(parent)

    new Hilo.Graphics({
      width: 85,
      height: 85
    })
      .beginFill('#fff')
      .drawEllipse(0, 0, 85 - 1, 85)
      .endFill()
      .addTo(c)

    new Hilo.Bitmap({
      width: 86,
      height: 86,
      image: optionInfo.image
    }).addTo(c)

    new Hilo.Text({
      width: 85,
      y: 90,
      textAlign: 'center',
      font: '16px arial',
      text: optionInfo.name
    }).addTo(c)
  }
  scrollerTo (top) {
    this.optionsView.y = -top + 464
  }
  initScroller () {
    const scroller = this.scroller = new MyScroller(this.view, this.optionsView)
    scroller.on('top', (top) => {
      this.scrollerTo(top.detail)
    })
  }
  handleBanlence () {
    // 处理安卓键盘抬起事件
    if (isAndroid()) this.handleAndroidInput()
    if (isIOS()) this.handleIosInput()
  }
  handleIosInput () {
    $('input').on('blur', function () { // 失去焦点, 页面回滚到原来地方
      setTimeout(function () {
        window.scrollTo(0, 0)
      }, 100)
    })
  }
  handleAndroidInput () {
    const originalHeight = document.documentElement.clientHeight || document.body.clientHeight // 变化之前的高度
    window.addEventListener('resize', () => {
      const resizeHeight = document.documentElement.clientHeight || document.body.clientHeight // 变化之后的高度
      if (resizeHeight < originalHeight) { // 变小了, 证明键盘抬起, 然后移动页面, 并调整dom的高度
        this.view.y = -600
      } else { // 键盘放下去了, 回到之前的状态
        this.view.y = 0
      }
    })
  }
  ballMove (e) {
    let addBall = new AddBall(asset, this.view)
    let label = $('.label')[0]
    let p1 = [getElementLeft(label), getElementTop(label)] // 起点坐标
    let p2 = [this.num.x, this.num.y] // 终点座标
    let c1 = [200, 10]
    let c2 = [500, 100]
    return addBall.playAnimation(p1, p2, c2, c1)
  }
}
