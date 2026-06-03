// 初始化canvas舞台
import Hilo from 'hilo'
import Global from './Global'
const stage = Symbol('stage')
const balanceType = Symbol('balanceType')
const fakeContainer = Symbol('fakeContainer')
const ticker = Symbol('ticker')
export default class Stage {
  constructor (p) {
    this[balanceType] = 'none'
    this[stage] = new Hilo.Stage({ // 创建初始的canvas
      container: document.getElementById('app'),
      width: Global.width,
      height: Global.height
    })
    // TODO: 这里也需要修改成, 简单的方式
    if (p && p.sandwich && p.sandwich instanceof Hilo.View) {
      p.sandwich.addTo(this[stage])
    }
    this[fakeContainer] = new Hilo.Container({
      id: 'fakeContainer'
    }).addTo(this[stage])

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

    this.setListenResize()
  }
  getRealStage () {
    return this[stage]
  }
  getTicker () {
    return this[ticker]
  }
  getStage () {
    return this[fakeContainer]
  }
  /**
   * 1. none: 保持比例, 不足的留白
   * 2. width: 保持比例, 保持宽100%, 高留白或裁剪
   * @param {String} type 适配类型
   */
  setBalanceType (type) {
    if (type) {
      this[balanceType] = type
      this.autoChange()
    }
  }
  /**
   * 自动变化适配方式
   * @param {Boolean} useOrigin 是否使用原始比例
   */
  autoChange (useOrigin) {
    let scale
    const stageScaleX = useOrigin ? 0.5 : innerWidth / Global.width // 应该缩放的比例
    const stageScaleY = useOrigin ? 0.5 : innerHeight / Global.height

    // 舞台的宽高适配到正常比例
    this[stage].scaleX = stageScaleX
    this[stage].scaleY = stageScaleY

    // 判断当前适配方式, 选出宽高应该使用的同一个缩放比例
    switch (this[balanceType]) {
      case 'none':
        scale = Math.min(stageScaleX, stageScaleY)
        break
      case 'width':
        scale = stageScaleX
        break
      default:
        scale = Math.min(stageScaleX, stageScaleY)
        break
    }

    // 一个神奇的例子
    // 当x, y变化不同时
    // 变化过多的那个边, 先除个自己的变化, 变成之前的, 再乘另一个系数, 变成了对应的
    // 再次更新, 其实没什么, 无非就是少变的那个边, 先变回去, 然后按照另一个边, 变的更小
    this[fakeContainer].scaleX = scale / stageScaleX
    this[fakeContainer].scaleY = scale / stageScaleY

    // 居中
    this[fakeContainer].x = Global.width / 2 - Global.width * scale / stageScaleX / 2
    this[fakeContainer].y = Global.height / 2 - Global.height * scale / stageScaleY / 2
  }
  getGapDistanceX () {
    // TODO: 总感觉这种方式及其不合理. 没有想到好的方法
    return this[fakeContainer].x / this[fakeContainer].scaleX
  }
  getGapDistanceY () {
    return this[fakeContainer].y / this[fakeContainer].scaleY
  }
  setListenResize () {
    let timer
    this.autoChange()
    window.addEventListener('orientationchange', () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        this.autoChange()
      }, 1500)
    })
  }
}
