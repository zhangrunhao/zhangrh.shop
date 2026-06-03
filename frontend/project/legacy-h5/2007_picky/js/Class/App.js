/**
 * 程序核心, 拼接所有
 */
import $ from '$'
import Loader from './Loader'
import Stage from './Stage'

import LoadPage from '../Page/Load/Load'
import TransPage from '../Page/Trans/index'
import SelectPage from '../Page/Select/index'
import AddPage from '../Page/Add/Add'
import ResultPage from '../Page/Result/Result'
import AlertPage from '../Page/Alert/index'
import {
  getRandomNumBoth
} from '../../../legacy/utils/legacy-utils.js'

export default class App {
  constructor () {
    this.bgm = new Audio(new URL('./asset/bgm.mp3', window.location.href).href)
    this.bgm.loop = true
    document.getElementById('app').addEventListener('click', () => {
      this.bgm.play()
    }, {
      once: true
    })
    this.name = 'picky'

    this.loader = new Loader()
    this.stage = new Stage()

    this.loadPage = new LoadPage()
    this.loader.collect(this.loadPage.asset)

    this.transPage = new TransPage()
    this.transPage.on('go', () => {
      $('#app canvas').remove()
      this.stage = new Stage()

      this.selectPage.ready()
      this.addPage.ready()
      this.alertPage.ready()

      this.transPage.hide()
      this.selectPage.show(this.stage.getStage())
    })
    this.loader.collect(this.transPage.asset)

    this.selectPage = new SelectPage()
    this.selectPage.on('complete', (selectOptions) => {
      this.alertPage.on('done', () => {
        if (this.addPageIsShow) return
        this.addPageIsShow = true

        this.alertPage.hide()
        this.selectPage.hide()
        this.addPage.show(this.stage.getStage(), selectOptions.detail)
      })
      this.alertPage.show(this.stage.getStage())
    })
    this.loader.collect(this.selectPage.asset)

    this.addPage = new AddPage()
    this.addPageIsShow = false
    this.addPage.on('submit', (customOptions) => {
      this.addPage.hide().then(() => {
        this.stage.hide()
      })
      this.resultPage.show({
        fruit: this.selectPage.fruit.selectedOptions,
        other: this.selectPage.other.selectedOptions,
        meat: this.selectPage.meat.selectedOptions,
        vegetable: this.selectPage.vegetable.selectedOptions,
        custom: customOptions.detail
      }, this.userInfo)
    })
    this.loader.collect(this.addPage.asset)

    this.resultPage = new ResultPage()
    this.loader.collect(this.resultPage.asset)

    this.alertPage = new AlertPage()
    this.loader.collect(this.alertPage.asset)
  }
  init () {
    this.userInfo = {
      nickName: '本地玩家',
      avatar: null
    }

    let timer
    $('#app').append(this.loadPage.render())
    this.loader.on('complete', () => {
      // 判断存在用户信息, 却没有头像
      if (!this.userInfo) this.userInfo = {}
      if (!this.userInfo.avatar) {
        this.userInfo.avatar = this.resultPage.asset.getContent(`avatar/${getRandomNumBoth(1, 6)}.png`)
      }
      // 停止计时
      if (timer) clearInterval(timer)
      this.loadPage.setRate('100.00%')

      // 所有图片加载完成
      this.transPage.ready()

      this.loadPage.hide()
      $('#app canvas').show()

      // 开发过渡页/选择页
      this.transPage.show(this.stage.getStage())
      // this.selectPage.show(this.stage.getStage())

      // 开发补充页
      // this.addPage.show(this.stage.getStage(), [{
      //   image: this.selectPage.asset.getContent('fruit/8.png'),
      //   name: '螺蛳粉'
      // }, {
      //   image: this.selectPage.asset.getContent('fruit/1.png'),
      //   name: '有籽水果'
      // }, {
      //   image: this.selectPage.asset.getContent('fruit/2.png'),
      //   name: 'bbb'
      // }, {
      //   image: this.selectPage.asset.getContent('fruit/3.png'),
      //   name: 'bbb'
      // }, {
      //   image: this.selectPage.asset.getContent('fruit/4.png'),
      //   name: 'bbb'
      // }, {
      //   image: this.selectPage.asset.getContent('fruit/5.png'),
      //   name: 'bbb'
      // }])
    })
    timer = setInterval(() => {
      this.loadPage.setRate(this.loader.getRate())
    }, 100)
    this.loader.start()
  }
}
