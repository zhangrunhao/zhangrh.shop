import wx from 'wx'
import $ from '$'

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
  getUserh5Cid: function () { // 获取H5端唯一ID
    /* eslint-disable */
    let _this = this
    let h5Cid = ''
    try {
      h5Cid = UI.utils.getCookie('sohunews_h5_c') || localStorage.getItem('sohunews_h5_c') || _this.localDB()
    } catch (err) {
      console.err(err)
    }
    if (!h5Cid) {
      var _t = Date.now() + ''
      var _time = _t.substring(1, _t.length)
      h5Cid = '6' + generateCid(2) + _time + generateCid(4) // '5555181013428160615'
      try {
        UI.utils.setCookie('sohunews_h5_c', h5Cid, new Date(Date.now() + 10 * 12 * 30 * 24 * 3600000),
          '/') // 10*12*30*24*3600
        localStorage.setItem('sohunews_h5_c', h5Cid)
        _this.localDB(h5Cid)
      } catch (err) {
        console.err(err)
      }
    }
    function generateCid (n) {
      var chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
      var res = ''
      for (var i = 0; i < n; i++) {
        var id = Math.ceil(Math.random() * 9)
        res += chars[id]
      }
      return res
    }
    return h5Cid
  }
}
