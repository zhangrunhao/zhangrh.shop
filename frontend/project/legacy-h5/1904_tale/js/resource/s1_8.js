let i
const res = [
  'bg.jpg',
  'bg2.png',
  'bubble.png',
  'fish_tail.png',
  'fish.png',
  'water.png'
]
for (i = 0; i <= 11; i++) {
  res.push(`eye/${i}.png`)
}
for (i = 0; i <= 15; i++) {
  res.push(`hair/${i}.png`)
}
for (i = 0; i <= 15; i++) {
  res.push(`kelp_blue/${i}.png`)
}
for (i = 0; i <= 14; i++) {
  res.push(`kelp_black/${i}.png`)
}
for (i = 24; i <= 59; i++) {
  res.push(`dolphin/${i}.png`)
}
export default res
