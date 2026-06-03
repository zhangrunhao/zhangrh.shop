// 游戏页面
import GameStage from '../Area/GameStage'
import Global from '../Class/Global'
export default class Game {
  constructor (info) {
    this.initStage(info)
  }
  initStage (info) {
    const stage = Global.gameStage = new GameStage(info)
    stage.render()
  }
}
