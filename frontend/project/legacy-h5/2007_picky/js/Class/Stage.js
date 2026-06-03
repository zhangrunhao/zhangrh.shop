// 初始化canvas舞台
import Hilo from 'hilo'
import $ from '$'
import {
  getWinHeight, winWidth
} from './Global'
const stage = Symbol('stage')
const balanceType = Symbol('balanceType')
const ticker = Symbol('ticker')

export default class Stage {
  constructor (p) {
    this[balanceType] = 'none'
    this[stage] = new Hilo.Stage({ // 创建初始的canvas
      container: document.getElementById('app'),
      width: winWidth,
      height: getWinHeight()
    })

    this[stage].enableDOMEvent([
      Hilo.event.POINTER_START,
      Hilo.event.POINTER_MOVE,
      Hilo.event.POINTER_END
    ], true)

    // 启动定时器
    this[ticker] = new Hilo.Ticker(70)
    this[ticker].addTick(this[stage])
    this[ticker].addTick(Hilo.Tween)
    this[ticker].start(true)
  }
  getStage () {
    return this[stage]
  }
  getTick () {
    return this[ticker]
  }
  hide () {
    $('#app canvas').hide()
  }
}
