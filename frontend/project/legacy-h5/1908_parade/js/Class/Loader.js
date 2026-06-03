// 依靠外部传入所有页面中资源路径, 提供, 开始加载, 实时百分比, 加载完成的功能
import Hilo from 'hilo'
import {
  toPercent
} from '../../../legacy/utils/legacy-utils.js'
const queue = Symbol('queue')
const map = Symbol('map')
const onComplete = Symbol('onComplete')
class Loader {
  constructor () {
    this[queue] = new Hilo.LoadQueue()
    this[map] = [] // 加载资源数组
  }
  [onComplete] () {
    this.fire('complete')
  }
  collect (asset) {
    asset.storeLoader(this)
    this[map] = Array.prototype.concat(this[map], asset.produceImagesMap())
  }
  removeContent (id) {
    return this[queue].removeContent(id)
  }
  getContent (id) {
    return this[queue].getContent(id)
  }
  start () {
    this[queue].on('complete', this[onComplete].bind(this))
    this[queue].add(this[map])
    this[queue].start()
  }
  getRate () {
    const rate = this[queue].getLoaded() / this[queue].getTotal()
    return toPercent(rate)
  }
}

Hilo.Class.mix(Loader.prototype, Hilo.EventMixin)
export default Loader
