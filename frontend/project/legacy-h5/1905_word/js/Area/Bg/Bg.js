import Hilo from 'hilo'
import Global from '../../Class/Global'
import Star from '../Bg/Star'

export default class Bg {
  constructor () {
    this.content = new Hilo.Container({
      width: Global.width,
      height: Global.height
    })
    new Hilo.Bitmap({
      image: Global.asset.getAsset(`game/bg/0.jpg`)
    }).addTo(this.content)

    new Star().render(this.content)

    this.ele1 = new Hilo.Bitmap({
      image: Global.asset.getAsset(`game/bg/ele01.png`),
      alpha: 0.15,
      x: Global.width - 150,
      y: 500
    }).addTo(this.content)

    this.ele2 = new Hilo.Bitmap({
      alpha: 0.15,
      image: Global.asset.getAsset(`game/bg/ele02.png`)
    }).addTo(this.content)
  }
  render (parent) {
    this.content.addTo(parent)
    return this.content
  }
}
