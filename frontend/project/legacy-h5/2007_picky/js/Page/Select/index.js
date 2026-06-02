/**
 * 选择页面
 */
import Hilo from 'hilo'

import Page from '../../Class/Page'
import MyScroller from '../../Class/MyScroller'
import {
  centerY
} from '../../Class/Util'
import {
  isSohu
} from '../../../../legacy/utils/legacy-utils.js'

import asset from './asset'
import CoverView from './view/cover'
import GridView from './view/grid'
import FruitView from './view/fruit'
import AdornView from './view/adorn'
import OtherView from './view/other'
import MeatView from './view/meat'
import VegetableView from './view/vegetable'
import TrashView from './view/trash'
import ProgressLine from './view/ProgressLine'
import TipView from './view/tip'
import Ball from './view/ball'
import Bubble from './view/bubble'
import { getWinHeight } from '../../Class/Global'
import { isFunction } from 'lodash'

export default class Select extends Page {
  constructor (props) {
    super(props)
    this.asset = asset
    this.playAnimating = false
    this.state = 'init' // 'fruit', 'other'...
    this.view = null // 试图
    this.scroller = null
    this.audio = new Audio(new URL('./asset/Select/click.mp3', window.location.href).href)
    this.flag = {
      isStart: false
    }
  }
  initView () {
    const content = new Hilo.Container({
      id: 'select-container'
    })

    this.cover = new CoverView(asset)
    this.grid = new GridView(asset)

    // 各个选择面板
    this.fruit = new FruitView(asset, this.flag)
    this.fruit.on('selectOptionsNumberChange', this.selectOptionsNumberChange.bind(this))
    this.fruit.view.x = 150
    this.other = new OtherView(asset, this.flag)
    this.other.on('selectOptionsNumberChange', this.selectOptionsNumberChange.bind(this))
    this.meat = new MeatView(asset, this.flag)
    this.meat.on('selectOptionsNumberChange', this.selectOptionsNumberChange.bind(this))
    this.vegetable = new VegetableView(asset, this.flag)
    this.vegetable.on('selectOptionsNumberChange', this.selectOptionsNumberChange.bind(this))

    // 装饰
    this.adorn = new AdornView(asset)
    this.bubble = new Bubble(asset)

    // 垃圾桶
    this.trash = new TrashView(asset)

    this.trash.on('complete', () => {
      const all = [].concat(
        this.fruit.selectedOptions,
        this.other.selectedOptions,
        this.vegetable.selectedOptions,
        this.meat.selectedOptions
      )
      // 去除没有选择不能继续的流程
      // if (all.length === 0) return
      // 进行提示
      this.fire('complete', all)
    })

    // 抛物线球
    this.ball = new Ball(asset, content)

    // 进度条
    this.progress = new ProgressLine(asset)

    // 指示按钮
    this.tip = new TipView(asset)

    // 首次显示
    this.grid.view.addTo(content)
    // this.bubble.topBubble.addTo(content)
    this.bubble.bottomBubble.addTo(content)
    this.cover.view.addTo(content)
    this.adorn.view.addTo(content)
    this.tip.view.addTo(content)

    this.panelArr = [
      this.fruit,
      this.vegetable,
      this.meat,
      this.other
    ]

    const panelWidth = this.panelArr.reduce((preView, curView) => {
      curView.view.x = preView.addWidth
      curView.addWidth = preView.addWidth + curView.width
      return curView
    }, {
      addWidth: 0
    }).addWidth

    this.panel = new Hilo.Container({
      width: panelWidth,
      height: 1206,
      x: 150,
      y: centerY(1206)
    }).addTo(content, 1)

    this.fruit.view.addTo(this.panel)
    this.vegetable.view.addTo(this.panel)
    this.meat.view.addTo(this.panel)
    this.other.view.addTo(this.panel)

    return content
  }
  ready () {
    this.view = this.initView()

    if (isSohu()) {
      this.scroller = new MyScroller(this.view).on('top', (top) => {
        const distance = top.detail
        this.scrollTo(distance)
      })
      this.scroller.setDimensionsY(this.panel.width - 750)
    } else {
      this.scroller = new MyScroller(this.view).on('left', (left) => {
        const distance = left.detail
        this.scrollTo(distance)
      })
      this.scroller.setDimensions(this.panel.width - 750)
    }
  }
  selectOptionsNumberChange (e) {
    if (e.detail) { // 选中
      this.audio.play()
      try {
        this.trash.playCoverOpenShack().then(() => {
          this.ball.playAnimation(e.detail.startX, e.detail.startY, 670, getWinHeight() - 100, 2000).then(() => {
            this.trash.playCoverCloseShack()
          })
        })
      } catch (error) {
        // 这里的动画错误不会影响计算
      }
    }
    var num = [].concat(
      this.fruit.selectedOptions,
      this.meat.selectedOptions,
      this.other.selectedOptions,
      this.vegetable.selectedOptions
    ).length
    this.trash.drawNum(num)
  }
  show (parent) {
    const that = this
    return new Promise((resolve, reject) => {
      that.view.addTo(parent)
      that.view.alpha = 0
      new Hilo.Tween(that.view, {
        alpha: 0
      }, {
        alpha: 1
      }, {
        loop: false,
        onComplete: () => {
          resolve()
        }
      }).start()
    })
  }
  hide () {
    const that = this
    return new Promise((resolve, reject) => {
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
  scrollTo (distance) {
    this.drawPositionFlag(distance)

    if (this.playAnimating) return

    // 初始状态, 并通过开始动画
    if (this.state === 'init' && distance > 20) {
      this.playAnimating = true
      this.playStartAnimate().then(() => {
        this.scroller.scrollTo(0, 0, false)
        this.changeNowSelectType('fruit')
        this.playAnimating = false
      })
    }

    if (this.state !== 'init') {
      if (distance > this.getMaxScroll(this.state) && this.state !== 'other') {
        this.scroller.stop()
        this.scroller.cancelTouch(true)
        this.playAnimating = true

        let targetDistance = this.getMaxScroll(this.state) + 750

        if (isSohu()) {
          this.scroller.__publish(0, targetDistance, 0, false)
        } else {
          this.scroller.__publish(targetDistance, 0, 0, false)
        }

        this.playTransitionAnimation(this.state, this.getNextType(), () => {
          this.changeNowSelectType(this.getNextType())
          this.drawPositionFlag(distance)
          this.playAnimating = false
          this.scroller.cancelTouch(false)
        })
        return
      }

      if (distance < this.getMinScroll(this.state) && this.state !== 'fruit') {
        this.scroller.stop()
        this.scroller.cancelTouch(true)
        this.playAnimating = true

        let targetDistance = this.getMinScroll(this.state) - 750
        if (isSohu()) {
          this.scroller.__publish(0, targetDistance, 0, false)
        } else {
          this.scroller.__publish(targetDistance, 0, 0, false)
        }

        this.playPreTransitionAnimation(this.state, this.getPreType(this.state), () => {
          this.changeNowSelectType(this.getPreType(this.state))
          this.drawPositionFlag(distance)
          this.playAnimating = false
          this.scroller.cancelTouch(false)
        })
        return
      }
      this.panel.x = -distance
    }
  }
  drawPositionFlag (distance) {
    if (this.state === 'init') return
    let preState = this.getPreType(this.state)
    let x = 0
    if (preState) x = this[preState].addWidth
    let index = Math.floor((distance - x) / 750)
    this.progress.drawPositionFlag(this.state, this.getStateRealColor(this.state), index)
  }
  getMinScroll (state) {
    return this[state].addWidth - this[state].width
  }
  getMaxScroll (state) {
    let pre = this.getPreType(state)
    let addWidth = pre ? this[pre].addWidth : 0
    let max = addWidth + this[state].width - 750
    return max
  }
  getPreType (state) {
    switch (state) {
      case 'vegetable':
        return 'fruit'
      case 'meat':
        return 'vegetable'
      case 'other':
        return 'meat'
    }
  }
  getNextType () {
    switch (this.state) {
      case 'fruit':
        return 'vegetable'
      case 'vegetable':
        return 'meat'
      case 'meat':
        return 'other'
    }
  }
  getStateRealColor (state) {
    switch (state) {
      case 'fruit':
        return '#ffa101'
      case 'meat':
        return '#f9d817'
      case 'vegetable':
        return '#3fcd3d'
      case 'other':
        return '#7c4bf5'
    }
  }
  getStateColor (state) {
    switch (state) {
      case 'fruit':
        return 'orange'
      case 'meat':
        return 'yellow'
      case 'vegetable':
        return 'green'
      case 'other':
        return 'purple'
    }
  }
  // 播放转载动画
  playTransitionAnimation (pre, next, pageAnimationCallback, allAnimationCallback) {
    const panelAnimation = new Promise((resolve, reject) => {
      const originX = this.panel.x
      new Hilo.Tween(this.panel, {
        x: originX
      }, {
        x: -(this.getMaxScroll(this.state) + 750)
      }, {
        onComplete: () => {
          resolve()
          isFunction(pageAnimationCallback) && pageAnimationCallback()
        }
      }).start()
    })
    Promise.all([
      this.trash.nextColor(this.getStateRealColor(next)),
      panelAnimation,
      this.cover.playWordSquireAnimate(),
      this.cover.playColorSquirmAnimate(this.getStateColor(pre), this.getStateColor(next), this.getNextType())
    ]).then(() => {
      isFunction(allAnimationCallback) && allAnimationCallback()
    })
  }
  // 播放返回动画
  playPreTransitionAnimation (now, pre, pageAnimationCallback, allAnimationCallback) {
    const panelAnimation = new Promise((resolve, reject) => {
      const originX = this.panel.x
      new Hilo.Tween(this.panel, {
        x: originX
      }, {
        x: -(this.getMinScroll(this.state) - 750)
      }, {
        loop: false,
        onComplete: () => {
          isFunction(pageAnimationCallback) && pageAnimationCallback()
          resolve()
        }
      }).start()
    })
    Promise.all([
      this.trash.nextColor(this.getStateRealColor(pre)),
      panelAnimation,
      this.cover.playWordSquireAnimate(),
      this.cover.playColorSquirmAnimate(this.getStateColor(pre), this.getStateColor(now), this.getPreType(this.state), true)
    ]).then(() => {
      isFunction(allAnimationCallback) && allAnimationCallback()
    })
  }
  // 播放初始动画
  playStartAnimate () {
    return new Promise((resolve, reject) => {
      this.tip.hide()
      this.bubble.bottomBubble.stop()
      this.bubble.bottomBubble.removeFromParent()
      this.adorn.hideBottomView()
      Promise.all([
        this.cover.playStartAnimate(),
        this.playFruitStartAnimate()
      ]).then(() => {
        this.trash.view.addTo(this.view)
        this.progress.view.addTo(this.view)
        this.flag.isStart = true
        resolve()
      })
    })
  }
  playFruitStartAnimate () {
    return new Promise((resolve, reject) => {
      new Hilo.Tween(this.panel, {
        x: 150
      }, {
        x: 0
      }, {
        loop: false,
        onComplete: () => {
          resolve()
        }
      }).start()
    })
  }
  changeNowSelectType (type) {
    this.state = type
  }
}
