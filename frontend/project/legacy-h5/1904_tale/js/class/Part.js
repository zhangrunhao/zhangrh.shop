import Global from './Global'
import Hilo from 'hilo'

const Part = Hilo.Class.create({
  content: null, // 这是我们生成之后的conteriner
  Mixes: Hilo.EventMixin,
  constructor: function (properties) {
    this.parentNode = properties.parentNode || null
    this.parentContainer = properties.parentNode ? properties.parentNode.content : null
    this.parentName = properties.parentNode ? properties.parentNode.name : ''
    this.name = properties.name || ''
    this.partHeight = properties.height || 0
    this.disappearNext = properties.disappear || 0

    this.state = 'hide'
    this.nextDone = false
    this.prevDone = false
    this.index = this.parentNode.partMap.length // 此处为核心概念, 根据数组长度确定当前索引!!
    this.content = new Hilo.Container({
      id: this.name
    })

    this.initStartHeight()
    if (this.init instanceof Function) this.init()
    Global.bus.on('changeTouchHeight', this.changeTouchHeight.bind(this))
  },
  initStartHeight: function () {
    var perNode = this.getPrevNode()
    this.startHeight = perNode ? Global.totalHeight += perNode.partHeight : Global.totalHeight
    var maxHeight = (this.startHeight + this.partHeight - Global.height) / Global.touchSpeed

    Global.scroller.setDimensions(0, 0, 0, maxHeight)
  },
  changeTouchHeight: function (info) { // 高度变化: 所有的场景变化来源此处
    if (this.state === 'show' && this.shouldUpdate instanceof Function) {
      var touchHeight = info.detail.distance - this.startHeight
      var direction = info.detail.direction
      if (direction === 'up' && touchHeight <= 0) {
        this.prev()
      }
      if (direction === 'down' && touchHeight >= this.partHeight) {
        console.info(this.name, 'down end')
        this.end()
      }
      if (direction === 'up' && this.getPrevNode() && touchHeight < -this.getDisappearPrev()) {
        console.info(this.name, 'up end')
        this.end()
      }
      this.shouldUpdate(touchHeight, direction)
    }
  },
  start: function () {
    if (this.state === 'show') return
    this.state = 'show'
    console.info(this.name, 'start')
    if (this.onStart instanceof Function) this.onStart()
    this.content.addTo(this.parentContainer)
  },
  reStart: function () {
    if (this.state === 'show') return
    this.state = 'show'
    console.info(this.name, 'reStart')
    if (this.onreStart instanceof Function) this.onreStart()
    this.content.addTo(this.parentContainer, 0)
  },
  prev: function () {
    if (this.state === 'hide' || this.prevDone) return
    if (this.getPrevNode() && this.getPrevNode().state === 'show') return
    this.prevDone = true
    console.info(this.name, 'prev')
    if (this.onPrev instanceof Function) this.onPrev()
    this.getPrevNode() && this.getPrevNode().reStart()
  },
  next: function () {
    if (this.state === 'hide' || this.nextDone) return
    if (this.getNextNode() && this.getNextNode().state === 'show') return
    this.nextDone = true
    console.info(this.name, 'next')
    if (this.onNext instanceof Function) this.onNext()
    this.getNextNode() && this.getNextNode().start()
  },
  end: function () {
    if (this.state === 'hide') return
    console.info(this.name, 'end')
    if (this.onEnd instanceof Function) this.onEnd()
    this.state = 'hide'
    this.content.removeFromParent()
    this.getNextNode() && (this.getNextNode().prevDone = false)
    this.getPrevNode() && (this.getPrevNode().nextDone = false)
  },
  getPrevNode: function () {
    var map = this.parentNode.partMap
    var index = this.index
    return map[index - 1]
  },
  getNextNode: function () {
    var map = this.parentNode.partMap
    var index = this.index
    return map[index + 1]
  },
  getDisappearNext: function () {
    return this.disappearNext
  },
  getDisappearPrev: function () {
    return (this.getPrevNode() && this.getPrevNode().getDisappearNext()) || 0
  }
})

export default Part
