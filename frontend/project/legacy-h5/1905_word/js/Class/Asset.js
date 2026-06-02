// 加载资源类
import Hilo from 'hilo'
import Resource from './Resource'
import {
  toPercent
} from '../Util/util'
import Global from './Global'
class Asset {
  constructor () {
    this.asset = new Resource()
    this.queue = new Hilo.LoadQueue()
    this.loadingDom = document.getElementById('loadingRate')
    this.total = 0 // 全部资源
    this.getResourceMap()
  }
  getResourceMap () {
    const map = this.asset.getResourceMap()
    const publicPath = this.asset.getAssetPath()
    let res = []
    Object.keys(map).forEach(key => {
      map[key].forEach(item => {
        res.push({
          noCache: Global.noCache,
          crossOrigin: Global.crossOrigin,
          id: `${key}/${item}`,
          src: `${publicPath}${key}/${item}?version=${Global.assetVersion}`
        })
      })
    })
    return res
  }
  getAsset (id) {
    const res = this.queue.getContent(id)
    return res
  }
  showLoadingRate () {
    this.timer = setInterval(() => {
      const rate = this.queue.getLoaded() / this.total
      this.loadingDom.innerText = toPercent(rate)
    }, 10)
  }
  load () {
    this.queue.add(this.getResourceMap())
    this.total = this.queue.getTotal()
    this.showLoadingRate()
    this.queue.start()
    this.queue.on('complete', this.onComplete.bind(this))
  }
  onComplete () {
    clearInterval(this.timer)
    this.queue.off('complete')
    this.fire('complete')
  }
}

Hilo.Class.mix(Asset.prototype, Hilo.EventMixin)
export default Asset
