import $ from '$'
import Hilo from 'hilo'

const $domHome = $('#home')
const $domDemo = $domHome.children('.demo')
class Home {
  constructor (user, login) {
    this.login = login
    this.initEvent()
    $domDemo.on('click', () => {
      $domHome.children().show()
      $domDemo.hide()
      this.fire('startBtnOnClick')
    })
  }
  show () {
    $('#home .rank').hide()
    $('.bg').addClass('bg-home')
    $domHome.show()
  }
  hide () {
    $('.bg').removeClass('bg-home')
    $domHome.hide()
  }
  initEvent () {
    $('#home .start').on('click', () => {
      $domHome.children().hide()
      $('.bg').removeClass('bg-home')
      $domDemo.show()
    })
    $('#home .rank').on('click', () => {
      this.fire('rankBtnOnClick')
    })
  }
}

Hilo.Class.mix(Home.prototype, Hilo.EventMixin)
export default Home
