
import Scroller from 'Scroller'
import Hilo from 'hilo'

const scroller = Symbol('scroller')
const onUserPointerStart = Symbol('onUserPointerStart')
const onUserPoniterMove = Symbol('onUserPoniterMove')
const onUserPoinerEnd = Symbol('onUserPoinerEnd')
const render = Symbol('render')

class MyScroller {
  constructor (stage) {
    stage.on(Hilo.event.POINTER_START, this[onUserPointerStart].bind(this))
    stage.on(Hilo.event.POINTER_MOVE, this[onUserPoniterMove].bind(this))
    stage.on(Hilo.event.POINTER_END, this[onUserPoinerEnd].bind(this))
    this[scroller] = new Scroller((left, top, zoom) => {
      this[render](top)
    }, {
      scrollingX: false
    })
  }
  [render] (top) {
    this.fire('top', top)
  }
  [onUserPointerStart] (event) {
    this.touchStartTop = event.stageY
    this[scroller].doTouchStart(event.touches, event.timeStamp)
  }
  [onUserPoniterMove] (event) {
    this[scroller].doTouchMove(event.touches, event.timeStamp, event.scale)
  }
  [onUserPoinerEnd] (event) {
    this[scroller].doTouchEnd(event.timeStamp)
  }
}

Hilo.Class.mix(MyScroller.prototype, Hilo.EventMixin)
export default MyScroller
