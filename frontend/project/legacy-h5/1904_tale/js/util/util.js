export default {
  RandomNumBoth: function RandomNumBoth (Min, Max) { // 随机数
    var Range = Max - Min
    var Rand = Math.random()
    var num = Min + Math.round(Rand * Range) // 四舍五入
    return num
  }
}
