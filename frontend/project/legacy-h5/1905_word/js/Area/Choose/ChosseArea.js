import Hilo from 'hilo'
import Global from '../../Class/Global'
import Info from '../../Class/Info'
import ChooseRadical from './ChosseRadical'
import ChooseCheckButton from './ChooseCheckButton'
export default class ChooseArea {
  constructor (info) {
    const that = this
    this.info = info
    this.content = new Hilo.Container({
      width: Global.width,
      height: 500
    })
    this.choosedBtns = [] // 当前被选中的文本.
    this.btnMap = [] // 按钮view的集合, 包含info信息
    this.confirmBtn = new ChooseCheckButton() // 确定按钮
    this.confirmBtn.content
      .addTo(this.content)
      .on(Hilo.event.POINTER_START, function () {
        that.confirmBtn.toLoadStyle()
        Global.bus.fire('confirmResult')
      })
  }
  /**
   * 重置
   */
  reset () {
    this.confirmBtn.sotpLoad()
    this.choosedBtns.forEach(i => {
      i.status = 'outGame'
      i.recoverHeight()
    })
    this.choosedBtns = []
  }
  /**
   * 初始化按钮
   */
  initTextBtn () {
    const BtnInfo = new Info.Radical().getDetail()
    this.btnMap = BtnInfo.map(btn => {
      let x, y
      if (btn.index < 5) {
        x = btn.index * 124 + 70
        y = (btn.index + 1) % 2 === 0 ? 910 : 942
      } else {
        x = (btn.index - 5) * 124 + 70
        y = (btn.index - 5 + 1) % 2 === 0 ? 910 + 154 : 942 + 154
      }
      const radical = new ChooseRadical(btn, x, y, this.info)
      radical.content.addTo(this.content)
      radical.showBeginAnimate(() => {
        radical.content.on(Hilo.event.POINTER_START, this.clickBtn.bind(this, radical))
      })
      return radical
    })
  }
  /**
   * 点击按钮
   * @param {Object} btn 点击的按钮信息
   */
  clickBtn (btn) {
    if (btn.status === 'inGame' || this.choosedBtns.length > 2) return
    this.btnMap.forEach(radical => {
      if (btn.id === radical.id) {
        radical.status = 'inGame'
        radical.toActive()
      }
    })
    this.choosedBtns.push(btn) // 保存已选择文本
    Global.bus.fire('chooseRadicalEvent', btn)
  }
  /**
   * 取消选中的按钮
   * @param {Radical} btnInstance 游戏区的按钮实例
   */
  removeRadicalFromGame (btnInstance) {
    btnInstance = btnInstance.detail
    this.choosedBtns = this.choosedBtns.filter(item => { // 当前选中的筛出去
      return item.id !== btnInstance.info.id
    })
    this.btnMap.forEach(radical => {
      if (btnInstance.info.id === radical.id) {
        radical.status = 'outGame'
        radical.recoverHeight()
      }
    })
  }
  /**
   * 渲染函数
   * @param {Hilo.View} parentContainer 需要渲染的父容器
   */
  render (parentContainer) {
    this.initTextBtn()
    Global.bus.on('removeRadicalFromGame', this.removeRadicalFromGame.bind(this))
    this.content.addTo(parentContainer)
    return this
  }
}
