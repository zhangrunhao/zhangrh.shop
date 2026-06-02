let i
const res = [
  'text1.png',
  'text2.png',
  'text3.png',
  'text4.png',
  'bg_add.jpg'
]
for (i = 0; i <= 7; i++) {
  res.push(`girl/${i}.png`)
}
for (i = 1; i < 9; i++) {
  res.push(`music${i}.png`)
}
for (i = 0; i <= 15; i++) {
  res.push(`bg/${i}.jpg`)
}
for (i = 0; i < 6; i++) {
  res.push(`expression1/${i}.png`)
}
for (i = 0; i < 20; i++) {
  res.push(`expression2/${i}.png`)
}
for (i = 0; i < 8; i++) {
  res.push(`expression3/${i}.png`)
}
for (i = 0; i < 8; i++) {
  res.push(`expression4/${i}.png`)
}

export default res
