import Card from '../../Class/Card/index'
import asset from './asset'

export default class C6 extends Card {
  constructor () {
    super({
      name: 'c6',
      transferType: 'right',
      headPostiton: {
        x: 55,
        y: 20
      },
      asset
    })
  }
}
