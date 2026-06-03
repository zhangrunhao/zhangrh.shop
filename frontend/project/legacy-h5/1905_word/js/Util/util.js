export const judgeEqualArray = function (a, b) {
  a = a.concat()
  b = b.concat()
  return a.sort().toString() === b.sort().toString()
}

export const toPercent = function (point) {
  return Number(point * 100).toFixed(2) + '%'
}

export const randomNumBoth = function (Min, Max) {
  var Range = Max - Min
  var Rand = Math.random()
  var num = Min + Math.round(Rand * Range)
  return num
}
