import $ from '$'
import Global from '../Class/Global'
import ShareStage from '../Area/ShareStage'

export default class Share {
  constructor () {
    this.shareStage = null // 分享展示舞台
    this.init()
  }
  init () {
    Global.bus.on('gotoSharePage', e => {
      this.shareStage = new ShareStage(e.detail)
      $('#share').show()
    })
  }
}
