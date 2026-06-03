import Hilo from 'hilo'
import Global from '../Class/Global'
import Bg from './Bg/Bg'
import ChooseArea from './Choose/ChosseArea'
import DragArea from './Drag/DragArea'

export default class Stage {
  constructor (info) {
    this.info = info // 构建信息 'continue' : 继续解锁 / '新进来的'
    this.createStage()
    this.chooseArea = null // 选择区域
    this.dragArea = null // 拖拽区域
    this.demo = this.createDome()
  }
  createDome () {
    let frames = []
    for (let i = 0; i <= 37; i++) {
      frames.push({
        image: Global.asset.getAsset(`game/demo/${i}.jpg`),
        rect: [0, 0, 650, 1050]
      })
    }
    return new Hilo.Sprite({
      frames,
      alpha: 0,
      x: Global.width / 2 - 650 / 2,
      y: Global.height / 2 - 1050 / 2 - 30,
      width: 650,
      height: 1050,
      timeBased: true,
      interval: 200
    })
  }
  enableDOMEvent () {
    this.stage.enableDOMEvent(Hilo.event.POINTER_START, true)
    this.stage.enableDOMEvent(Hilo.event.POINTER_MOVE, true)
    this.stage.enableDOMEvent(Hilo.event.POINTER_END, true)
  }
  createStage () {
    let timer
    const stageScaleX = innerWidth / Global.width
    const stageScaleY = innerHeight / Global.height

    const stage = this.stage = new Hilo.Stage({
      container: document.getElementById('game_stage'),
      width: Global.width,
      height: Global.height,
      scaleX: stageScaleX,
      scaleY: stageScaleY
    })
    this.enableDOMEvent()
    this.bg = new Bg().render(stage)

    const scale = Math.min(stageScaleX, stageScaleY)

    const content = Global.gameStageContent = this.content = new Hilo.Container({
      scaleX: scale / stageScaleX, // 天呐, 人生中最有价值的一块代码
      scaleY: scale / stageScaleY
    }).addTo(stage)

    this.content.x = Global.width / 2 - Global.width * scale / stageScaleX / 2
    this.content.y = Global.height / 2 - Global.height * scale / stageScaleY / 2

    const autoChange = function () {
      const stageScaleX = innerWidth / Global.width
      const stageScaleY = innerHeight / Global.height
      stage.scaleX = stageScaleX
      stage.scaleY = stageScaleY

      const scale = Math.min(stageScaleX, stageScaleY)
      content.x = Global.width / 2 - Global.width * scale / stageScaleX / 2
      content.y = Global.height / 2 - Global.height * scale / stageScaleY / 2
      content.scaleX = scale / stageScaleX
      content.scaleY = scale / stageScaleY
    }

    window.onorientationchange = () => {
      if (timer) clearTimeout(timer)
      setTimeout(() => {
        autoChange()
      }, 1500)
    }
    window.onresize = autoChange

    // 启动定时器
    Global.ticker = new Hilo.Ticker(60)
    Global.ticker.addTick(stage)
    Global.ticker.addTick(Hilo.Tween)
    Global.ticker.start(true)
  }
  showDemo () {
    setTimeout(() => {
      this.demo.on(Hilo.event.POINTER_START, () => {
        this.demo.removeFromParent()
      }).addTo(this.content)
      Hilo.Tween.to(this.demo, {
        alpha: 1,
        loop: true
      }).start()
    }, 3000)
  }
  reset () {
    this.chooseArea.reset()
    this.dragArea.reset()
  }
  render () {
    new Hilo.Bitmap({
      image: Global.asset.getAsset(`game/bg/logo.png`),
      x: 40,
      y: 42
    }).addTo(this.content)
    this.chooseArea = new ChooseArea(this.info).render(this.content)
    this.dragArea = new DragArea().render(this.content)
    if (this.info === 'new') this.showDemo()
  }
}
