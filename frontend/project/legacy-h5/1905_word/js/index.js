import '../../legacy/styles/reset.css'
import '../css/index.css'
import $ from '$'
import Global from './Class/Global'
import Asset from './Class/Asset'
import Begin from './Page/begin'
import Game from './Page/game'
import Share from './Page/share'

class App {
  constructor () {
    this.name = 'zhangrh'
    Global.asset = new Asset()
  }
  init () {
    this.begin = new Begin(() => {
      Global.asset.load()
    }).on('palyVideoEnd', () => {
      $('#game').show()
      $('#begin').hide()
      this.game = new Game('new')
      this.share = new Share()
    })
    Global.asset.on('complete', () => {
      document.body.style.backgroundColor = 'black'
      const beginDom = document.getElementById('begin')
      beginDom.addEventListener('click', () => {
        this.begin.playVideo()
      }, false)
      $('#app').show()
      $('#begin').show()
      $('#loading').hide()
    })
  }
}

const app = new App()
app.init()
