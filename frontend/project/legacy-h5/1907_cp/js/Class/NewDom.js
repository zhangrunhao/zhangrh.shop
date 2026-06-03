
const width = Symbol('w')
const height = Symbol('y')
const dom = Symbol('dom')
const storeStyle = Symbol('storeStyle')

export default class NewDom {
  constructor (domInstance, style) {
    this.setWidthAndHeight(750, 1464)
    if (!this.judgeDom(domInstance)) throw new Error('参数类型错误')
    this[dom] = domInstance // dom实例
    this[storeStyle] = {} // 存储所有变换的值

    Object.keys(style).forEach(key => {
      if (typeof style[key] === 'number') {
        this[storeStyle][key] = style[key] // 收集所有变化的值
      } else {
        this[dom].style[key] = style[key]
      }
    })
  }
  setWidthAndHeight (w, h) {
    if (typeof w === 'number' && typeof h === 'number') {
      this[width] = w
      this[height] = h
    } else {
      throw new Error('需要传入数字类型的宽高')
    }
    return this
  }
  judgeDom (obj) { // 判断是否为dom
    if (typeof HTMLElement === 'object') {
      return obj instanceof HTMLElement
    } else {
      return obj && typeof obj === 'object' && obj.nodeType === 1 && typeof obj.nodeName === 'string'
    }
  }
  listenChange () {
    let timer
    this.autoChange()
    window.addEventListener('orientationchange', () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        this.autoChange()
      }, 1500)
    })
    return this
  }
  fouceSetStyle (key, value) { // 强行更改属性
    this[dom].style[key] = value
  }
  autoChange () {
    const style = this[storeStyle]
    const shouldScaleWidth = innerWidth / this[width]
    const shouldScaleHeight = innerHeight / this[height]
    const scale = Math.min(shouldScaleWidth, shouldScaleHeight)
    Object.keys(style).forEach(key => {
      if (shouldScaleWidth > shouldScaleHeight && key === 'left') { // 宽变化多, 左右留白
        const vacancy = innerWidth - this[width] * scale
        this[dom].style.left = `${style[key] * scale + vacancy / 2}px`
      } else if (shouldScaleWidth < shouldScaleHeight && key === 'top') { // 上下留白
        const vacancy = innerHeight - this[height] * scale
        this[dom].style.top = `${style[key] * scale + vacancy / 2}px`
      } else {
        this[dom].style[key] = `${style[key] * scale}px`
      }
    })
    return this
  }
}
