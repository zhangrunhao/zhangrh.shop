/**
 * 动画过渡页
 */
import Hilo from 'hilo'
import Page from '../../Class/Page'
import asset from './asset'
import {
  right,
  bottom,
  centerX,
  centerY
} from '../../Class/Util'
import { winWidth, getWinHeight } from '../../Class/Global'

export default class Trans extends Page {
  constructor (props) {
    super(props)
    this.asset = asset
  }
  ready () {
    this.view = this.createView()
  }
  createView () {
    const content = new Hilo.Container({
      id: 'TransContainerView',
      background: '#b093f9',
      width: winWidth,
      height: getWinHeight()
    })
    new Hilo.Bitmap({
      image: asset.getContent('title.png')
    }).addTo(content)

    new Hilo.Bitmap({
      x: right(40, 208),
      y: 30,
      image: asset.getContent('logo.png')
    }).addTo(content)

    new Hilo.Bitmap({
      x: right(0, 195),
      y: bottom(0, 395),
      image: asset.getContent('cloud-1.png')
    }).addTo(content)

    new Hilo.Bitmap({
      x: 0,
      y: bottom(0, 168),
      image: asset.getContent('cloud-3.png')
    }).addTo(content)

    new Hilo.Bitmap({
      x: 0,
      y: 200,
      image: asset.getContent('cloud-4.png')
    }).addTo(content)

    new Hilo.Bitmap({
      x: 0,
      y: centerY(0, 208),
      image: asset.getContent('cloud-5.png')
    }).addTo(content)

    new Hilo.Bitmap({
      x: 0,
      y: centerY(0, 124),
      image: asset.getContent('cloud-6.png')
    }).addTo(content)

    const secondFrames = []
    for (let i = 0; i <= 40; i++) {
      if (i < 10) {
        secondFrames.push({
          image: asset.getContent(`sprite/0${i}.png`),
          rect: [0, 0, 564, 1033]
        })
      } else {
        secondFrames.push({
          image: asset.getContent(`sprite/${i}.png`),
          rect: [0, 0, 564, 1033]
        })
      }
    }
    // 此序列帧, 可抽一半, 也不卡
    this.secondSprite = new Hilo.Sprite({
      x: centerX(564),
      y: centerY(1033),
      width: 564,
      height: 1033,
      frames: secondFrames,
      timeBased: true,
      loop: true,
      interval: 150
    }).on(Hilo.event.POINTER_START, () => {
      this.fire('go')
    }).addTo(content).stop()
    return content
  }
  hide () {
    const that = this
    return new Promise((resolve, reject) => {
      new Hilo.Tween(that.view, {
        alpha: 1
      }, {
        alpha: 0
      }, {
        loop: false,
        onComplete: () => {
          this.view.removeFromParent()
          resolve()
        }
      }).start()
    })
  }
  show (parent) { // 图片都加载完成之后, 才开始进行渲染
    this.view.addTo(parent)
    this.secondSprite.play()
  }
}
