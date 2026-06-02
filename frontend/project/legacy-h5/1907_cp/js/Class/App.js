/* eslint-disable no-debugger */
// 整合所有
import {
  isFunc
} from '../../../legacy/utils/legacy-utils.js'

import Loader from './Loader'
import Stage from './Stage'
import Global from './Global'
import LoadingDom from './LoadingDom'
import getResult from '../Func/getResult'
import getInfo from '../Func/getInfo'

import Topic1 from '../pages/topic1/index'
import Long from '../pages/long/index'
import Topic2 from '../pages/topic2/index'
import Topic3 from '../pages/topic3/index'
import Topic4 from '../pages/topic4/index'
import Topic5 from '../pages/topic5/index'
import Info from '../pages/information/index'
import Share from '../pages/share/index'

export default class App {
  constructor () {
    this.delayTime = 1500
    this.animationTime = 1000
    this.audio = document.getElementById('audio')
    this.answer = []
    this.nowPageIndex = 0
    this.pages = []
    this.stage = null
  }
  initNeedAssetPages () {
    return [
      new Topic1({
        delayTime: 1000
      }),
      new Long({
        audio: this.audio
      }),
      new Topic2({
        delayTime: 1800,
        audio: this.audio
      }),
      new Topic3({
        audio: this.audio
      }),
      new Topic4({
        delayTime: 4000
      }),
      new Topic5({
        delayTime: 1800,
        audio: this.audio
      }),
      new Info(),
      new Share()
    ]
  }
  init () {
    const loading = new LoadingDom()
    loading.show()
    const stage = this.stage = new Stage()
    const pages = this.pages = this.initNeedAssetPages(stage)
    pages.forEach(p => {
      if (isFunc(p.on)) {
        p.on('chooseAnswer', this.chooseAnswer.bind(this))
        p.on('next', this.next.bind(this))
        p.on('submit', this.onSubmit.bind(this))
      }
    })
    loading.on('clickStartBtn', () => {
      loading.hide()
      this.toShowPage(0)
    })
    this.loaderAsset(pages, loading, (rate) => {
      pages.forEach(p => {
        isFunc(p.ready) && p.ready()
      })
      loading.showCoverImg()
    })
  }
  onSubmit (submitInfo) {
    const time = 500
    const instance = submitInfo.detail.instance
    const info = submitInfo.detail.info
    const num = getResult(this.answer, info)
    const text = getInfo({
      num,
      ...info
    })
    instance.end(time, () => {
      const img = new Image()
      if (Global.crossOrigin) {
        img.crossOrigin = 'Anonymous'
      }
      img.src = `${Global.publicPath}/share/${info.gender}/${num}/${text.id}.png?t=${Global.timeStamp}`
      img.addEventListener('load', () => {
        instance.loadSprite.removeFromParent()
        ++this.nowPageIndex && this.toShowPage(time, {
          img,
          name: info.name,
          content: text.content
        })
      })
    })
  }
  toShowPage (time, info, cb) {
    this.pages[this.nowPageIndex].show(this.stage, time, info)
  }
  chooseAnswer (answer) { // 选择了答案
    const instance = answer.detail.instance
    const delayTime = typeof instance.delayTime === 'number' ? instance.delayTime : this.delayTime
    const animationTime = typeof instance.animationTime === 'number' ? instance.animationTime : this.animationTime
    instance.off('chooseAnswer')
    this.storeAnswer({
      topic: answer.detail.topic,
      answer: answer.detail.answer
    })
    setTimeout(() => {
      instance.end(animationTime)
      // 开始执行下一个.
      this.nowPageIndex++
      this.toShowPage(animationTime)
    }, delayTime)
  }
  storeAnswer (answerItem) { // 存储
    this.answer.push(answerItem)
  }
  next (params) { // 执行下一个
    const instance = params.detail.instance
    const animationTime = typeof instance.animationTime === 'number' ? instance.animationTime : this.animationTime
    instance.off('next')
    instance.end(animationTime)
    this.nowPageIndex++
    this.toShowPage(animationTime)
  }
  loaderAsset (pages, loadingDom, cb) {
    let timer
    const loader = new Loader()
    pages.forEach(p => {
      loader.collect(p.asset)
    })
    if (timer) clearInterval(timer)
    timer = setInterval(() => {
      loadingDom.updateRate(loader.getRate())
    }, 10)
    loader.on('complete', () => {
      if (timer) clearInterval(timer)
      cb()
    })
    loader.start()
    return loader
  }
}
