import Hilo from 'hilo'

import Option from './option'
import Page from '../../../Class/Page'

export default class SelectPanel extends Page {
  constructor (asset, width, info, type, flag) {
    super()
    this.type = type
    this.width = width
    this.selectedOptions = []
    this.info = info
    this.flag = flag
    this.view = this.initView(asset)
  }
  initView (asset) {
    const content = new Hilo.Container({
      // background: 'grey',
      width: this.width,
      height: 1206
    })
    this.info.map(i => {
      const option = new Option({
        flag: this.flag,
        type: this.type,
        id: i.id,
        name: i.name,
        image: asset.getContent(`${this.type}/${i.id}.png`),
        x: i.x - 100,
        y: i.y - 100,
        width: 185,
        height: 185
      })
      option.on('toSelect', (mouseEvent) => {
        this.selectedOptions.push(option)
        this.fire('selectOptionsNumberChange', mouseEvent.detail)
      })
      option.on('cancelSelected', () => {
        const index = this.selectedOptions.findIndex(i => i.id === option.id)
        this.selectedOptions.splice(index, 1)
        this.fire('selectOptionsNumberChange')
      })
      option.view.addTo(content)
    })
    return content
  }
}
