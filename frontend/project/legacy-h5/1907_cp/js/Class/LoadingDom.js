/* eslint-disable no-debugger */

import $ from '$'
import Hilo from 'hilo'
import NewDom from './NewDom'
class Loading {
  show () {
    $('#app').hide()
    $('#Loading').show()
    $('#rateOuter').show()
    new NewDom(document.getElementById('loadingImg'), {
      width: 750,
      height: 1464
    }).listenChange()
    $('#loadingImg').on('click', () => {
      document.getElementById('audio').play()
      document.getElementById('videoQ1').muted = false
      document.getElementById('videoQ4').muted = false
      this.fire('clickStartBtn')
    })
  }
  showCoverImg () {
    $('#rateOuter').hide()
    $('#loadingImg').show()
  }
  hide () {
    $('#app').show()
    $('#Loading').hide()
  }
  updateRate (rate) {
    $('#rate').text(rate)
  }
}

Hilo.Class.mix(Loading.prototype, Hilo.EventMixin)
export default Loading
