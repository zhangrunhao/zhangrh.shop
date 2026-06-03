import Global from '../../Class/Global'
import Hilo from 'hilo'

export default class RejectDialog {
  constructor (error) {
    this.content = new Hilo.Container({
      align: Hilo.align.CENTER
    })
    this.bitmap = new Hilo.Bitmap({
      id: 'Radical',
      x: -215,
      image: Global.asset.getAsset(`game/reject/${error}.jpg`)
    }).addTo(this.content).on(Hilo.event.POINTER_START, this.close.bind(this))
  }
  close () {
    this.content.removeFromParent()
    Global.bus.fire('closeErrorDialog')
  }
  render (parent) {
    this.content.addTo(parent)
  }
}
