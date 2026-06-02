import '../css/index.css'
import Global from './class/Global'
import Asset from './class/Asset'
import Bus from './class/Bus'
import S1 from './scene/s1'
import Hilo from 'hilo'
import Scroller from 'Scroller'

const app = {
  init: function () {
    this.initAudio()
    // 加载静态资源
    Global.asset = new Asset()
    Global.asset.on('complete', function (e) {
      // 此时所有均已加载完成
      Global.asset.off('complete')
      this.initStage()
    }.bind(this))
    Global.asset.load()
  },
  initStage: function () {
    this.initBus()
    this.createStage()
    this.initScene()
    this.ready()
  },
  initAudio: function () {
    var myaudio = Global.myAudio = new Hilo.HTMLAudio({
      src: new URL('../asset/audio/audio.mp3', import.meta.url).href,
      loop: true
    })
    myaudio.load()
  },
  createStage: function () {
    var that = this
    // 设计图, 1080 * 1920, 三倍放大
    var stageScaleX = innerWidth / Global.width
    var stageScaleY = innerHeight / Global.height

    Global.stage = new Hilo.Stage({
      container: document.getElementById('stage'),
      width: Global.width,
      height: Global.height,
      scaleX: stageScaleX,
      scaleY: stageScaleY
    })

    // 屏幕自适应
    window.onresize = function () {
      Global.stage.scaleX = innerWidth / Global.width
      Global.stage.scaleY = innerHeight / Global.height
      Global.stage.resize(Global.width, Global.height, true)
    }
    // 启动定时器
    Global.ticker = new Hilo.Ticker(60)
    Global.ticker.addTick(Global.stage)
    Global.ticker.addTick(Hilo.Tween)
    Global.ticker.start(true)

    // 绑定交互事件
    Global.stage.enableDOMEvent([
      Hilo.event.POINTER_START,
      Hilo.event.POINTER_MOVE,
      Hilo.event.POINTER_END
    ], true)

    // 绑定开始事件
    Global.stage.on(Hilo.event.POINTER_START, this.onUserPointerStart.bind(this))
    Global.stage.on(Hilo.event.POINTER_MOVE, this.onUserPoniterMove.bind(this))
    Global.stage.on(Hilo.event.POINTER_END, this.onUserPoinerEnd.bind(this))

    Global.scroller = new Scroller(function (left, top, zoom) {
      that.render(top)
    }, {
      scrollingX: false
    })
  },
  render: function (top) {
    Global.bus.fire('changeTouchHeight', {
      distance: top * Global.touchSpeed,
      direction: this.direction
    })
  },
  onUserPointerStart: function (event) {
    this.playAudioAfterGesture()
    this.touchStartTop = event.stageY
    Global.scroller.doTouchStart(this.getScrollerTouches(event), event.timeStamp)
  },
  onUserPoniterMove: function (event) { // 计算当前向上滚动的高度
    if (event.stageY > this.touchStartTop) {
      this.direction = 'up'
    } else {
      this.direction = 'down'
    }
    Global.scroller.doTouchMove(this.getScrollerTouches(event), event.timeStamp, event.scale)
  },
  onUserPoinerEnd: function (event) {
    Global.scroller.doTouchEnd(event.timeStamp)
  },
  getScrollerTouches: function (event) {
    if (event.touches && event.touches.length != null) return event.touches
    return [{
      pageX: event.pageX || event.stageX || 0,
      pageY: event.pageY || event.stageY || 0
    }]
  },
  initBus: function () { // 初始化事件系统
    Global.bus = new Bus()
  },
  initScene: function () {
    // 在这里获取到所有场景, 并把场景加入到stage中
    Global.scene = [
      new S1()
    ]
  },
  playAudioAfterGesture: function () {
    if (this.audioStarted || !Global.myAudio) return
    this.audioStarted = true
    try {
      Global.myAudio.play()
    } catch (err) {
      this.audioStarted = false
    }
  },
  ready: function () {
    Global.scene[0].readyStart()
  }
}
app.init()
