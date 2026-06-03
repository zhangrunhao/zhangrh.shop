import Scroller from 'Scroller'
import Hilo from 'hilo'

const scroller = Symbol('scroller')
const onUserPointerStart = Symbol('onUserPointerStart')
const onUserPointerMove = Symbol('onUserPointerMove')
const onUserPointerEnd = Symbol('onUserPointerEnd')
const cancelMonitor = Symbol('cancelMonitor') // 是否取消监听
const render = Symbol('render')

class MyScroller {
  constructor (stage, startView) {
    (startView || stage).on(Hilo.event.POINTER_START, this[onUserPointerStart].bind(this))
    stage.on(Hilo.event.POINTER_MOVE, this[onUserPointerMove].bind(this))
    stage.on(Hilo.event.POINTER_END, this[onUserPointerEnd].bind(this))
    this[cancelMonitor] = false // 是否取消监听
    this[scroller] = new Scroller((left, top, zoom) => {
      this[render](left, top)
    }, {
      scrollingX: true,
      scrollingY: true
    })
  }
  [render] (left, top) {
    this.fire('left', left)
    this.fire('top', top)
  }
  [onUserPointerStart] (event) {
    if (this[cancelMonitor]) return
    this[scroller].doTouchStart(event.touches, event.timeStamp)
  }
  [onUserPointerMove] (event) {
    if (this[cancelMonitor]) return
    this[scroller].doTouchMove(event.touches, event.timeStamp, event.scale)
  }
  [onUserPointerEnd] (event) {
    if (this[cancelMonitor]) return
    this[scroller].doTouchEnd(event.timeStamp)
  }
  cancelTouch (flag) {
    this[cancelMonitor] = flag
  }
  setDimensions (maxW) {
    return this[scroller].setDimensions(0, 0, maxW, 0)
  }
  setDimensionsY (maxH) {
    return this[scroller].setDimensions(0, 0, 0, maxH)
  }
  scrollTo (a, b, c) {
    return this[scroller].scrollTo(a, b, c)
  }
  scrollBy (a, b, c) {
    return this[scroller].scrollBy(a, b, c)
  }
  finishPullToRefresh () {
    return this[scroller].finishPullToRefresh()
  }
  triggerPullToRefresh () {
    return this[scroller].triggerPullToRefresh()
  }
  setPosition (left, top) {
    return this[scroller].setPosition(left, top)
  }
  __publish (a, b, c, d) {
    return this[scroller].__publish(a, b, c, d)
  }
  stop () {
    const self = this[scroller]
    if (self.__isDecelerating) {
      core.effect.Animate.stop(self.__isDecelerating)
      self.__isDecelerating = false
      self.__interruptedAnimation = true
    }

    if (self.__isAnimating) {
      core.effect.Animate.stop(self.__isAnimating)
      self.__isAnimating = false
      self.__interruptedAnimation = true
    }
  }
}

Hilo.Class.mix(MyScroller.prototype, Hilo.EventMixin)
export default MyScroller
