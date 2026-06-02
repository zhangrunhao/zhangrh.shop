let i
const res = [
  'bg.jpg',
  'book-close.png',
  'ghost1.png',
  'ghost2.png',
  'ghost3.png',
  'ghost4.png',
  'ghost5.png',
  'ghost6.png',
  'ghost7.png',
  'light-01.png',
  'light-02.png',
  'light-03.png',
  'spirit1.png',
  'spirit2.png',
  'spirit3.png',
  'spirit4.png',
  'spirit5.png',
  'text1.png',
  'text2.png',
  'text3.png'
]
for (i = 0; i <= 11; i++) {
  res.push(`flower_book/${i}.png`)
}
for (i = 0; i <= 29; i++) {
  res.push(`little_light/${i}.png`)
}
for (i = 0; i <= 15; i++) {
  res.push(`flower_big/${i}.png`)
}
for (i = 2; i <= 11; i++) {
  res.push(`open_book/${i}.png`)
}

export default res
