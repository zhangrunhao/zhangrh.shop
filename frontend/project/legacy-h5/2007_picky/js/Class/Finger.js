import Hilo from 'hilo'
import { isFunction, isUndefined } from 'lodash'

export default class Finger {
  constructor (view, options) {
    this.isStart = false
    this.options = options
    view.on(Hilo.event.POINTER_START, this._onTouchStart.bind(this))
    view.on(Hilo.event.POINTER_MOVE, this._onTouchMove.bind(this))
    view.on(Hilo.event.POINTER_END, this._onTouchEnd.bind(this))
  }
  _getTime () {
    return new Date().getTime()
  }
  _onTouchStart (e) {
    if (this.isStart) { // 解决: 重复start问题
      delete this.moveX
      delete this.moveY
    }
    this.isStart = true
    // 记录touch开始的位置
    this.startX = e.touches[0].pageX
    this.startY = e.touches[0].pageY
    if (e.touches.length > 1) {
      // 多点监测
    } else {
      // 记录touch开始的时间
      this.startTime = this._getTime()
    }
  }
  _onTouchMove (e) {
    this.moveX = e.touches[0].pageX
    this.moveY = e.touches[0].pageY
  }
  _onTouchEnd (e) {
    if (isUndefined(this.startX) || isUndefined(this.startY)) { // 解决: 没有start, 直接end情况
      delete this.moveX
      delete this.moveY
    }
    let timestamp = this._getTime()
    if (
      (this.moveX !== null && Math.abs(this.moveX - this.startX) > 10) || (this.moveY !== null && Math.abs(this.moveY - this.startY) > 10)
    ) {
    } else {
      // 手指移动的位移要小于10像素并且手指和屏幕的接触时间要短语500毫秒
      if (timestamp - this.startTime < 500) {
        // this._emitEvent('onTap')
        isFunction(this.options.onTap) && this.options.onTap({
          startX: this.startX,
          startY: this.startY
        })
      }
    }
  }
}
