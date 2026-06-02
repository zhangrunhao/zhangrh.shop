import {
  getAllQuestion,
  getVerifyAnswer
} from '../Class/Api'
import {
  getRandomNumBoth
} from '../../../legacy/utils/legacy-utils.js'
export default class Question {
  constructor () {
    this.all = []
  }
  async init (userId) {
    this.all = await getAllQuestion(userId)
    this.nowArr = this.all.concat() // 当前数组
    this.nowQuestion = null
  }
  next () {
    if (this.nowArr.length > 0) {
      const randomNum = getRandomNumBoth(0, this.nowArr.length - 1)
      this.nowQuestion = this.nowArr.splice(randomNum, 1)[0]
      return this.nowQuestion
    } else {
      throw new Error('no question')
    }
  }
  getNowQuestionId () {
    return this.nowQuestion.no
  }
  getRightNum () {
    return this.all.length - this.nowArr.length - 1
  }
  async verify (userId, num, res) {
    const answer = await getVerifyAnswer(userId, num, res)
    return answer
  }
}
