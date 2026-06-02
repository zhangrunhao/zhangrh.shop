import Hilo from 'hilo'
import Global from '../Global'
const w = 700
const h = 600
export default (asset, type, gap) => {
  let viewArr = [
    new Hilo.Bitmap({
      x: 800,
      y: 472,
      image: asset.getContent('transfer/t1.png')
    }),
    new Hilo.Bitmap({
      x: type === 'right' ? 352 : 1195,
      y: 1072,
      image: asset.getContent('transfer/t2.png')
    }),
    new Hilo.Bitmap({
      x: type === 'right' ? 88 : 1455,
      y: 1674,
      image: asset.getContent('transfer/t3.png')
    }),
    new Hilo.Bitmap({
      x: type === 'right' ? 352 : 1195,
      y: 2278,
      image: asset.getContent('transfer/t4.png')
    }),
    new Hilo.Bitmap({
      x: 800,
      y: 2888,
      image: asset.getContent('transfer/t5.png')
    })
  ]
  const x = -800 + (Global.width / 2 - w / 2 + gap.x / 2)
  const startY = -472 + (Global.height / 2 - h / 2 + gap.y / 2)
  const endY = -2888 + (Global.height / 2 - h / 2 + gap.y / 2)
  const view = new Hilo.Container({
    width: 2250,
    height: Global.transferHeight,
    x,
    y: startY
  })
  viewArr.forEach((v, i) => {
    v.addTo(view)
  })
  return {
    view,
    startY,
    endY
  }
}
