import Asset from '../../Class/Asset'

var arr = []
for (var i = 0; i <= 40; i++) {
  if (i < 10) {
    arr.push(`sprite/0${i}.png`)
  } else {
    arr.push(`sprite/${i}.png`)
  }
}
export default new Asset('Trans', arr.concat([
  'title.png',
  'logo.png',
  'cloud-1.png',
  'cloud-2.png',
  'cloud-3.png',
  'cloud-4.png',
  'cloud-5.png',
  'cloud-6.png'
]))
