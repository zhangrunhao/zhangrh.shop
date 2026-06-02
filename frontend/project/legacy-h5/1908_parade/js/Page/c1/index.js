import Card from '../../Class/Card/index'
import asset from './asset'
export default class C1 extends Card {
  constructor (p) {
    super({
      name: 'c1',
      transferType: 'right',
      headPostiton: {
        x: 74,
        y: 2
      },
      asset
    })
  }
}
