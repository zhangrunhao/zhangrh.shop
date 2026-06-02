import Card from '../../Class/Card/index'
import asset from './asset'

export default class C5 extends Card {
  constructor () {
    super({
      name: 'c5',
      transferType: 'left',
      headPostiton: {
        x: 60,
        y: 3
      },
      asset
    })
  }
}
