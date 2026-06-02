import '../../legacy/styles/reset.css'
import '../css/index.less'
import App from './Class/App'
import $ from '$'
document.body.addEventListener('touchmove', function (e) {
  e.preventDefault()
}, {
  passive: false
})

function orientationchangeFunction () {
  if (window.orientation === 180 || window.orientation === 0) {
    $('#app').addClass('portrait')
    $('#app').removeClass('landscape')
  }
  if (window.orientation === 90 || window.orientation === -90) {
    $('#app').removeClass('portrait')
    $('#app').addClass('landscape')
  }
}
orientationchangeFunction()
window.addEventListener('onorientationchange' in window ? 'orientationchange' : 'resize', orientationchangeFunction, false)

const app = new App()
app.init()
