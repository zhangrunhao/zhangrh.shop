import Hilo from 'hilo'
import Page from '../../../Class/Page'
import {
  bottom,
  right,
  px
} from '../../../Class/Util'

export default class Trash extends Page {
  constructor (assets) {
    super()
    this.assets = assets
    this.view = this.initView()
    this.drawNum(0)
  }
  initView () {
    const c = new Hilo.Container({})
    this.triangular = this.initTriangular('#ffa101', true).addTo(c)
    this.trash = this.initTrash().addTo(c)
    return c
  }
  initTriangular (color, isInit) {
    return new Hilo.Graphics({
      x: right(0, 230),
      y: bottom(0, 360),
      alpha: isInit ? 1 : 0
    }).beginFill(color)
      .moveTo(230, 0)
      .lineTo(230, 360)
      .lineTo(0, 360)
      .endFill()
  }
  nextColor (color) {
    const nextTriangular = this.initTriangular(color).addTo(this.view, 0)
    const s1 = new Promise((resolve, reject) => {
      new Hilo.Tween(this.triangular, {
        alpha: 1
      }, {
        alpha: 0
      }, {
        loop: false,
        onComplete: () => {
          resolve()
        }
      }).start()
    })
    const s2 = new Promise((resolve, reject) => {
      new Hilo.Tween(nextTriangular, {
        alpha: 0
      }, {
        alpha: 1
      }, {
        loop: false,
        onComplete: () => {
          this.triangular.removeFromParent()
          this.triangular = nextTriangular
          resolve()
        }
      }).start()
    })
    return Promise.all([s1, s2])
  }
  // 垃圾桶
  initTrash () {
    const c = new Hilo.Container({
      // background: '#fff',
      x: right(0, 120),
      y: bottom(0, 140),
      width: 120,
      height: 140
    }).on(Hilo.event.POINTER_START, () => {
      this.fire('complete')
    })
    this.trashCover = new Hilo.Bitmap({
      x: 30 + 75,
      y: -30 + 50,
      rotation: -32,
      image: this.assets.getContent('adorn/trash-cover.png'),
      width: 80,
      height: 55,
      pivotX: 80,
      pivotY: 50
    }).addTo(c)
    this.trashMain = new Hilo.Bitmap({
      x: (120 - 86) / 2,
      y: (140 - 86) / 2,
      image: this.assets.getContent('adorn/trash-selected.png'),
      width: 86,
      height: 86
    }).addTo(c)
    this.trashMain.state = 'selected'
    return c
  }
  drawNum (num) {
    if (num === 0 && this.trashMain.state !== 'selected') {
      this.trashMain.setImage(this.assets.getContent('adorn/trash-selected.png'))
      this.trashMain.state = 'selected'
    } else if (num > 0 && this.trashMain.state !== 'completed') {
      this.trashMain.setImage(this.assets.getContent('adorn/trash-completed.png'))
      this.trashMain.state = 'completed'
    }
    if (this.numView) this.numView.removeFromParent()
    this.numView = new Hilo.Text({
      x: (120 - 86) / 2,
      y: 45,
      width: 86,
      height: 86,
      color: '#fff',
      textAlign: 'center',
      textVAlign: 'middle',
      font: `${px(28)}px arial`,
      text: String(num)
    }).addTo(this.trash)
  }
  playCoverOpenShack () {
    if (this.playCoverShackAnimating) return
    this.playCoverShackAnimating = true
    return new Promise((resolve, reject) => {
      new Hilo.Tween(this.trashCover, {
        rotation: -32
      }, {
        rotation: 0
      }, {
        loop: false,
        duration: 100,
        onComplete: () => {
          this.playCoverShackAnimating = false
          resolve()
        }
      }).start()
    })
  }
  playCoverCloseShack () {
    if (this.playCoverShackAnimating) return
    this.playCoverShackAnimating = true
    return new Promise((resolve, reject) => {
      new Hilo.Tween(this.trashCover, {
        rotation: 0
      }, {
        rotation: -32
      }, {
        loop: false,
        duration: 100,
        onComplete: () => {
          this.playCoverShackAnimating = false
          resolve()
        }
      }).start()
    })
  }
}
