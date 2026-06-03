import Hilo from 'hilo'
import {
  bottom,
  right
} from '../../../Class/Util'
import {
  isSohu
} from '../../../../../legacy/utils/legacy-utils.js'
export default class Tip {
  constructor (asset) {
    this.asset = asset
    this.view = this.initView()
    if (this.timer) clearInterval(this.timer)
    this.timer = setInterval(() => {
      this.createTip()
    }, 600)
  }
  hide () {
    if (this.timer) clearInterval(this.timer)
    this.view.removeFromParent()
  }
  initView () {
    if (isSohu()) {
      return new Hilo.Container({
        width: 400,
        height: 145,
        rotation: 90,
        x: right(50, 145),
        y: bottom(50, 500)
      })
    } else {
      return new Hilo.Container({
        width: 400,
        height: 145,
        x: right(50, 400),
        y: bottom(50, 145)
      })
    }
  }
  createTip () {
    let t = new Hilo.Bitmap({
      x: 300,
      alpha: 0,
      image: this.asset.getContent('cover/tip.png')
    }).addTo(this.view)
    let tw = new Hilo.Tween(t, {
      x: 300,
      alpha: 0
    }, {
      x: 150,
      alpha: 1
    }, {
      loop: false,
      duration: 1000,
      onComplete: () => {
        new Hilo.Tween(t, {
          x: 150,
          alpha: 1
        }, {
          x: 0,
          alpha: 0
        }, {
          loop: false,
          duration: 1000,
          onComplete: () => {
            // 播放接触后处理
            t.removeFromParent()
            t = null
            Hilo.Tween.remove(tw)
            tw = null
          }
        }).start()
      }
    }).start()
  }
}
