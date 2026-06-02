import Hilo from 'hilo'
import Global from '../Class/Global'
export default class Bg {
  constructor () {
    return new Hilo.Container({
      id: 'bg',
      width: Global.width,
      height: Global.height,
      background: '#fcf5e8'
    })
  }
}
