import Card from '../../Class/Card/index'
import asset from './asset'

export default class C8 extends Card {
  constructor () {
    super({
      name: 'c8',
      transferType: 'left',
      headPostiton: {
        x: 55,
        y: 28
      },
      asset
    })
    this.isLastPage = true
  }
  childHandleView (cardView, transferView, scrollView) {
    // scrollView.scrollTipView.removeFromParent()
    // scrollView.scrollDocView.removeFromParent()
    return new Promise((resolve, reject) => {
      resolve()
    })
  }
}
