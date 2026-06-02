import Scene from '../class/Scene'
import P1 from '../part/p1'
import P2 from '../part/p2'
import P3 from '../part/p3'
import P4 from '../part/p4'
import P5 from '../part/p5'
import P6 from '../part/p6'
import P8 from '../part/p8'
import P9 from '../part/p9'
import P10 from '../part/p10'
import Hilo from 'hilo'

const s1 = Hilo.Class.create({
  Extends: Scene, // 所有场景的基类
  constructor: function (properties) {
    s1.superclass.constructor.call(this, {
      name: 's1'
    })
    this.initPartMap()
  },
  initPartMap: function () {
    this.partMap = []
    this.partMap.push(new P1({
      parentNode: this
    }))
    this.partMap.push(new P2({
      parentNode: this
    }))
    this.partMap.push(new P3({
      parentNode: this
    }))
    this.partMap.push(new P4({
      parentNode: this
    }))
    this.partMap.push(new P5({
      parentNode: this
    }))
    this.partMap.push(new P6({
      parentNode: this
    }))
    this.partMap.push(new P8({
      parentNode: this
    }))
    this.partMap.push(new P9({
      parentNode: this
    }))
    this.partMap.push(new P10({
      parentNode: this
    }))
  }
})
export default s1
