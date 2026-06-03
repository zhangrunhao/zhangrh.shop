import game from './Resource/game'
import share from './Resource/share'
export default class Resource {
  constructor () {
    this.sourceMap = {
      share,
      game
    }
  }
  getResourceMap () {
    return this.sourceMap
  }
  getAssetPath () {
    return new URL('./asset/image/', window.location.href).href
  }
}
