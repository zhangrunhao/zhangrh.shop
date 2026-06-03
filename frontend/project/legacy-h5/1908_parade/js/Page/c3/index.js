import Card from '../../Class/Card/index'
import asset from './asset'

export default class C3 extends Card {
  constructor () {
    super({
      name: 'c3',
      transferType: 'right',
      headPostiton: {
        x: 56,
        y: 8
      },
      asset
    })
  }
}
