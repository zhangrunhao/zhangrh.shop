import C1 from '../Page/c1'
import C2 from '../Page/c2'
import C3 from '../Page/c3'
import C4 from '../Page/c4'
import C5 from '../Page/c5'
import C6 from '../Page/c6'
import C7 from '../Page/c7'
import C8 from '../Page/c8'
import EndPart from '../Page/EndPart'

import Stage from './Stage'
import Loader from './Loader'
import Card from './Card/index'
import Bg from './Bg'
import MyScroller from './MyScroller'
import Global from './Global'
import BgmAudio from './BgmAudio'
import LoadingDom from './LoadingDom'

const index = Symbol('index')
const isRunTransfer = Symbol('isRunTransfer')
export default class App {
  constructor () {
    this[index] = 0
    this[isRunTransfer] = false
    this.bgmPlaying = false
    this.shareCovar = null
    this.loadingDom = new LoadingDom()
  }
  initPages () {
    return [
      new C1(),
      new C2(),
      new C3(),
      new C4(),
      new C5(),
      new C6(),
      new C7(),
      new C8(),
      new EndPart()
    ]
  }
  async init () {
    const arrPage = this.initPages()
    this.audio = new BgmAudio()
    const stage = this.initStage()
    const stageView = stage.getStage()
    const gap = {
      x: stage.getGapDistanceX(),
      y: stage.getGapDistanceY()
    }
    await this.loadAsset(arrPage)
    await this.pageReady(arrPage, gap)
    this.initScrollEvent(stage, arrPage, gap)
    this[isRunTransfer] = true
    await arrPage[this[index]].show(stageView, gap, 'top')
    this[isRunTransfer] = false
  }
  async showNextPage (arrPage, stageView, gap) {
    this[isRunTransfer] = true

    if (!arrPage[this[index]].isLastPage) {
      await arrPage[this[index]].runNextTransfer(stageView, gap)
      this[index] += 1
      await Promise.all([
        arrPage[this[index]].show(stageView, gap, 'top'),
        arrPage[this[index] - 1].hideTransferOfApp(gap)
      ])
    } else {
      await Promise.all([
        arrPage[this[index]].hideCard(-Global.needScrollDistance, -(Global.height + gap.y / 2)),
        arrPage[this[index] + 1].show(stageView, gap, 'top')
      ])
      this[index] += 1
    }

    this[isRunTransfer] = false

    if (arrPage[this[index]].name === 'c4') {
      await this.showNextPage(arrPage, stageView, gap)
    }
  }
  async showPerPage (arrPage, stageView, gap) {
    this[isRunTransfer] = true
    if (arrPage[this[index]].name === 'endPart') {
      await Promise.all([
        arrPage[this[index] - 1].show(stageView, gap, 'bottom'),
        arrPage[this[index]].show(stageView, gap, 'bottom')
      ])
    } else {
      await Promise.all([
        arrPage[this[index]].runPerTransfer(stageView, gap),
        arrPage[this[index] - 1].show(stageView, gap, 'bottom')
      ])
    }
    this[index] -= 1
    this[isRunTransfer] = false

    if (arrPage[this[index]].name === 'c4') {
      await this.showPerPage(arrPage, stageView, gap)
    }
  }
  initScrollEvent (stage, pages, gap) {
    const pagesLength = pages.length
    const stageView = stage.getStage()
    new MyScroller(stage.getRealStage()).on('top', (top) => {
      if (this[isRunTransfer]) return
      const distance = top.detail
      if (distance > Global.needScrollDistance && this[index] < pagesLength - 1) { // 播放下一个
        this.showNextPage(pages, stageView, gap)
      } else if (distance < -Global.needScrollDistance && this[index] > 0) { // 播放上一个
        this.showPerPage(pages, stageView, gap)
      } else {
        pages[this[index]].moveView({
          y: -distance
        })
      }
    })
  }
  showEndPart (stageView, pages, gap) {
    this[isRunTransfer] = true
    const lastView = pages[this[index]]
    var startY = Global.height + gap.y
    var endY = gap.y / 2 + (Global.height - this.endPart.height)

    Promise.all([
      lastView.hideCard(-Global.needScrollDistance, -this.endPart.height, true),
      this.endPart.show(startY, endY, stageView)
    ]).then(() => {
      document.getElementById('app').addEventListener('touchstart', () => {
        Promise.all([
          lastView.showCard(-this.endPart.height, -Global.needScrollDistance, stageView, true),
          this.endPart.show(endY, startY, stageView)
        ]).then(() => {
          this[isRunTransfer] = false
        })
      }, {
        once: true
      })
    })
  }
  loadAsset (arrPage) {
    this.loadingDom.show()
    let timer = null
    return new Promise((resolve, reject) => {
      const loader = new Loader()
      if (timer) clearInterval(timer)
      timer = setInterval(() => {
        this.loadingDom.updateRate(loader.getRate())
      }, 150)
      loader.collect(Card.getCommonAsset())
      arrPage.map(p => {
        loader.collect(p.getSingleAsset())
      })
      loader.on('complete', () => {
        clearInterval(timer)
        this.loadingDom.hide()
        resolve()
      })
      loader.start()
    })
  }
  async pageReady (arrPage, gap) {
    await Promise.all(arrPage.map(page => {
      return page.ready(gap)
    }))
  }
  initStage () {
    return new Stage({
      sandwich: new Bg()
    })
  }
}
