import Hilo from 'hilo'
import Global from '../../Class/Global'
import Result from '../../Info/Result'
import Radical from './DragRadical'
import RejectDialog from './rejectDialog'

export default class GameArea {
  constructor () {
    this.content = new Hilo.Container({
      width: 610,
      height: 610,
      x: 84,
      y: 128
    })
    new Hilo.Bitmap({
      alpha: 0.6,
      image: Global.asset.getAsset('game/bg/drag.png'),
      align: Hilo.align.CENTER
    }).addTo(this.content)
    this.result = new Result()
    this.radicalChild = [] // 游戏区上存在的偏旁实例
  }
  /**
   * 重置
   */
  reset () {
    this.radicalChild.forEach(i => {
      i.content.removeFromParent()
    })
    this.radicalChild = []
  }
  /**
   * 在游戏区生成一个按钮
   * @param {*} btn 按钮信息
   */
  produceRadical (btn) {
    this.cancleAllActive()
    this.radicalChild.push(new Radical(btn.detail).toActive().render(this.content))
  }
  cancleAllActive () {
    this.radicalChild.forEach(item => item.cancleActive())
  }
  activeRadical (btnInstance) {
    btnInstance = btnInstance.detail
    this.cancleAllActive()
    btnInstance.toActive()
    // 取出元素放到最上面
    btnInstance.content.removeFromParent().addTo(this.content)
  }
  removeRadicalFromGame (btnInstance) {
    btnInstance = btnInstance.detail
    this.radicalChild = this.radicalChild.filter(item => {
      return item.info.id !== btnInstance.info.id
    })
    btnInstance.content.removeFromParent()
  }
  /**
   * 判断结果是否正确
   * @param {Array} btns 当前页面上按钮实例的集合
   */
  confirmResult () {
    if (this.radicalChild.length < 2) {
      new RejectDialog('count').render(this.content)
      return
    }
    const res = this.result.checkCorrect(this.radicalChild)
    if (res.length > 0) { // 正常情况
      const rightMap = res.map(item => {
        const structureType = this.result.types[item.type]
        const position = this.getRadicalPosition(item)
        return {
          flag: this.result.checkPositionCorrect(structureType, position),
          item
        }
      })
      const right = rightMap.filter(i => {
        return i.flag
      })
      if (right.length > 0) {
        this.findRightResult(right[0].item)
      } else {
        new RejectDialog('wrong').render(this.content)
      }
    } else {
      new RejectDialog('wrong').render(this.content)
    }
  }
  /**
   * 找到正确结果
   * @param {Object} res 结果对象
   */
  findRightResult (res) {
    const assteMap = this.result.createShareAsset(res)
    const realMap = []
    Object.keys(assteMap).map(i => {
      if (assteMap[i] instanceof Array) {
        assteMap[i].forEach(ii => {
          realMap.push(`${ii}`)
        })
      } else {
        Object.keys(assteMap[i]).forEach(ii => {
          realMap.push(`${assteMap[i][ii]}`)
        })
      }
    })
    this.result.toLoadShareAsset(realMap, (queue) => {
      this.fireGoSharePage(res, assteMap, queue)
    })
  }
  fireGoSharePage (res, assteMap, queue) {
    Global.bus.fire('gotoSharePage', {
      info: res,
      asset: assteMap,
      queue
    })
  }
  /**
   * 获取当前各个偏旁部首的相对位置
   * @param {Object} 结果信息
   */
  getRadicalPosition (resInfo) {
    return this.radicalChild.map(ra => {
      return {
        x: ra.content.x + ra.content.width / 2,
        y: ra.content.y + ra.content.height / 2,
        id: ra.info.id,
        pos: resInfo.structure[ra.info.id]
      }
    })
  }
  render (parentContainer) {
    Global.bus.on('chooseRadicalEvent', this.produceRadical.bind(this))
    Global.bus.on('activeRadical', this.activeRadical.bind(this))
    Global.bus.on('removeRadicalFromGame', this.removeRadicalFromGame.bind(this))
    Global.bus.on('confirmResult', this.confirmResult.bind(this))
    this.content.addTo(parentContainer)
    return this
  }
}
