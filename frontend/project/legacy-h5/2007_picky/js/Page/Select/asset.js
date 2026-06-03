import Asset from '../../Class/Asset'

import fruit from '../../Info/fruit.json'
import other from '../../Info/other.json'
import meat from '../../Info/meat.json'
import vegetable from '../../Info/vegetable.json'

export default new Asset('Select', [
  'ball.png',

  'option/is-select.png',
  'option/no-select.png',
  'option/no-select-large.png',
  'option/is-select-large.png',
  'option/fly.png',

  'adorn/adorn-bottom.png',
  'adorn/trash-completed.png',
  'adorn/trash-selected.png',
  'adorn/trash-cover.png',
  'adorn/progress-fruit.png',
  'adorn/progress-meat.png',
  'adorn/progress-other.png',
  'adorn/progress-vegetable.png',
  'adorn/bubble.png',

  `cover/squirm/purple.png`,
  `cover/squirm/orange.png`,
  `cover/squirm/green.png`,
  `cover/squirm/yellow.png`,

  'cover/bubble.png',
  'cover/line.png',
  'cover/bg.png',
  'cover/tip.png',
  'cover/dialog-before.png',
  'cover/dialog-before_sohu.png',
  'cover/dialog-after.png'
].concat(
  fruit.map(i => `fruit/${i.id}.png`),
  other.map(i => `other/${i.id}.png`),
  meat.map(i => `meat/${i.id}.png`),
  vegetable.map(i => `vegetable/${i.id}.png`),
  [...new Array(14)].map((v, i) => `cover/picky/${++i}.png`),
  [...new Array(22)].map((v, i) => `cover/sprite/fruit/${++i}.png`),
  [...new Array(23)].map((v, i) => `cover/sprite/other/${i}.png`),
  [...new Array(25)].map((v, i) => `cover/sprite/meat/${++i}.png`),
  [...new Array(25)].map((v, i) => `cover/sprite/vegetable/${++i}.png`)
))
