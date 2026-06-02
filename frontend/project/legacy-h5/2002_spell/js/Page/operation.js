import $ from '$'
import Hilo from 'hilo'
import Question from '../Class/Question'

const $domOperation = $('#operation')
const $domQuestion = $('#operation .subject .question')
const $domBtn = $('#operation .btn')
const $domResult = $('#operation .result')
class Operation {
  constructor (user) {
    this.user = user
    this.question = new Question()
    this.timer = null
    this.tipTimer = null
    this.bindEventSubmit()
    this.bindEventButton()
    this.bindEventOption()
  }
  async show () {
    await this.question.init(this.user.id)
    this.nextQuestion()
    $('.bg').removeClass('bg-operation-failed')
    $domOperation.addClass('normal')
    $domOperation.removeClass('failed')
    $domOperation.show()
  }
  hide () {
    $domOperation.hide()
  }
  initQuestion (info) { // 初始化题目
    $domQuestion.children('.option').removeClass('selected')
    info['choice'].forEach((infoItem, index) => {
      const dom = $domQuestion.children('.option')[index]
      $(dom).data('key', infoItem['key'])
      $(dom).text(infoItem['value'])
    })
  }
  initCutDown () { // 初始化计时器
    const $timeDom = $('#operation .subject .time')
    const rightNum = this.question.getRightNum()
    let count
    if (rightNum <= 50) {
      count = 60
    } else if (rightNum <= 100) {
      count = 50
    } else {
      count = 25
    }
    $timeDom.text(count)
    if (this.timer) clearInterval(this.timer)
    this.timer = setInterval(() => {
      if (count < 1) {
        this.gameOver('isCutDown')
      } else {
        $timeDom.text(--count)
      }
    }, 1000)
  }
  bindEventButton () { // 绑定各个按钮事件
    $domOperation.children('.again').on('click', () => {
      this.show()
    })
    $domOperation.children('.rank').on('click', () => {
      this.fire('rankBtnOnClick', this.question)
    })
  }
  bindEventSubmit () { // 绑定提交事件
    $domBtn.on('click', () => {
      // 处理错误下的点击
      if ($domOperation.hasClass('failed')) {
        this.fire('failedBtnClick')
      }
      // 处理正常提交
      $('#operation .btn').removeClass('tip')
      if (this.tipTimer) clearTimeout(this.tipTimer)
      const selectedArr = $domQuestion.children('.selected')
      if (!$domOperation.hasClass('normal') || selectedArr.length !== 3) return
      const answerArr = selectedArr.map((index, item) => {
        return $(item).data('key')
      })
      const inputResult = Array.prototype.join.call(answerArr)
      const res = this.question.verify(this.user.id, this.question.getNowQuestionId(), inputResult)
      res.then((data) => {
        $domResult.text(data.data)
        $('#operation .explain .answer').text(data.data)
        data.result ? this.gameWin() : this.gameOver()
      }, (e) => {
        console.log(e)
      })
    })
  }
  bindEventOption () { // 绑定选项事件
    $domQuestion.children('.option').on('click', (params) => {
      if (this.tipTimer) clearTimeout(this.tipTimer)
      const arrSelected = $domQuestion.children('.selected')
      const target = params.target
      const isSelected = $(target).hasClass('selected')
      if (!isSelected && (arrSelected.length < 3)) {
        $(target).addClass('selected')
      } else if (isSelected) {
        $(target).removeClass('selected')
      } else if (arrSelected.length === 3) {
        console.info('当前已选择三个')
      }
      if ($domQuestion.children('.selected').length === 3) {
        this.tipTimer = setTimeout(() => {
          $('#operation .btn').addClass('tip')
          clearTimeout(this.tipTimer)
        }, 5000)
      }
    })
  }
  nextQuestion () { // 下一道题目
    try {
      const questionInfo = this.question.next()
      $('#operation .subject .count span').text(this.question.getRightNum())
      this.initQuestion(questionInfo)
      // 初始化倒计时
      this.initCutDown()
    } catch (error) {
      if (error.message === 'no question') { // 全部题目已答完
        this.fire('rankBtnOnClick')
      }
    }
  }
  gameOver (flag) { // 游戏结束
    clearInterval(this.timer)
    $('.bg').addClass('bg-operation-failed')
    $domOperation.removeClass('normal')
    $domOperation.addClass('failed')
    if (flag === 'isCutDown') {
      this.question.verify(this.user.id, this.question.getNowQuestionId(), 'cutDown').then((data) => {
        $('#operation .explain .answer').text(data.data)
        $domResult.text(data.data)
      })
    }
  }
  gameWin () { // 题目胜利, 下一题
    clearInterval(this.timer)
    $domOperation.removeClass('normal')
    $domOperation.addClass('success')
    setTimeout(() => {
      $domOperation.removeClass('success')
      $domOperation.addClass('normal')
      this.nextQuestion()
    }, 2000)
  }
}

Hilo.Class.mix(Operation.prototype, Hilo.EventMixin)
export default Operation
