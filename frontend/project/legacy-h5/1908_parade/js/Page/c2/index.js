import Card from '../../Class/Card/index'
import asset from './asset'

export default class C1 extends Card {
  constructor () {
    super({
      name: 'c2',
      transferType: 'left',
      headPostiton: {
        x: 60,
        y: 2
      },
      asset
    })
  }
}
