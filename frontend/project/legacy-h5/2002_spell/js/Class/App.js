import Login from './Login'
import Prelude from './Prelude'
import Home from '../Page/home'
import Operation from '../Page/operation'
import Rank from '../Page/rank'
import Result from '../Page/result'

export default class app {
  constructor () {
    this.login = new Login()
  }
  async init () {
    const user = await this.login.startLogin()
    // const user = {
    //   id: 'oYnVus-QhEqJKkTZyoUXueGFfjUg'
    // }
    this.pre = new Prelude()
    this.home = new Home(user, this.login)
    this.operation = new Operation(user)
    this.rank = new Rank(user)
    this.result = new Result(user)

    await this.pre.show()
    this.home.show()

    // 监听home页事件
    this.home.on('startBtnOnClick', () => { // 跳转开始页
      this.home.hide()
      this.operation.show()
    })
    this.home.on('rankBtnOnClick', () => { // 跳转排行榜
      this.home.hide()
      this.rank.show()
    })

    // 监听operation
    this.operation.on('rankBtnOnClick', (questionObj) => { // 跳转排行榜
      this.operation.hide()
      this.result.show(questionObj.detail)
    })
    this.operation.on('failedBtnClick', () => { // 点击失败按钮, 跳转主页
      this.operation.hide()
      this.home.show()
    })

    // 监听结果页
    this.result.on('againBtnOnClick', () => { // 再来一次
      this.result.hide()
      this.operation.show()
    })

    // 监听排行榜
    this.rank.on('againBtnOnClick', () => { // 再来一次
      this.rank.hide()
      this.operation.show()
    })
  }
}
