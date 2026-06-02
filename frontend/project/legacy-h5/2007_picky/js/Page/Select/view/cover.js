import Hilo from 'hilo'
import { isNumber } from 'lodash'
import {
  isSohu
} from '../../../../../legacy/utils/legacy-utils.js'
export default class CoverView {
  constructor (asset) {
    this.asset = asset
    this.view = this.initView(asset)
  }
  initView (asset) {
    const content = new Hilo.Container({
      width: 400,
      height: 900,
      x: 140,
      y: -200,
      rotation: 32
    })

    const fakeContainer = this.fakeContainer = new Hilo.Container({
      width: 400,
      height: 900,
      y: -120,
      scaleX: 10 / 7,
      scaleY: 10 / 7
    }).addTo(content)

    this.bg = new Hilo.Bitmap({
      x: -28,
      y: -5,
      width: 400,
      height: 900,
      image: asset.getContent('cover/bg.png')
    }).addTo(fakeContainer)

    this.dialog = new Hilo.Bitmap({
      width: 266,
      height: 111,
      x: 40,
      y: 320,
      rotation: -32,
      image: isSohu() ? asset.getContent('cover/dialog-before_sohu.png') : asset.getContent('cover/dialog-before.png')
    }).addTo(fakeContainer)

    this.switchSprite('fruit', fakeContainer, 2)

    this.lineColor = new Hilo.Bitmap({
      image: this.asset.getContent(`cover/squirm/purple.png`)
    }).addTo(this.fakeContainer)

    this.pickyWordSprite = new Hilo.Sprite({
      id: 'pickyWordSprite',
      interval: 10,
      timeBased: false,
      frames: [...new Array(14)].map((v, i) => {
        return {
          image: this.asset.getContent(`cover/picky/${++i}.png`),
          rect: [0, 0, 400, 900]
        }
      })
    }).addTo(this.fakeContainer)

    return content
  }

  playStartAnimate () {
    const s1 = new Promise((resolve, reject) => {
      // 提示框变化
      new Hilo.Tween(this.dialog, {
        alpha: 1
      }, {
        alpha: 0
      }, {
        loop: false,
        onComplete: () => {
          this.dialog.x = 30
          this.dialog.y = 250
          this.dialog.setImage(this.asset.getContent('cover/dialog-after.png'))
          new Hilo.Tween(this.dialog, {
            alpha: 0
          }, {
            alpha: 1
          }, {
            loop: false
          }).start()
        }
      }).start()

      // 缩小
      new Hilo.Tween(this.fakeContainer, {
        y: -120,
        scaleX: 10 / 7,
        scaleY: 10 / 7
      }, {
        y: 0,
        scaleX: 1,
        scaleY: 1
      }, {
        loop: false,
        onComplete: () => {
          resolve()
        }
      }).start()
    })

    const s2 = this.playColorSquirmAnimate('purple', 'orange', 'fruit', false)

    return Promise.all([s1, s2])
  }

  playColorSquirmAnimate (startColor, endColor, nextType, isBack) {
    const self = this
    return new Promise((resolve, reject) => {
      new Hilo.Tween(self.lineColor, {
        alpha: 1
      }, {
        alpha: 0
      }, {
        loop: false,
        duration: 200,
        onComplete: () => {
          self.switchSprite(nextType, self.fakeContainer)
          self.lineColor.setImage(self.asset.getContent(`cover/squirm/${isBack ? startColor : endColor}.png`))
          new Hilo.Tween(self.lineColor, {
            alpha: 0
          }, {
            alpha: 1
          }, {
            loop: false,
            duration: 200,
            onComplete: () => {
              resolve()
            }
          }).start()
        }
      }).start()
    })
  }

  switchSprite (type, parent, depth) {
    if (this.sprite) this.sprite.removeFromParent()
    let num = 0
    switch (type) {
      case 'fruit' : num = 22
        break
      case 'other' : num = 23
        break
      case 'meat' : num = 25
        break
      case 'vegetable' : num = 25
        break
    }
    this.sprite = new Hilo.Sprite({
      interval: 6,
      timeBased: false,
      frames: [...new Array(num)].map((v, i) => {
        return {
          image: this.asset.getContent(`cover/sprite/${type}/${type === 'other' ? i : ++i}.png`),
          rect: [0, 0, 400, 900]
        }
      })
    }).addTo(parent, isNumber(depth) ? depth : 1)
  }

  playWordSquireAnimate () {
    return new Promise((resolve, reject) => {
      new Hilo.Tween(this.pickyWordSprite, {
        alpha: 1
      }, {
        alpha: 0
      }, {
        loop: false,
        duration: 200,
        onComplete: () => {
          new Hilo.Tween(this.pickyWordSprite, {
            alpha: 0
          }, {
            alpha: 1
          }, {
            loop: false,
            duration: 200,
            onComplete: () => {
              resolve()
            }
          }).start()
        }
      }).start()
    })
  }
}
