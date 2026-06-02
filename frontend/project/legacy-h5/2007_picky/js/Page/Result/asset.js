import Asset from '../../Class/Asset'

export default new Asset('Result', [
  'bg.png',

  'top-fruit.png',
  'top-meat.png',
  'top-other.png',
  'top-vegetable.png',

  'icon-fruit.png',
  'icon-meat.png',
  'icon-other.png',
  'icon-vegetable.png',

  'avatar-outer.png',
  'code-outer.png',
  'counter.png',
  'line.png',
  'text.png',
  'title.png',

  'logo.png',

  'no-404.png',
  'no-counter.png',
  'no-text.png',
  'no-top-white.png'
].concat(
  [...new Array(6)].map((v, i) => `avatar/${i + 1}.png`)
))
