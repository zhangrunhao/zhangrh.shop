import Hilo from 'hilo'
import Global from '../../Class/Global'

export default class ChooseCheckButton {
  constructor () {
    this.content = new Hilo.Container({
      width: 153,
      height: 153,
      x: 298,
      y: 744
    })
    Global.bus.on('closeErrorDialog', () => {
      this.sotpLoad()
    })
    this.main = new Hilo.Bitmap({
      image: Global.asset.getAsset(`game/button/btn-before.png`)
    }).addTo(this.content)
    this.main.x = this.content.width / 2 - this.main.width / 2
    this.main.y = this.content.height / 2 - this.main.height / 2

    this.curcleBig = new Hilo.Bitmap({
      image: Global.asset.getAsset(`game/button/curcle-big.png`)
    }).addTo(this.content)
    this.curcleBig.pivotX = this.curcleBig.width / 2
    this.curcleBig.pivotY = this.curcleBig.height / 2
    this.curcleBig.x = this.content.width / 2
    this.curcleBig.y = this.content.height / 2

    this.curcleLitter = new Hilo.Bitmap({
      image: Global.asset.getAsset(`game/button/curcle-litter.png`)
    }).addTo(this.content)
    this.curcleLitter.pivotX = this.curcleLitter.width / 2
    this.curcleLitter.pivotY = this.curcleLitter.height / 2
    this.curcleLitter.x = this.content.width / 2
    this.curcleLitter.y = this.content.height / 2
  }
  toLoadStyle () {
    this.main.setImage(Global.asset.getAsset(`game/button/btn-after.png`))
    if (this.litterTween && this.biggerTween) {
      this.litterTween.start()
      this.biggerTween.start()
      return
    }
    this.litterTween = Hilo.Tween.to(this.curcleLitter, {
      rotation: 360
    }, {
      duration: 2000,
      loop: true
    })
    this.biggerTween = Hilo.Tween.to(this.curcleBig, {
      rotation: -360
    }, {
      duration: 3000,
      loop: true
    })
  }
  sotpLoad () {
    this.main.setImage(Global.asset.getAsset(`game/button/btn-before.png`))
    this.litterTween.stop()
    this.biggerTween.stop()
  }
}
