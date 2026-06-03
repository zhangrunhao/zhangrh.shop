import Asset from '../../Class/Asset'
const arrAssetMap = [
  'video_q2.png',
  'topic4.png',
  'raindrop1.png',
  'raindrop2.png',

  'A/after.png',
  'A/before.png',
  'A/bg.png',
  'A/car.png',

  'B/after.png',
  'B/before.png',
  'B/bg.png',
  'B/heart-broken.png',
  'B/heart.png',

  'C/after.png',
  'C/before.png',
  'C/bg.png',
  'C/icon.png',

  'D-option/before.png',
  'D-option/bg.png',
  'D-option/tree.png'
]
for (let i = 1; i <= 20; i++) {
  arrAssetMap.push(`D/${i}.png`)
}
export default new Asset('topic4', arrAssetMap)
