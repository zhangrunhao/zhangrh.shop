let i
const res = [
  'bg.jpg',
  'paper1.png',
  'paper2.png',
  'three.png'
]
for (i = 0; i < 60; i++) {
  res.push(`float_news/${i}.png`)
}
for (i = 0; i <= 30; i++) {
  res.push(`pile_news/${i}.png`)
}

export default res
