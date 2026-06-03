import Hilo from 'hilo'
import Bezier from './bezier'
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
  playAnimation (p1, p2, c1, c2, duration) {
    const view = this.initView()

    view.x = p1[0]
    view.y = p1[1]
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

      playParabolaFunc(view, p1, p2, c1, c2, duration, () => {
        view.removeFromParent()
        resolve()
      })
    })
  }
}

function playParabolaFunc (view, p1, p2, c1, c2, duration, cb) {
  const bezier = new Bezier()
  let t = 0

  function animation () {
    let res = bezier.threeBezier(t += 0.02, p1, c1, c2, p2)
    view.x = res[0]
    view.y = res[1]
    if (res[0] < p2[0] && res[1] > p2[1]) {
      isFunction(cb) && cb()
    } else {
      requestAnimationFrame(animation)
    }
  }
  animation()
}
