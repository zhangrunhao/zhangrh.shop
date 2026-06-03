import Hilo from 'hilo'
import Page from '../../../Class/Page'
import asset from '../asset'
import Finger from '../../../Class/Finger'
import {
  px
} from '../../../Class/Util'
export default class OptionView extends Page {
  constructor (obj) {
    super()
    Object.assign(this, obj)
    this.state = 'noSelect'
    this.view = this.initView()
    this.noSelectView = this.createNoSelectLabel()
    this.isSelectView = this.createIsSelectedLabel()
    this.flySprite = this.createFlySprite()
    this.noSelectView.addTo(this.view)
  }
  initView () {
    const c = new Hilo.Container({
      id: `${this.type}-${this.id}`,
      width: this.width,
      height: this.height,
      x: this.x,
      y: this.y
    })
    new Hilo.Bitmap({
      width: this.width,
      height: this.height,
      image: this.image
    }).addTo(c)

    new Finger(c, {
      onTap: (e) => {
        if (this.flag.isStart) this.switchState(e)
      }
    })
    return c
  }
  switchState (mouseEvent) {
    if (this.state === 'noSelect') {
      this.noSelectView.removeFromParent()
      this.isSelectView.addTo(this.view)
      this.flySprite.addTo(this.view)
      this.flySpriteTween.start()
      this.state = 'isSelect'
      this.fire('toSelect', mouseEvent)
    } else if (this.state === 'isSelect') {
      this.isSelectView.removeFromParent()
      this.flySprite.removeFromParent()
      this.flySpriteTween.stop()
      this.noSelectView.addTo(this.view)
      this.state = 'noSelect'
      this.fire('cancelSelected')
    }
  }
  createIsSelectedLabel () {
    const c = new Hilo.Container({
      width: 120,
      height: 33,
      x: 120,
      y: 90
    })
    new Hilo.Bitmap({
      image: asset.getContent('option/is-select-large.png'),
      width: 120,
      height: 33
    }).addTo(c)
    new Hilo.Text({
      width: 120,
      height: 33,
      textAlign: 'center',
      textVAlign: 'middle',
      color: 'white',
      font: `${px(22)}px arial`,
      text: this.name
    }).addTo(c)
    return c
  }
  createNoSelectLabel () {
    const c = new Hilo.Container({
      width: 120,
      height: 33,
      x: 120,
      y: 90
    })
    new Hilo.Bitmap({
      image: asset.getContent('option/no-select-large.png'),
      width: 120,
      height: 33
    }).addTo(c)
    new Hilo.Text({
      width: 120,
      height: 33,
      textAlign: 'center',
      textVAlign: 'middle',
      font: `${px(22)}px arial`,
      text: this.name
    }).addTo(c)
    return c
  }
  createFlySprite () {
    const c = new Hilo.Container({
      // background: 'pink',
      x: 10 + (this.width - 20) / 2,
      y: 10 + (this.height - 20) / 2,
      pivotX: (this.width - 20) / 2,
      pivotY: (this.height - 20) / 2,
      width: this.width - 20,
      height: this.height - 20
    })

    new Hilo.Bitmap({
      width: 31,
      height: 33,
      image: asset.getContent('option/fly.png')
    }).addTo(c)

    this.flySpriteTween = new Hilo.Tween(c, {
      rotation: 0
    }, {
      rotation: 360
    }, {
      // delay: getRandomNumBotFloat(0, 2000),
      loop: true,
      duration: 2000
    }).stop()
    return c
  }
}
