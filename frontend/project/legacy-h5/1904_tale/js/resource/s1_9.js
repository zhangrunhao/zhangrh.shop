let i
const res = [
  'bg.png',
  'ground1.png',
  'ground2.png',
  'star1.png',
  'star2.png',
  'balloon.png',
  'before/stage_back.png',
  'before/stage_bg.png',
  'before/stage_font.png',
  'before/stage.png',

  'after/stage_back.png',
  'after/stage_bg.png',
  'after/stage_font.png',

  'closebg.jpg'
]
for (i = 0; i <= 5; i++) {
  res.push(`card/${i}.png`)
}
for (i = 0; i <= 27; i++) {
  res.push(`close/${i}.png`)
}
for (i = 0; i <= 7; i++) {
  res.push(`after/little_back/${i}.png`)
}
for (i = 0; i <= 7; i++) {
  res.push(`after/little_font/${i}.png`)
}
for (i = 0; i <= 11; i++) {
  res.push(`after/princess/${i}.png`)
}

export default res
