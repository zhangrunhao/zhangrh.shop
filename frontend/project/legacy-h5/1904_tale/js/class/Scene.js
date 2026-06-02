import Global from './Global'
import Hilo from 'hilo'

const Scene = Hilo.Class.create({
  Statics: {
    sceneMap: Global.scene, // 所有场景的集合
    sceneIndex: 0 // 当前场景索引
  },
  constructor: function (properties) {
    this.content = new Hilo.Container({}) // 盛放所有元素的容器.
    this.name = properties.name || ''
  },
  readyStart: function () {
    this.content.addTo(Global.stage)
    this.partMap[0].start()
  }
})

export default Scene
