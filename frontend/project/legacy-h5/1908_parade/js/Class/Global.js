// 全局对象, 单例模式, 保持唯一
const width = 750
const height = 1206
const publicPath = new URL('./asset', window.location.href).href.replace(/\/$/, '')

export default {
  width, // 舞台宽高
  height,
  needScrollDistance: 50,
  transferHeight: 3800,
  crossOrigin: false,
  timeStamp: 'legacy-local',
  publicPath
}
