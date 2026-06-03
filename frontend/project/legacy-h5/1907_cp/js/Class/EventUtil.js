import Hilo from 'hilo'
class EventUtil {
  constructor (view) {
    this.view = view
    this.startParams = null // start参数
    view.on(Hilo.event.POINTER_START, this.touchStart.bind(this))
    view.on(Hilo.event.POINTER_MOVE, this.touchMove.bind(this))
    view.on(Hilo.event.POINTER_END, this.touchEnd.bind(this))
  }
  touchStart (e) {
    this.startParams = e
  }
  touchMove (e) {
  }
  touchEnd (e) {
    if (!this.startParams) return
    const timespan = e.timeStamp - this.startParams.timeStamp
    const changeX = Math.abs(this.startParams.stageX - e.stageX)
    const changeY = Math.abs(this.startParams.stageY - e.stageY)
    if (timespan < 150 && changeX < 10 && changeY < 10) {
      this.fire('click')
    }
  }
}

Hilo.Class.mix(EventUtil.prototype, Hilo.EventMixin)
export default EventUtil
