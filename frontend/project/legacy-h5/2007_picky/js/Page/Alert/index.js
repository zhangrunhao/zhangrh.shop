import Hilo from 'hilo'
import {
  centerX,
  bottom
} from '../../Class/Util'
import { winWidth, getWinHeight } from '../../Class/Global'
import asset from './asset'
import Finger from '../../Class/Finger'
import Page from '../../Class/Page'
export default class Alert extends Page {
  constructor () {
    super()
    this.asset = asset
  }
  hide () {
    this.view.removeFromParent()
  }
  ready () {
    this.view = this.initView()
  }
  show (stage) {
    this.view.addTo(stage)
  }
  initView () {
    const c = new Hilo.Container({
      width: winWidth,
      height: getWinHeight()
    })
    let board = new Hilo.Container({
      width: innerWidth * 2,
      height: innerHeight * 2,
      background: '#000',
      alpha: 0.6
    }).addTo(c)

    new Finger(board, {
      onTap: () => {
        this.hide()
      }
    })

    const alertContainer = new Hilo.Container({
      // background: 'pink',
      x: centerX(539),
      y: bottom(250, 242),
      width: 539,
      height: 242
    }).addTo(c)

    new Hilo.Bitmap({
      image: asset.getContent('question.png')
    }).addTo(alertContainer)

    let cancel = new Hilo.Bitmap({
      x: 90,
      y: 242 - 89 - 10 - 54,
      image: asset.getContent('cancel.png')
    }).addTo(alertContainer)

    new Finger(cancel, {
      onTap: () => {
        this.hide()
      }
    })

    let done = new Hilo.Bitmap({
      width: 161,
      height: 89,
      x: 539 - 161 - 90,
      y: 242 - 89 - 10 - 54,
      image: asset.getContent('done.png')
    }).addTo(alertContainer)

    new Finger(done, {
      onTap: () => {
        this.fire('done')
      }
    })

    return c
  }
}
