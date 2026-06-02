import Hilo from 'hilo'
import Global from '../../Class/Global'

export default class Star {
  constructor () {
    this.content = new Hilo.Container({
      width: Global.width,
      height: Global.height
    })

    this.star1 = new Hilo.Bitmap({
      image: Global.asset.getAsset('game/bg/star/16.png')
    }).addTo(this.content)

    Hilo.Tween.to(this.star1, {
      x: 50,
      y: 80,
      alpha: 0.3
    }, {
      duration: 3500,
      loop: true,
      reverse: true
    })

    this.star2 = new Hilo.Bitmap({
      image: Global.asset.getAsset('game/bg/star/11.png'),
      alpha: 0.2
    }).addTo(this.content)

    Hilo.Tween.to(this.star2, {
      x: -30,
      y: -40,
      alpha: 0.8
    }, {
      duration: 3500,
      loop: true,
      reverse: true
    })
  }

  render (parent) {
    this.content.addTo(parent)
    return this.content
  }
}
