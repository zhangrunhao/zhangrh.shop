import Hilo from 'hilo'

import {
  bottom
} from '../../../Class/Util'

export default class ProgressLine {
  constructor (asset) {
    this.asset = asset
    this.view = this.initView()
    // this.drawPositionFlag('red', 9, this.view)
  }
  initView () {
    const c = new Hilo.Container({
      x: 40,
      y: bottom(40, 40),
      width: 440,
      height: 40
    })
    new Hilo.Bitmap({
      image: this.asset.getContent(`adorn/progress-fruit.png`)
    }).addTo(c)
    new Hilo.Bitmap({
      x: 83,
      image: this.asset.getContent(`adorn/progress-vegetable.png`)
    }).addTo(c)
    new Hilo.Bitmap({
      x: 83 + 165,
      image: this.asset.getContent(`adorn/progress-meat.png`)
    }).addTo(c)
    new Hilo.Bitmap({
      x: 83 + 139 + 165,
      image: this.asset.getContent(`adorn/progress-other.png`)
    }).addTo(c)
    return c
  }
  drawPositionFlag (type, color, index, parent) {
    if (index < 0) index = 0
    if (this.color === color && this.index === index) return
    this.color = color
    this.index = index
    if (this.positionFlag) this.positionFlag.removeFromParent()
    switch (type) {
      case 'fruit': index += 0
        break
      case 'vegetable': index += 2
        break
      case 'meat': index += 6
        break
      case 'other': index += 10
    }
    const g = this.positionFlag = new Hilo.Graphics({
      width: 20,
      height: 20,
      x: 10 + (20 + 20) * index,
      y: -26
    })
    g.beginFill(color)
      .drawCircle(0, 0, 10)
      .endFill()
      .addTo(this.view)
  }
}
