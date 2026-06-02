
import $ from '$'

class Prelude {
  show () { // 展示序幕
    return new Promise((resolve, reject) => {
      $('.bg').addClass('pre')
      setTimeout(() => {
        $('.bg').removeClass('pre')
        resolve()
      }, 6000)
    })
  }
}

export default Prelude
