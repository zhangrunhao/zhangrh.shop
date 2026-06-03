const share = [ // 结果页资源
  'rare/sort.png',
  'normal/sort.png'
]
const common = [
  'avatr.png',
  'btn-continue.png',
  'code.jpeg',
  'count.png',
  'logo.png',
  'text0.png',
  'text1.png',
  'text2.png',
  'title.png',
  'egg.jpg'
]

common.forEach(i => {
  share.push(`common/${i}`)
})

export default share
