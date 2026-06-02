import Hilo from 'hilo'
import Global from '../Global'
/**
 * 转场动画函数
 * @param {View} view 视图
 * @param {String} type 类型, right / left
 * @param {String} durantion 方向, top / bottom
 */
const w = 700
const h = 600
// TODO: 使用半圆处理动画
export default (view, type, durantion, gap) => {
  let arrPosition = [
    {
      x: 800,
      y: 472
    },
    {
      x: 352,
      y: 1072
    },
    {
      x: 88,
      y: 1674
    },
    {
      x: 352,
      y: 2278
    },
    {
      x: 800,
      y: 2888
    }
  ]
  if (type === 'left') {
    arrPosition[1].x = 1195
    arrPosition[2].x = 1455
    arrPosition[3].x = 1195
  }
  if (durantion === 'bottom') {
    arrPosition = arrPosition.reverse()
  }
  function fixTargetPosition (p) {
    return {
      x: -p.x + (Global.width / 2 - w / 2 + gap.x / 2),
      y: -p.y + (Global.height / 2 - h / 2 + gap.y / 2)
    }
  }
  return new Promise((resolve, reject) => {
    const targetPositinonArr = arrPosition.map(i => fixTargetPosition(i))
    const tweenArr = targetPositinonArr.map((v, i, arr) => {
      return new Hilo.Tween(view, arr[i - 1], v, {
        duration: 2000,
        onComplete: function () {
          co(tweenArr)
        }
      })
    })
    function co (arr) {
      (arr.length > 0) ? arr.splice(0, 1)[0].start() : resolve()
    }
    tweenArr.shift()
    co(tweenArr)
  })
}
