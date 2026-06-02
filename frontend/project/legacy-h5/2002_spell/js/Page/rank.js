import $ from '$'
import Hilo from 'hilo'
import BScroll from '@better-scroll/core'
import {
  getRankList
} from '../Class/Api'

class Rank {
  constructor (user) {
    this.user = user
    this.checkTimer = null
    $('#rank .again').on('click', () => {
      this.fire('againBtnOnClick')
    })
  }
  async show () {
    await this.initRankDom()
    this.initScroll()
    $('.bg').addClass('bg-rank')
    $('#rank').show()
  }
  initScroll () {
    if (this.checkTimer) clearTimeout(this.checkTimer)
    const initBS = function () {
      const bs = new BScroll(document.getElementById('ScrollWrapper'), {
        click: true,
        probeType: 3,
        scrollY: true
      })
      console.log(bs)
    }
    this.checkTimer = setTimeout(() => {
      if (this.checkTimer) clearTimeout(this.checkTimer)
      const height = $('#ScrollWrapper .list')[0].clientHeight
      if (height > 0) {
        initBS()
      } else {
        this.initScroll()
      }
    }, 500)
  }
  async initRankDom () {
    const data = await getRankList(this.user.id)
    const list = data.data
    let rankNum = data.rank
    const fragment = document.createDocumentFragment()
    if (rankNum < 0) {
      rankNum = '未上榜'
      $('#rank .title').css('fontSize', '.66rem')
    }
    $('#rank .title .right').text(rankNum)
    list.forEach((item, index) => {
      let num = index + 1
      num = (num < 10) ? `0${num}` : num
      const li = document.createElement('li')
      li.className = 'item'
      const html = `<div class="avatar">
                      <img class="inner" src="${item.headUrl}">
                    </div>
                    <div class="name">${item.realName}</div>
                    <div class="score">${item.score}分</div>
                    <div class="line"></div>
                    <div class="num">${num}</div>`
      li.innerHTML = html
      fragment.appendChild(li)
    })
    $('#rank .stage .list').empty().append(fragment)
  }
  hide () {
    $('.bg').removeClass('bg-rank')
    $('#rank').hide()
  }
}

Hilo.Class.mix(Rank.prototype, Hilo.EventMixin)
export default Rank
