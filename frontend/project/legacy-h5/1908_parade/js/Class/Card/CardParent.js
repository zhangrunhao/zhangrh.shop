import Hilo from 'hilo'
import Global from '../Global'
import commonAsset from './commonAsset'
import initCardView from './initCardView'
import initTransferView from './initTransferView'
import handleTransferAnimation from './handleTransferAnimation'
import OtherDom from './OtherDom'

const cardView = Symbol('cardView')
const scrollViewTween = Symbol('scrollViewTween')
const transferView = Symbol('transferView')
const asset = Symbol('asset')
const name = Symbol('name')
const transferType = Symbol('transferType')
const otherDom = Symbol('otherDom')

const showTransfer = Symbol('showTransfer')
const hideTransfer = Symbol('hideTransfer')
const nextAnimation = Symbol('nextAnimation')
const perAnimation = Symbol('perAnimation')
// 公共资源加载

class Card {
  constructor (p) {
    this[name] = p.name
    this[asset] = p.asset
    this[transferType] = p.transferType
    this[cardView] = null
    this[transferView] = null
    this[scrollViewTween] = null
    this.headPosition = p.headPostiton
    this.transferPosition = {
      startY: 0
    }
  }
  async ready (gap) {
    const cardObject = initCardView(commonAsset, this[asset], {
      headPosition: this.headPosition
    })
    this[scrollViewTween] = cardObject.scrollViewTween
    this[cardView] = cardObject.view

    const transferViewObject = initTransferView(this[asset], this[transferType], gap)
    this.transferPosition.startY = transferViewObject.startY
    this.transferPosition.endY = transferViewObject.endY
    this[transferView] = transferViewObject.view

    this[otherDom] = new OtherDom(this[asset], this[name], {
      cardObject,
      headPosition: this.headPosition
    })
    // 子类处理视图
    if (this.childHandleView instanceof Function) {
      await this.childHandleView(this[cardView], this[transferView], cardObject.scrollView)
    }
    console.info(this[name], 'ready')
  }
  async runNextTransfer (parent, gap) { // 将自己的card隐藏 -> 执行自己的转场
    await Promise.all([
      this.hideCard(this[cardView].y, -Global.height - gap.y),
      this[showTransfer](Global.height + gap.y - Global.needScrollDistance, this.transferPosition.startY, parent)
    ])
    await this[nextAnimation](gap)
  }
  async runPerTransfer (parent, gap) { // 将自己的card隐藏
    await this.hideCard(this[cardView].y, Global.height + gap.y)
  }
  async show (parent, gap, duration) { // 展示自己的card
    if (duration === 'top') { // 直接展示
      await this.showCard(Global.height + gap.y, 0, parent)
    } else if (duration === 'bottom') { // 先执行一遍倒序转场, 再展示
      if (this[name] === 'c8') {
        await this.showCard(-Global.height - gap.y, 0, parent)
      } else {
        await this[showTransfer](-Global.transferHeight - gap.y, this.transferPosition.endY, parent)
        await this[perAnimation](gap)
        await Promise.all([
          this[hideTransfer](this[transferView].y, Global.height + gap.y),
          this.showCard(-Global.height - gap.y, 0, parent)
        ])
      }
    }
  }
  async hideTransferOfApp (gap) {
    await this[hideTransfer](this.transferPosition.endY, -(Global.transferHeight + gap.y))
  }
  showCard (startY, endY, parent, dontAdd) {
    this[cardView].y = startY
    if (!dontAdd) this[cardView].addTo(parent)
    return new Promise((resolve, reject) => {
      new Hilo.Tween(this[cardView], {
        y: startY
      }, {
        y: endY
      }, {
        onComplete: () => {
          this[scrollViewTween].start()
          this[otherDom].showGif()
          resolve()
        }
      }).start()
    })
  }
  hideCard (startY, endY, dontRemove) {
    this[otherDom].heideOhterDom()
    return new Promise((resolve, reject) => {
      new Hilo.Tween(this[cardView], {
        y: startY
      }, {
        y: endY
      }, {
        onComplete: () => {
          if (!dontRemove) this[cardView].removeFromParent()
          resolve()
        }
      }).start()
    })
  }
  [showTransfer] (start, end, parent) {
    this[transferView].y = start
    this[transferView].addTo(parent)
    return new Promise((resolve, reject) => {
      new Hilo.Tween(this[transferView], {
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
  [hideTransfer] (start, end) {
    return new Promise((resolve, reject) => {
      new Hilo.Tween(this[transferView], {
        y: start
      }, {
        y: end
      }, {
        onComplete: () => {
          this[transferView].removeFromParent()
          resolve()
        }
      }).start()
    })
  }
  async [nextAnimation] (gap) {
    await handleTransferAnimation(this[transferView], this[transferType], 'top', gap)
  }
  async [perAnimation] (gap) {
    await handleTransferAnimation(this[transferView], this[transferType], 'bottom', gap)
  }
  getSingleAsset () {
    return this[asset]
  }
  moveView (p) {
    // 调整dom元素的位置
    if (typeof p.x === 'number') this[cardView].x = p.x
    if (typeof p.y === 'number') {
      this[cardView].y = p.y
      this[otherDom].scroll(p.y)
    }
  }
  changeAudioPlayingState (flag) {
    const imgName = (flag === 'play' ? 'audio_open.png' : 'audio_close.png')
    this.audioView.setImage(commonAsset.getContent(imgName))
  }
}
Card.getCommonAsset = function () {
  return commonAsset
}

Hilo.Class.mix(Card.prototype, Hilo.EventMixin)
export default Card
