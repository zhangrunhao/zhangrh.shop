import p1 from '../resource/s1_1'
import p2 from '../resource/s1_2'
import p3 from '../resource/s1_3'
import p4 from '../resource/s1_4'
import p5 from '../resource/s1_5'
import p6 from '../resource/s1_6'
import p8 from '../resource/s1_8'
import p9 from '../resource/s1_9'
import p10 from '../resource/s1_10'
import Hilo from 'hilo'

var sourcePathMap = {
  s1: [
    p1,
    p2,
    p3,
    p4,
    p5,
    p6,
    null,
    p8,
    p9,
    p10
  ]
}

const assetRoot = new URL('../../asset/image', import.meta.url).href.replace(/\/$/, '')
var getLoadMap = function () {
  var arr = []
  for (var sceneName in sourcePathMap) {
    sourcePathMap[sceneName].forEach(function (item, index) {
      item && item.forEach(function (fileName) {
        arr.push({
          id: `${sceneName}_${String(index + 1)}_${fileName}`,
          src: `${assetRoot}/${sceneName}/${String(index + 1)}/${fileName}`
        })
      })
    })
  }
  return arr
}
export default Hilo.Class.create({
  Mixes: Hilo.EventMixin, // 混入事件系统
  queue: null, // 资源队列
  constructor: function () {
    this.queue = new Hilo.LoadQueue(getLoadMap())
    this.queue.on('complete', this.onComplete.bind(this))
    this.loadingDom = document.getElementById('loadingRate')
    this.total = this.queue.getTotal()
  },
  load: function () { // 加载全部资源
    this.showLoadingRate()
    this.queue.start()
  },
  showLoadingRate: function () {
    var that = this
    this.timer = setInterval(function () {
      var rate = that.queue.getLoaded() / that.total
      rate = parseInt(rate * 100) + '%'
      that.loadingDom.innerHTML = rate
    }, 10)
  },
  hideLoaidngRate: function () {
    document.getElementById('loading').style.display = 'none'
    document.getElementById('stage').style.display = 'block'
    clearInterval(this.timer)
  },
  onComplete: function () {
    this.hideLoaidngRate()
    this.queue.off('complete')
    this.fire('complete')
  },
  getAsset: function (partNum, resourceNum, resourceName) { // 获取对应资源
    var actualName = partNum + '_' + resourceNum + '_' + resourceName
    return this.queue.get(actualName).content
  }
})
