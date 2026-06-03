// 全局对象, 单例模式, 保持唯一
import Hilo from 'hilo'

const width = 750
// const height = 1464
const height = 1333

export default {
  width: width, // 舞台宽高
  height: height,

  asset: null, // 资源实例
  stage: null, // 舞台
  ticker: null, // 刷新器

  gameStage: null, // 游戏页面舞台

  isWX: false,

  userInfo: null, // 用户信息

  crossOrigin: false, // 图片是否跨域

  assetVersion: '190617_1428', // 静态资源时间

  bus: Hilo.Class.mix({}, Hilo.EventMixin) // 事件通信系统
}
