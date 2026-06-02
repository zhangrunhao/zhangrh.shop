// 选择区的偏旁类
import Hilo from 'hilo'
import Global from '../../Class/Global'
import {
  randomNumBoth
} from '../../Util/util'

export default class ChooseRadical {
  constructor (btn, x, y, info) {
    this.info = info
    this.targetY = y
    Object.assign(this, btn) // index: 索引, 用来确定图片. id, 用来确定按钮
    this.status = 'outGame' // 当前状态, 未被选择
    this.content = new Hilo.Container({
      width: 106,
      height: 102,
      x: x,
      y: Global.height
    })
    this.pillar = new Hilo.Bitmap({
      image: Global.asset.getAsset('game/radical_pillar/pillar.png')
    }).addTo(this.content)
    this.text = new Hilo.Bitmap({
      alpha: 0,
      image: Global.asset.getAsset(`game/radical_pillar/outgame/${this.index}.png`),
      y: 8
    }).addTo(this.content)
    this.text.x = this.pillar.width / 2 - this.text.width / 2

    this.drop = new Hilo.Bitmap({
      image: Global.asset.getAsset(`game/radical_drop/${this.index}.png`),
      y: -1400
    }).addTo(this.content)
    this.drop.x = this.pillar.width / 2 - this.drop.width / 2
  }
  /**
   * 变为选中状态
   */
  toActive () {
    this.content.y = this.content.y + 25
    this.text.setImage(Global.asset.getAsset(`game/radical_pillar/ingame/${this.index}.png`))
  }
  /**
   * 取消选择, 恢复高度
   */
  recoverHeight () {
    this.content.y = this.content.y - 25
    this.text.setImage(Global.asset.getAsset(`game/radical_pillar/outgame/${this.index}.png`))
  }
  showBeginAnimate (cb) {
    const that = this
    if (this.info === 'new') {
      let duration = randomNumBoth(500, 3000)
      Hilo.Tween.to(this.content, {
        y: this.targetY
      }, {
        duration,
        onComplete () {
          that.text.alpha = 1
          that.drop.alpha = 0
          if (cb instanceof Function) cb()
        }
      })
      Hilo.Tween.to(this.drop, {
        y: 0
      }, {
        duration
      })
    } else if (this.info === 'continue') {
      that.text.alpha = 1
      this.content.y = this.targetY
      that.drop.alpha = 0
      that.drop.y = 0
      if (cb instanceof Function) cb()
    }
  }
}
