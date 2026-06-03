import Hilo from 'hilo'
import asset from './asset'
import Global from '../../Class/Global'

import initTransferView from '../../Class/Card/initTransferView'
import handleTransferAnimation from '../../Class/Card/handleTransferAnimation'
class C4 { // TODO: 需要继承cardparent父类 合并重复代码
  constructor () {
    this.name = 'c4'
    this.asset = asset
    this.type = 'left'
    this.view = null
    this.transferPosition = {}
  }
  async ready (gap) {
    this.view = this.initCardView(gap)

    const transferViewObject = initTransferView(this.asset, this.type, gap)
    this.transferPosition.startY = transferViewObject.startY
    this.transferPosition.endY = transferViewObject.endY
    this.transferView = transferViewObject.view

    console.info('c4 ready')
  }
  initCardView (gap) {
    const view = new Hilo.Container({
      width: 750,
      height: 1206
    })
    new Hilo.Bitmap({
      x: 45,
      y: 365,
      image: this.asset.getContent('main.png')
    }).addTo(view)
    return view
  }
  showCard (startY, endY, parent) {
    this.view.y = startY
    this.view.addTo(parent)
    return new Promise((resolve, reject) => {
      new Hilo.Tween(this.view, {
        y: startY
      }, {
        y: endY
      }, {
        onComplete: () => {
          resolve()
        }
      }).start()
    })
  }
  async show (parent, gap, duration) { // 展示自己的card
    if (duration === 'top') { // 直接展示
      await this.showCard(Global.height + gap.y, 0, parent)
      await this.pauseTime()
    } else if (duration === 'bottom') { // 先执行一遍倒序转场, 再展示
      await this.showTransfer(-Global.transferHeight - gap.y, this.transferPosition.endY, parent)
      await this.perAnimation(gap)
      await Promise.all([
        this.hideTransfer(this.transferView.y, Global.height + gap.y),
        this.showCard(-Global.height - gap.y, 0, parent)
      ])
      await this.pauseTime()
    }
  }
  pauseTime () {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve()
      }, 1300)
    })
  }
  async runNextTransfer (parent, gap, durantion) {
    await Promise.all([
      this.hideCard(this.view.y, -Global.height - gap.y),
      this.showTransfer(Global.height + gap.y - Global.needScrollDistance, this.transferPosition.startY, parent)
    ])
    await handleTransferAnimation(this.transferView, this.type, durantion, gap)
  }
  async runPerTransfer (parent, gap) {
    await this.hideCard(this.view.y, Global.height + gap.y)
  }
  async hideTransferOfApp (gap) {
    await this.hideTransfer(this.transferPosition.endY, -(Global.transferHeight + gap.y))
  }
  async perAnimation (gap) {
    await handleTransferAnimation(this.transferView, this.type, 'bottom', gap)
  }
  showTransfer (start, end, parent) {
    this.transferView.y = start
    this.transferView.addTo(parent)
    return new Promise((resolve, reject) => {
      new Hilo.Tween(this.transferView, {
        y: start
      }, {
        y: end
      }, {
        onComplete: () => {
          resolve()
        }
      }).start()
    })
  }
  hideTransfer (start, end) {
    return new Promise((resolve, reject) => {
      new Hilo.Tween(this.transferView, {
        y: start
      }, {
        y: end
      }, {
        onComplete: () => {
          this.transferView.removeFromParent()
          resolve()
        }
      }).start()
    })
  }
  hideCard (startY, endY) {
    return new Promise((resolve, reject) => {
      new Hilo.Tween(this.view, {
        y: startY
      }, {
        y: endY
      }, {
        onComplete: () => {
          this.view.removeFromParent()
          resolve()
        }
      }).start()
    })
  }
  getSingleAsset () {
    return this.asset
  }
  moveView () {
  }
}

Hilo.Class.mix(C4.prototype, Hilo.EventMixin)
export default C4
