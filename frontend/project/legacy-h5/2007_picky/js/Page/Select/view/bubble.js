import Hilo from 'hilo'
import {
  getWinHeight
} from '../../../Class/Global'
import Page from '../../../Class/Page'

export default class AdornView extends Page {
  constructor (asset) {
    super()
    this.initBubble(asset)
  }
  initBubble (asset) {
    this.bottomBubble = new Hilo.ParticleSystem({
      emitNum: 2,
      emitterX: 0,
      emitterY: getWinHeight() - 60,
      emitNumVar: 1,
      emitTime: 1.5,
      gx: 0,
      gy: 10,
      particle: {
        frame: [
          [0, 0, 250, 250],
          [250, 0, 250, 250],
          [5000, 0, 250, 250]
        ],
        vx: 500,
        vy: -100,
        ax: -10,
        ay: -20,
        vxVar: 200,
        vyVar: 3,
        axVar: 150,
        ayVar: 20,
        life: 3.5,
        alphaV: -0.005,
        scale: 0.3,
        scaleVVar: 0.0005,
        image: asset.getContent('adorn/bubble.png')
      }
    })

    this.bottomBubble.start()
  }
  hideBottomView () {
    this.bottomAdorn.removeFromParent()
    this.bottomBubble.stop()
    this.bottomBubble.removeFromParent()
  }
}
