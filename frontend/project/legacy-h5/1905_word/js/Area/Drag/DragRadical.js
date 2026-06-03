// 在游戏区的偏旁类
import Hilo from 'hilo'
import Global from '../../Class/Global'

export default class Radical {
  constructor (info) {
    this.info = info // 按钮信息
    this.bitmap = this.createBitmap()
    const content = this.content = this.creatContent()
    this.gradient = this.creatGradientLinear().addTo(content)
    this.close = this.createCloseButton().addTo(content)
    this.listenEvent()
  }
  /**
   * 取消激活
   */
  cancleActive () {
    this.activeStatus = 'inActive'
    this.gradient.alpha = 0
    this.close.alpha = 0
    return this
  }
  /**
   * 激活按钮
   */
  toActive () {
    this.activeStatus = 'active'
    this.gradient.alpha = 1
    this.close.alpha = 1
    return this
  }
  /**
   * 创建容器
   */
  creatContent () {
    const bitmapBounds = this.bitmap.getBounds()
    return new Hilo.Container({
      width: bitmapBounds.width + 30,
      height: bitmapBounds.height + 30
    }).addChild(this.bitmap)
  }
  createBitmap () {
    const bitmap = new Hilo.Bitmap({
      id: 'Radical',
      align: Hilo.align.CENTER,
      image: Global.asset.getAsset(`game/radical/${this.info.index}.png`)
    })
    return bitmap
  }
  creatGradientLinear () {
    const bounds = this.content.getBounds()
    const gradient = new Hilo.Graphics({
      alpha: 0,
      width: bounds.width,
      height: bounds.height
    })
    gradient.setLineDash([5, 5])
      .lineStyle(2, 'white')
      .drawRect(0, 0, bounds.width, bounds.height)
      .endFill()
    return gradient
  }
  createCloseButton () {
    const bounds = this.content.getBounds()
    return new Hilo.Bitmap({
      image: Global.asset.getAsset(`game/button/close.png`),
      y: -10,
      x: bounds.width - 12
    })
  }
  listenEvent () {
    this.content.on(Hilo.event.POINTER_START, this.moveStart.bind(this))
    this.content.on(Hilo.event.POINTER_MOVE, this.moveMove.bind(this))

    this.close.on(Hilo.event.POINTER_START, this.closeEnd.bind(this))
  }
  moveStart (e) {
    e.preventDefault()
    Global.bus.fire('activeRadical', this) // 广播事件, 变为最上层的激活状态
    this.nowX = this.content.x
    this.nowY = this.content.y
    this.startX = e.stageX
    this.startY = e.stageY
  }
  moveMove (e) {
    e.preventDefault()
    const moveX = this.startX - e.stageX
    const moveY = this.startY - e.stageY
    const x = this.nowX - moveX
    const y = this.nowY - moveY
    if (this.judgeOverParent(x, y)) this.moveAllView(x, y)
  }
  moveAllView (x, y) {
    this.content.x = x
    this.content.y = y
  }
  judgeOverParent (x, y) {
    const bounds = this.parentContainer.getBounds()
    const x1 = x + bounds.x
    const y1 = y + bounds.y
    const x2 = x + this.content.width + bounds.x
    const y2 = y + this.content.height + bounds.y
    return this.parentContainer.hitTestPoint(x1, y1) && this.parentContainer.hitTestPoint(x2, y2)
  }
  closeEnd (e) {
    e.stopPropagation()
    Global.bus.fire('removeRadicalFromGame', this)
  }
  render (parentContainer) {
    this.parentContainer = parentContainer
    this.content.x = this.parentContainer.width / 2 - this.content.width / 2
    this.content.y = this.parentContainer.height / 2 - this.content.height / 2
    this.content.addTo(parentContainer)
    return this
  }
}
