import Hilo from 'hilo'
import { isFunction } from 'lodash'

export default class Ball {
  constructor (asset, parent) {
    this.asset = asset
    this.parent = parent
  }
  initView () {
    const c = new Hilo.Container({
      width: 36,
      height: 36
    })
    new Hilo.Bitmap({
      image: this.asset.getContent('ball.png')
    }).addTo(c)
    return c
  }
  playAnimation (ox, oy, tx, ty, duration) {
    const view = this.initView()

    view.x = ox
    view.y = oy
    view.addTo(this.parent)

    view.alpha = 0
    return new Promise((resolve, reject) => {
      new Hilo.Tween(view, {
        alpha: 0
      }, {
        alpha: 1
      }, {
        loop: false,
        duration: 200
      }).start()

      playParabolaFunc(view, ox, oy, tx, ty, duration, () => {
        view.removeFromParent()
        resolve()
      })
    })
  }
}

function playParabolaFunc (view, ox, oy, tx, ty, duration, cb) {
  const time = (tx - ox) / (duration / 60) // 每次变化的宽度
  let constNum = funcConstNum(ox, oy, tx, ty)
  const animation = function () {
    let nowX = ox += time
    let nowY = getYFromX(nowX, constNum)
    view.x = nowX
    view.y = nowY
    if (nowX < tx) {
      requestAnimationFrame(animation)
    } else {
      isFunction(cb) && cb()
    }
  }
  animation()
}
function funcConstNum (ox, oy, tx, ty) {
  let a = 0.005
  let b = ((oy - ty) - a * (ox * ox - tx * tx)) / (ox - tx)
  let c = oy - a * ox * ox - b * ox
  return {
    a,
    b,
    c
  }
}
function getYFromX (x, num) {
  return num.a * x * x + num.b * x + num.c
}
