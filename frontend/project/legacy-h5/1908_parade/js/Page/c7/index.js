import Card from '../../Class/Card/index'
import asset from './asset'

export default class C7 extends Card {
  constructor () {
    super({
      name: 'c7',
      transferType: 'right',
      headPostiton: {
        x: 55,
        y: 22
      },
      asset
    })
  }
}
