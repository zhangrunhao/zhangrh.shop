export default {
  RandomNumBoth: function RandomNumBoth (Min, Max) { // 随机数
    var Range = Max - Min
    var Rand = Math.random()
    var num = Min + Math.round(Rand * Range) // 四舍五入
    return num
  },
  bindWX: function () {
  },
  getQueryString: function (name) { // 截取链接上的指定参数
    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i')
    var r = window.location.search.substr(1).match(reg)
    if (r != null) return unescape(r[2])
    return null
  },
  eventTracking: function () {
  },
  getUserh5Cid: function () {
    return ''
  }
}
