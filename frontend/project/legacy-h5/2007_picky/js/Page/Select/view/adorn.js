import Hilo from 'hilo'
import {
  winWidth, getWinHeight
} from '../../../Class/Global'
import Page from '../../../Class/Page'

export default class AdornView extends Page {
  constructor (asset) {
    super()
    this.view = this.initView(asset)
  }
  // 整体
  initView (asset) {
    const content = new Hilo.Container({})
    new Hilo.Bitmap({
      x: winWidth - 394 / 2,
      y: 195 / 2,
      width: 394,
      height: 195,
      pivotX: 394 / 2,
      pivotY: 195 / 2,
      rotation: 180,
      image: asset.getContent('adorn/adorn-bottom.png')
    }).addTo(content)

    this.bottomAdorn = new Hilo.Bitmap({
      x: 0,
      y: getWinHeight() - 195,
      width: (394),
      height: (195),
      image: asset.getContent('adorn/adorn-bottom.png')
    }).addTo(content)

    return content
  }
  hideBottomView () {
    this.bottomAdorn.removeFromParent()
  }
}
