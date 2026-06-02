import Hilo from 'hilo'
import asset from './asset'
import Global from '../../Class/Global'

class EndPart { // TODO: 同样需要继承cardparent父类, 合并公共代码
  constructor () {
    this.name = 'endPart'
    this.asset = asset
    this.view = null
  }
  async ready (gap) {
    this.view = this.initCardView(gap)
    console.info('endpart ready')
  }
  initCardView (gap) {
    const view = new Hilo.Container({
      width: Global.width,
      height: Global.height
    })
    new Hilo.Bitmap({
      align: Hilo.align.CENTER,
      image: this.asset.getContent('end_re.png')
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
    } else if (duration === 'bottom') {
      await this.showCard(Global.needScrollDistance, Global.height + gap.y, parent)
    }
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
  async runNextTransfer (parent, gap, durantion) {
  }
  async runPerTransfer (parent, gap) {
  }
  async hideTransferOfApp (gap) {
  }
  async perAnimation (gap) {
  }
  showTransfer (start, end, parent) {
  }
  hideTransfer (start, end) {
  }
  getSingleAsset () {
    return this.asset
  }
  moveView (p) {
    this.view.y = p.y
  }
}

Hilo.Class.mix(EndPart.prototype, Hilo.EventMixin)
export default EndPart
