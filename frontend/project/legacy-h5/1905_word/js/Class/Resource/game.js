let i
const game = [// 游戏页资源
  'bg/0.jpg',
  'bg/ele01.png',
  'bg/ele02.png',
  'bg/logo.png',
  'bg/drag.png',
  'bg/star/16.png',
  'bg/star/11.png',
  'button/close.png',
  'button/btn-after.png',
  'button/btn-before.png',
  'button/curcle-big.png',
  'button/curcle-litter.png',
  'radical_pillar/pillar.png',
  'reject/wrong.jpg',
  'reject/count.jpg'
]

for (i = 0; i < 10; i++) {
  game.push(`radical/${i}.png`)
  game.push(`radical_drop/${i}.png`)
  game.push(`radical_pillar/ingame/${i}.png`)
  game.push(`radical_pillar/outgame/${i}.png`)
}

for (i = 0; i <= 37; i++) {
  game.push(`demo/${i}.jpg`)
}

export default game
