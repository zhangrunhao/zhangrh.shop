import $ from '$'
import Hilo from 'hilo'
import Star from './Bg/Star'
import Global from '../Class/Global'
export default class ShareStage {
  constructor (resInfo, cb) {
    this.resInfo = resInfo
    this.queue = resInfo.queue

    this.title = null // 标题
    this.bottomBefore = null
    this.bottomBefore_shade = null
    this.bottomBefore_continueButton = null
    this.bottomBefore_code = null
    this.bottomBefore_text2 = null
    this.bottomBefore_logo = null
    this.bottomShare = null // 分享底部
    this.bottomShare_shade = null
    this.bottomShare_code = null
    this.bottomShare_text0 = null
    this.bottomShare_text1 = null
    this.bottomShare_logo = null
    this.main_pronounce = null // 拼音
    this.main_explain = null // 解释
    // mian_a -> main_f : 各个元素
    this.avatar = null // 头像
    this.spriteWord = null // 序列帧
    this.transitionSprite = null // 序列帧

    this.content = this.createStage()
    this.drawSpirteWord(this.resInfo, () => {
      this.drawStatic()
    })
    // this.showRightTransitionSprite(this.resInfo.asset, this.resInfo.queue, () => {
    // })
  }
  drawStatic () {
    this.drawCommonStaticElement(this.content) // common
    this.drawComoonBottom(this.content) // common
    this.drawShareBottom() // common
    this.drawMain(this.resInfo, this.content)
    this.drawAvatar(this.content)
    this.getResultCount(this.resInfo, this.content)
  }
  showRightTransitionSprite (assteMap, queue, cb) { // 序列帧转场动画
    let frames = assteMap.transition.map(i => {
      return queue.getContent(i)
    })
    let timer
    $('#app').hide()
    let div = document.createElement('div')
    div.setAttribute('style', 'width: 100%; height: 100%; background: #fff;')
    div.setAttribute('id', 'transitionSpriteDom')
    document.body.appendChild(div)
    let index = 0
    function step () {
      if (timer) clearTimeout(timer)
      if (frames[index - 1]) {
        div.removeChild(frames[index - 1])
        frames[index - 1] = null
      }
      div.appendChild(frames[index])
      index++
      if (index < 22) {
        timer = setTimeout(step, 150)
      } else {
        if (timer) clearTimeout(timer)
        frames[frames.length - 1] = null
        frames = null
        $('#app').show()
        document.body.removeChild(div)
      }
    }
    step()
    if (cb instanceof Function) cb()
  }
  drawAvatar (parent) {
    if (Global.isWX) {
      const con = new Hilo.Container().addTo(parent)
      const circle = this.avatar = new Hilo.Graphics({
        width: 132,
        height: 132,
        scaleX: 76 / 132,
        scaleY: 76 / 132,
        x: 85,
        y: 90
      }).addTo(con)
      circle
        .drawCircle(0, 0, 66)
        .beginBitmapFill(this.queue.getContent('user_avatar'), 'no-repeat')
        .endFill()
        .addTo(con)
    } else {
      this.avatar = new Hilo.Bitmap({ // 头像
        image: Global.asset.getAsset('share/common/avatr.png'),
        x: 85,
        y: 90
      }).addTo(parent)
    }
  }
  getResultCount (resInfo, parent) {
    let resArray = []
    const storage = localStorage.getItem('wrodResultStorage')
    if (storage) {
      resArray = JSON.parse(storage)
      localStorage.removeItem('wrodResultStorage')
    }
    const inArray = resArray.filter(i => {
      return i.id === resInfo.info.id
    })
    if (inArray.length === 0) resArray.push(resInfo.info)
    const count = resArray.length
    localStorage.setItem('wrodResultStorage', JSON.stringify(resArray))
    this.drawCount(count, parent)
  }
  drawCount (count, parent) {
    new Hilo.Text({
      color: 'white',
      text: `${count} / 30`,
      x: 236,
      y: 310
    }).setFont('28px arial').addTo(parent)
    if (count > 29) {
      setTimeout(() => {
        const egg = new Hilo.Bitmap({
          image: Global.asset.getAsset('share/common/egg.jpg')
        }).addTo(parent)
        egg.on(Hilo.event.POINTER_START, () => {
          egg.alpha = 0
        })
      }, 2000)
    }
  }
  drawSpirteWord (resInfo, cb) {
    const frames = resInfo.asset.sprite.map(i => {
      return {
        image: this.queue.getContent(i),
        rect: [0, 0, 300, 300]
      }
    })
    this.spriteWord = new Hilo.Sprite({ // word
      x: 30,
      y: 176,
      frames,
      timeBased: true,
      interval: 200,
      loop: false
    }).addTo(this.content).setFrameCallback(11, () => {
      if (cb instanceof Function) cb()
    })
  }
  drawMain (resInfo, parent) {
    const sort = resInfo.info.sort
    const asset = resInfo.asset.info
    if (sort === 'normal') {
      this.main_a = new Hilo.Bitmap({ // 诗_图片
        image: this.queue.getContent(asset.verse_picture),
        x: 320,
        y: 625
      }).addTo(parent)
      this.main_b = new Hilo.Bitmap({ // 类型名称
        image: Global.asset.getAsset('share/normal/sort.png'),
        x: 54,
        y: 544
      }).addTo(parent)
      this.main_c = new Hilo.Bitmap({ // 诗
        image: this.queue.getContent(asset.verse),
        x: 60,
        y: 600
      }).addTo(parent)
      this.main_d = new Hilo.Bitmap({ // 诗_解释
        image: this.queue.getContent(asset.verse_explain),
        x: 60,
        y: 748
      }).addTo(parent)
    } else if (sort === 'rare') {
      this.main_e = new Hilo.Bitmap({ // 配图
        image: this.queue.getContent(asset.diagram),
        y: 657
      }).addTo(parent)
      this.main_f = new Hilo.Bitmap({ // 类型名称
        image: Global.asset.getAsset('share/rare/sort.png'),
        x: 54,
        y: 544
      }).addTo(parent)
      this.main_g = new Hilo.Bitmap({ // 测试
        image: this.queue.getContent(asset.test),
        x: 60,
        y: 594
      }).addTo(parent)
    }

    this.main_pronounce = new Hilo.Bitmap({ // 拼音
      image: this.queue.getContent(asset.pronounce),
      x: 236,
      y: 316
    }).addTo(parent)
    this.main_explain = new Hilo.Bitmap({ // 解释
      image: this.queue.getContent(asset.explain),
      x: 236,
      y: 418
    }).addTo(parent)
  }
  drawBg (parent) {
    new Hilo.Bitmap({ // 背景
      image: Global.asset.getAsset('game/bg/0.jpg')
    }).addTo(parent)
    new Star().render(parent)
  }
  drawCommonStaticElement (parent) {
    this.title = new Hilo.Bitmap({ // 标题
      image: Global.asset.getAsset('share/common/title.png'),
      x: 30,
      y: 5
    }).addTo(parent)
  }
  drawComoonBottom (parent) {
    const bottomBefore = this.bottomBefore = new Hilo.Container({
      width: 750,
      height: 240,
      y: 1333 - 240
    }).addTo(parent)
    this.bottomBefore_shade = new Hilo.Container({ // 遮挡
      width: 750,
      height: 240,
      background: 'black',
      alpha: 0.2
    }).addTo(bottomBefore)
    this.bottomBefore_continueButton = new Hilo.Bitmap({ // 继续按钮
      image: Global.asset.getAsset('share/common/btn-continue.png'),
      x: 270,
      y: 50
    }).addTo(bottomBefore).on(Hilo.event.POINTER_START, () => {
      this.continueGame()
    })
    this.bottomBefore_code = new Hilo.Bitmap({ // 二维码
      image: Global.asset.getAsset('share/common/code.jpeg'),
      width: 135,
      height: 131,
      x: 560,
      y: 28
    }).addTo(bottomBefore)
    this.bottomBefore_text2 = new Hilo.Bitmap({ // 文案
      image: Global.asset.getAsset('share/common/text2.png'),
      x: 560,
      y: 170
    }).addTo(bottomBefore)
    this.bottomBefore_logo = new Hilo.Bitmap({ // Logo
      image: Global.asset.getAsset('share/common/logo.png'),
      x: 60,
      y: 165
    }).addTo(bottomBefore)
  }
  drawShareBottom () {
    const bottomShare = this.bottomShare = new Hilo.Container({
      width: 750,
      height: 240,
      y: 1333 - 240
    })
    this.bottomShare_shade = new Hilo.Container({ // 遮挡
      width: 750,
      height: 240,
      background: 'black',
      alpha: 0.2
    }).addTo(bottomShare)
    this.bottomShare_code = new Hilo.Bitmap({ // 二维码
      image: Global.asset.getAsset('share/common/code.jpeg'),
      width: 135,
      height: 131,
      x: 490,
      y: 28
    }).addTo(bottomShare)
    this.bottomShare_text0 = new Hilo.Bitmap({ // 文案_二维码下方
      image: Global.asset.getAsset('share/common/text0.png'),
      x: 492,
      y: 172
    }).addTo(bottomShare)
    this.bottomShare_text1 = new Hilo.Bitmap({ // 文案_主体
      image: Global.asset.getAsset('share/common/text1.png'),
      x: 120,
      y: 40
    }).addTo(bottomShare)
    this.bottomShare_logo = new Hilo.Bitmap({ // Logo
      image: Global.asset.getAsset('share/common/logo.png'),
      x: 120,
      y: 175
    }).addTo(bottomShare)
  }
  createStage () {
    let timer
    const stageScaleX = innerWidth / Global.width
    const stageScaleY = innerHeight / Global.height
    const stage = new Hilo.Stage({
      id: 'share_stage_canvas',
      container: document.getElementById('share_stage'),
      width: Global.width,
      height: Global.height,
      scaleX: stageScaleX,
      scaleY: stageScaleY
    })
    this.drawBg(stage)

    const scale = Math.min(stageScaleX, stageScaleY)
    const content = new Hilo.Container({
      scaleX: scale / stageScaleX,
      scaleY: scale / stageScaleY
    }).addTo(stage)
    content.x = Global.width / 2 - Global.width * scale / stageScaleX / 2
    content.y = Global.height / 2 - Global.height * scale / stageScaleY / 2

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

    stage.enableDOMEvent(Hilo.event.POINTER_START, true)
    Global.ticker.addTick(stage)
    return content
  }
  removeAllElement () {
    this.title = null
    this.bottomBefore = null
    this.bottomBefore_shade = null
    this.bottomBefore_continueButton = null
    this.bottomBefore_code = null
    this.bottomBefore_text2 = null
    this.bottomBefore_logo = null
    this.bottomShare = null
    this.bottomShare_shade = null
    this.bottomShare_code = null
    this.bottomShare_text0 = null
    this.bottomShare_text1 = null
    this.bottomShare_logo = null
    this.main_pronounce = null
    this.main_explain = null
    this.main_a = null
    this.main_b = null
    this.main_c = null
    this.main_d = null
    this.main_e = null
    this.main_f = null
    this.main_g = null
    this.avatar = null

    this.spriteWord = null
    this.transitionSprite = null
  }

  continueGame () {
    Global.gameStage.reset()
    this.queue.tag = 'isWasted'
    this.removeAllElement()
    $('#share_stage canvas').remove()
    $('#share').hide()
  }
}
