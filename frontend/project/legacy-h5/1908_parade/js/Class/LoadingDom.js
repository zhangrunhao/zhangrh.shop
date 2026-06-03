import Hilo from 'hilo'
class LoadingDom {
  show () {
    document.getElementById('app').style.display = 'none'
    document.getElementById('rateOuter').style.display = 'block'
  }
  hide () {
    document.getElementById('rateOuter').style.display = 'none'
    document.getElementById('app').style.display = 'block'
  }
  updateRate (rate) {
    document.getElementById('rate').innerText = rate
  }
}

Hilo.Class.mix(LoadingDom.prototype, Hilo.EventMixin)
export default LoadingDom
