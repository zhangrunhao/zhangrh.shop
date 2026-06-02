let i
const res = [
  'bg1.jpg',
  'bg2.png',
  'dolphin.jpg',
  'moment.jpg',
  'mather.png'
]
for (i = 0; i <= 5; i++) {
  res.push(`child/${i}.png`)
}
for (i = 0; i <= 11; i++) {
  res.push(`star/${i}.png`)
}

export default res
