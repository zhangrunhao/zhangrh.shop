import {
  getRandomElementFromArray
} from '../../../legacy/utils/legacy-utils.js'
export default (res) => {
  let maxArr = [] // 存放最后的数组
  let maxNum = 0
  Object.keys(res).forEach(key => {
    if (res[key] > maxNum) {
      maxArr = [key]
      maxNum = res[key]
    } else if (res[key] === maxNum) {
      maxArr.push(key)
    }
  })
  return getRandomElementFromArray(maxArr)
}
