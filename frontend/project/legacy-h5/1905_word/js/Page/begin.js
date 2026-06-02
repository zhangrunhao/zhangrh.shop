import $ from '$'
import Hilo from 'hilo'
class Begin {
  constructor (cb) {
    this.init(cb)
  }
  /**
   * 初始化开始页面
   */
  init (cb) {
    cb()
  }
  playVideo () {
    const video = $('#video')[0]
    video.addEventListener('play', () => {
      $('video').show()
    })
    video.addEventListener('ended', () => {
      $('#begin').hide()
      $('#game').show()
      this.fire('palyVideoEnd')
    })
    video.play()
  }
  bindBeginEvent () {

  }
}

Hilo.Class.mix(Begin.prototype, Hilo.EventMixin)
export default Begin
