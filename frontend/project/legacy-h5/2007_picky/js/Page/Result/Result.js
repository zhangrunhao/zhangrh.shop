/**
 * 结果页
 */
import $ from '$'
import Hilo from 'hilo'
import Page from '../../Class/Page'
import asset from './asset'
import BScroll from '@better-scroll/core'
import Handlebars from 'handlebars'

import resultTemplateSource from './Result.hbs?raw'
import './Result.less'
import {
  winWidth,
  getWinHeight
} from '../../Class/Global'
import {
  getRandomElementFromArray,
  getRandomNumBoth
} from '../../../../legacy/utils/legacy-utils.js'
import descArrayInfo from '../../Info/desc.json'

const ResultHbs = Handlebars.compile(resultTemplateSource)

export default class Result extends Page {
  constructor () {
    super()
    this.asset = asset
    this.needAddHeight = false
    this.addHeight = 0
  }
  initStage (stageHeight, options, userInfo, isNoneOption) {
    const stage = new Hilo.Stage({
      container: $('#Result')[0],
      scaleX: innerWidth / winWidth,
      scaleY: innerHeight / stageHeight,

      width: winWidth,
      height: stageHeight
    })

    var ticker = this.ticker = new Hilo.Ticker(20)
    ticker.addTick(stage)
    ticker.start()

    this.drawGridBg(stageHeight).addTo(stage)

    if (userInfo.avatar) {
      new Hilo.Bitmap({
        x: 36 + 42,
        y: 146 + 24,
        width: 137,
        height: 137,
        image: userInfo.avatar
      }).addTo(stage)
    } else {
      new Hilo.Bitmap({
        x: 36 + 42,
        y: 146 + 24,
        width: 137,
        height: 137,
        image: asset.getContent(`avatar/${getRandomNumBoth(1, 6)}.png`)
      }).addTo(stage)
    }

    new Hilo.Bitmap({
      x: 36,
      y: 146,
      image: asset.getContent('avatar-outer.png')
    }).addTo(stage)

    if (userInfo.nickName) {
      new Hilo.Text({
        x: 36 + 42,
        y: 146 + 24 + 137 + 10,
        width: 137,
        textAlign: 'center',
        textVAlign: 'middle',
        font: `21px arial`,
        text: userInfo.nickName
      }).addTo(stage)
    }

    new Hilo.Bitmap({
      image: asset.getContent('logo.png')
    }).addTo(stage)

    new Hilo.Bitmap({
      x: 257.5,
      y: 146,
      image: asset.getContent('title.png')
    }).addTo(stage)

    new Hilo.Bitmap({
      x: 36,
      y: 350,
      image: asset.getContent((isNoneOption ? 'no-counter.png' : 'counter.png'))
    }).addTo(stage)

    new Hilo.Bitmap({
      x: 548,
      y: 350,
      image: asset.getContent('code-outer.png')
    }).addTo(stage)

    new Hilo.Bitmap({
      x: 72,
      y: 525,
      image: asset.getContent('line.png')
    }).addTo(stage)

    if (!isNoneOption) {
      this.drawNumber(options, stage)
      this.drawOptions(options, stage)
      this.drawBottomDesc(options, stage, stageHeight)
    } else {
      this.drawNoneOption(stage)
      this.drawNoneBottomDesc(stage)
    }
    return stage
  }
  drawNoneOption (stage) {
    const h = getWinHeight() - 533 - 125
    const c = new Hilo.Container({
      x: (winWidth - 678) / 2,
      y: 533,
      width: 678,
      height: h
    })

    new Hilo.Bitmap({
      image: asset.getContent(`no-top-white.png`)
    }).addTo(c)

    new Hilo.Container({
      background: '#fff',
      y: 32,
      width: 678,
      height: h - 32
    }).addTo(c)

    new Hilo.Bitmap({
      align: Hilo.align.CENTER,
      image: asset.getContent('no-404.png')
    }).addTo(c)

    c.addTo(stage)
  }
  drawNumber (options, stage) {
    let num = 0
    Object.keys(options).map(key => {
      num += options[key].length
    })
    const fontSize = (num >= 100 ? 80 : 120)
    const c = new Hilo.Container({
      x: 340,
      y: 395,
      width: 135,
      height: 130
    }).addTo(stage)
    new Hilo.Text({
      width: 135,
      height: 110,
      textAlign: 'center',
      textVAlign: 'middle',
      color: '#FFDE55',
      font: `${fontSize}px arial`,
      text: String(num)
    }).addTo(c)
  }
  drawGridBg (height) {
    const w = winWidth
    const h = height
    const c = new Hilo.Container({
      width: w,
      height: h
    })
    for (var row = 0; row <= Math.ceil(h / 29); row++) {
      new Hilo.Bitmap({
        y: row * 29,
        image: this.asset.getContent('bg.png')
      }).addTo(c)
    }
    return c
  }
  drawBottomDesc (options, stage, stageHeight) {
    const c = new Hilo.Container({
      width: 750,
      height: 125,
      y: stageHeight - 125
    })
    new Hilo.Bitmap({
      width: 750,
      height: 125,
      image: asset.getContent('text.png')
    }).addTo(c)

    let text
    const individuality = Object.keys(descArrayInfo.individuality)
    Object.keys(options).map(key => {
      options[key].map(item => {
        var res = individuality.find(indivi => (indivi === item.name))
        if (res) {
          text = descArrayInfo.individuality[res]
        }
      })
    })
    if (!text) {
      text = getRandomElementFromArray(descArrayInfo.common)
    }
    new Hilo.Text({
      x: 152,
      width: 750,
      height: 135,
      maxWidth: 750,
      color: '#fff',
      textVAlign: 'middle',
      font: '30px arial',
      text
    }).addTo(c)

    c.addTo(stage)
  }
  drawNoneBottomDesc (stage) {
    const c = new Hilo.Container({
      width: 750,
      height: 487,
      y: getWinHeight() - 487
    })
    new Hilo.Bitmap({
      width: 750,
      height: 487,
      image: asset.getContent('no-text.png')
    }).addTo(c)

    new Hilo.Text({
      x: 152,
      y: 487 - 125,
      width: 750,
      height: 135,
      maxWidth: 750,
      color: '#fff',
      textVAlign: 'middle',
      font: '30px arial',
      text: getRandomElementFromArray(descArrayInfo.common)
    }).addTo(c)
    c.addTo(stage)
  }
  getRealColor (type) {
    switch (type) {
      case 'fruit':
        return '#feedcf'
      case 'meat':
        return '#fef8d6'
      case 'vegetable':
        return '#e2f5e1'
      case 'other':
        return '#e6dbfd'
    }
  }
  drawOptions (options, stage) {
    let localY = 533
    // 确定展示顺序
    let keyArray = ['fruit', 'vegetable', 'meat', 'other']
    let isFirst = true
    keyArray.map(key => {
      if (options[key].length <= 0) return
      const row = Math.ceil(options[key].length / 4)
      let optionHeight = 100 + row * 168 + 50
      if (this.needAddHeight) optionHeight += this.addHeight
      // 外框
      const c = new Hilo.Container({
        x: (winWidth - 678) / 2,
        y: localY,
        width: 678,
        height: optionHeight
      })

      if (isFirst) {
        // 添加一个圆角框
        new Hilo.Bitmap({
          image: asset.getContent(`top-${key}.png`)
        }).addTo(c)
        new Hilo.Container({
          background: this.getRealColor(key),
          y: 32,
          width: 678,
          height: optionHeight - 32
        }).addTo(c)
        isFirst = false
      } else {
        // 纯色
        new Hilo.Container({
          background: this.getRealColor(key),
          width: 678,
          height: optionHeight
        }).addTo(c)
      }

      localY += c.height

      // 标志
      new Hilo.Bitmap({
        x: 22,
        y: 15,
        image: this.asset.getContent(`icon-${key}.png`)
      }).addTo(c)

      // 每一个项目
      options[key].map((item, index) => {
        var itemCol = index % 4
        var itemRow = Math.floor(index / 4)
        const itemContainer = new Hilo.Container({
          width: 125,
          height: 168,
          x: itemCol * 155 + 46,
          y: itemRow * 165 + 100
        }).addTo(c)

        new Hilo.Graphics({
          width: 125,
          height: 125
        })
          .beginFill('#fff')
          .drawEllipse(0, 0, 125 - 1, 125)
          .endFill()
          .addTo(itemContainer)

        new Hilo.Bitmap({
          width: 125,
          height: 125,
          image: item.image
        }).addTo(itemContainer)

        new Hilo.Text({
          width: 125,
          y: 135,
          textAlign: 'center',
          font: '20px arial',
          text: item.name
        }).addTo(itemContainer)
      })

      c.addTo(stage)
    })
  }
  show (options, userInfo) {
    const self = this
    // 自定义的加到其他上面
    options.other = options.other.concat(options.custom)
    if (options.custom) delete options.custom

    const stageHeight = this.getHeightForOptions(options)
    const isNoneOption = this.judgeIsNoneOption(options)
    this.renderHtml()
    const stage = this.initStage(stageHeight, options, userInfo, isNoneOption)

    this.ticker.nextTick(() => {
      $('#Result canvas').hide()
      $('#Result img')[0].src = stage.canvas.toDataURL()
      $('#Result img')[0].onload = function () {
        new BScroll($('#Result .wrapper')[0], {
          click: true,
          probeType: 3,
          bounce: false,
          scrollY: true
        })
        // 出现提示
        self.showSaveTip()
      }
    })
  }
  showSaveTip () {
    $('.save-tip').addClass('save-in')
    setTimeout(() => {
      $('.save-tip').addClass('save-out')
    }, 1500 + 3000)
  }
  renderHtml () {
    var html = ResultHbs()
    $(html).appendTo($('#app'))
  }
  getHeightForOptions (options) {
    let height = 533
    let validNum = 0
    Object.keys(options).map(key => {
      if (options[key].length === 0) return
      validNum += 1
      height += 100
      const row = Math.ceil(options[key].length / 4)
      height += (row * 168)
      height += 50
    })

    height += 125 // 文字描述

    if (height < getWinHeight()) { // 计算是否需要补充高度, 每一个补充多少.
      this.needAddHeight = true
      this.addHeight = (getWinHeight() - height) / validNum
      height = getWinHeight()
    }
    return height
  }
  judgeIsNoneOption (options) {
    let flag = true
    Object.keys(options).forEach(key => {
      if (options[key] instanceof Array && options[key].length !== 0) {
        flag = false
      }
    })
    return flag
  }
}
