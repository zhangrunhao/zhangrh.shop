import Hilo from 'hilo'

import {
  isFunc
} from '../../../legacy/utils/legacy-utils.js'

class Topic {
  constructor (p) {
    for (let key in p) {
      this[key] = p[key]
    }
  }
  clear () {
    this.asset.removeAllContent()
  }
  ready (cb) {
    isFunc(this.toReadyView) && (this.view = this.toReadyView())
    isFunc(cb) && cb()
  }
}
Hilo.Class.mix(Topic.prototype, Hilo.EventMixin)
export default Topic
