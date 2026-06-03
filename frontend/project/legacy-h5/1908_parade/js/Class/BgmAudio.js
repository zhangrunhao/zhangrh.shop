import Hilo from 'hilo'

class BgmAudio {
  constructor () {
    this.audioDom = document.getElementById('audio')
    this.isPlay = false
    this.audioDom.addEventListener('play', () => {
      this.isPlay = true
    })
    document.getElementById('app').addEventListener('click', () => {
      this.isPlay || this.audioDom.play()
    })
    document.getElementById('app').addEventListener('touchstart', () => {
      this.isPlay || this.audioDom.play()
    })
  }
}

Hilo.Class.mix(BgmAudio.prototype, Hilo.EventMixin)
export default BgmAudio
