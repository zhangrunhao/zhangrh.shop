import Global from './Global'
import {
  produceRandomString
} from '../../../legacy/utils/legacy-utils.js'
const createId = function (name) {
  return produceRandomString(6) + name
}
const loader = Symbol('loader')
const id = Symbol('id')
export default class Asset {
  constructor (moduleName, images) {
    this.moduleName = moduleName // 所属的文件夹名称
    this.images = images
    this[id] = createId()
    this[loader] = null
  }
  removeAllContent () {
    this.images.forEach(imgName => {
      this[loader].removeContent(`${this[id]}_${imgName}`)
    })
  }
  /**
   * 获取图片
   * @param {Sting} imgName 图片名称
   */
  getContent (imgName) {
    return this[loader].getContent(`${this[id]}_${imgName}`)
  }
  /**
   * 存储loader
   * @param {Loader} l 被收集的loader
   */
  storeLoader (l) { // 通过此方法被收集
    this[loader] = l
  }
  /**
   * 生成资源地图, 以供加载使用
   */
  produceImagesMap () {
    return this.images.map(imgName => {
      return {
        crossOrigin: Global.crossOrigin,
        id: `${this[id]}_${imgName}`,
        src: `${Global.publicPath}/${this.moduleName}/${imgName}?timeStamp=${Global.timeStamp}`
      }
    })
  }
}
