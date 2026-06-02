import $ from '$'
import Hilo from 'hilo'
import {
  getRandomNumBoth,
  toPercent
} from '../../../legacy/utils/legacy-utils.js'
class Result {
  constructor () {
    $('#result .again').on('click', () => {
      this.fire('againBtnOnClick')
    })
  }
  show (questionObj) {
    const rightNum = questionObj.getRightNum()
    let ratio
    if (rightNum < 15) {
      ratio = toPercent(getRandomNumBoth(2377, 2523) / 10000)
    } else if (rightNum < 30) {
      ratio = toPercent(getRandomNumBoth(1877, 2023) / 10000)
    } else if (rightNum < 50) {
      ratio = toPercent(getRandomNumBoth(1377, 1523) / 10000)
    } else if (rightNum < 70) {
      ratio = toPercent(getRandomNumBoth(877, 1023) / 10000)
    } else if (rightNum < 90) {
      ratio = toPercent(getRandomNumBoth(377, 523) / 10000)
    } else if (rightNum < 116) {
      ratio = toPercent(getRandomNumBoth(50, 123) / 10000)
    } else {
      ratio = 0
    }
    const html = `
      <h2 class="title">恭喜!</h2>
      <p>你连续答对了<span class="mark">${questionObj.getRightNum()}</span>题</p>
      <p>超过了<span class="mark">${(questionObj.nowArr.length / questionObj.all.length).toFixed(2)}%</span>的玩家</p>
      <p>但你已经遗忘了<span class="mark">${ratio}</span>的汉字书写</p>
      <p>汉字是我们的母语,</p>
      <p>请不要忘记它</p>`
    $('#result .stage').html(html)
    $('.bg').addClass('bg-result')
    $('#result').show()
  }
  hide () {
    $('.bg').removeClass('bg-result')
    $('#result').hide()
  }
}

Hilo.Class.mix(Result.prototype, Hilo.EventMixin)
export default Result
