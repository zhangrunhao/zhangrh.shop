/**
 * 判断两个数组是否完全相同
 * @param {Array} a 数组
 * @param {Array} b 数组
 * @returns {Boolean} 判断结果
 */
export const judgeEqualArray = function (a, b) {
  a = a.concat()
  b = b.concat()
  return a.sort().toString() === b.sort().toString()
}

/**
 * 数字转百分百比字符串
 * @param {Number} point 需要转换的数字
 * @returns {String} 转换后的字符串
 */
export const toPercent = function (point) {
  return Number(point * 100).toFixed(2) + '%'
}

/**
 * 在指定范围内生成随机数
 * @param {Number} Min 最小值
 * @param {Number} Max 最大值
 * @returns {Number} 生成的随机数
 */
export const randomNumBoth = function (Min, Max) {
  var Range = Max - Min
  var Rand = Math.random()
  var num = Min + Math.round(Rand * Range)
  return num
}

/**
 * 截取链接参数
 * @param {String} name 参数名称
 */
export const getQueryString = function (name) { // 截取链接上的指定参数
  var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i')
  var r = window.location.search.substr(1).match(reg)
  if (r != null) return unescape(r[2])
  return null
}

/**
 * 判断当前是否为微信环境
 */
export const getIsInWeXin = function () {
  var ua = navigator.userAgent.toLowerCase()
  return !!(/micromessenger/.test(ua))
}

/**
 * 埋点追踪
 */
export const eventTracking = function () { // 埋点
}

/**
 * 获取H5端唯一ID
 */
export const getUserh5Cid = function () {
  return ''
}

export const bindWX = function () { // 绑定微信分享
}
