import Hilo from 'hilo'
import {
  winWidth,
  getWinHeight
} from '../../../Class/Global'
export default class GridView {
  constructor () {
    // 创建网格
    const gridView = new Hilo.Container({
      alpha: 0.1,
      width: winWidth,
      height: getWinHeight()
    })
    for (var i = 0; i < Math.ceil(getWinHeight() / (20)); i++) {
      for (var j = 0; j < Math.ceil(getWinHeight() / (20)); j++) {
        new Hilo.Graphics({
          x: i * (20),
          y: j * (20),
          width: (20),
          height: (20)
        })
          .lineStyle(0.5, '#000')
          .drawRect(0.5, 0.5, (19.5), (19.5))
          .endFill()
          .addTo(gridView)
      }
    }
    this.view = gridView
  }
}
