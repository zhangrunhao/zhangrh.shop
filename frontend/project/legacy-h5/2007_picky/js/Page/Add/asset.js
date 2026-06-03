import Asset from '../../Class/Asset'

export default new Asset('Add', [
  'grid.png',
  'mangguo.png',
  'adorn.png',
  'bg-top.png',
  'bg-board.png',
  'tip-num.png',
  'ball.png'
].concat(
  [...new Array(6)].map((v, i) => `random/${i}.png`)
))
