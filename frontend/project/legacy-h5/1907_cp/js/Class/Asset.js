import Global from './Global'
import {
  produceRandomString
} from '../../../legacy/utils/legacy-utils.js'
const createId = function (name) {
  return produceRandomString(6) + name
}
const l = Symbol('l')
const id = Symbol('id')
export default class Asset {
  constructor (moduleName, images) {
    this.moduleName = moduleName // 所属的文件夹名称
    this.images = images
    this[id] = createId()
    this[l] = null
  }
  removeAllContent () {
    this.images.forEach(imgName => {
      this[l].removeContent(`${this[id]}_${imgName}`)
    })
  }
  getContent (imgName) {
    return this[l].getContent(`${this[id]}_${imgName}`)
  }
  storeLoader (loader) { // 通过此方法被收集
    this[l] = loader
  }
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
