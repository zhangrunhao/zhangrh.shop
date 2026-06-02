// 全局对象, 单例模式, 保持唯一
const width = 750
const height = 1464
export default {
  width: width, // 舞台宽高
  height: height,

  scale: 0, // 缩放比例

  scene: null, // 程序上所有的场景
  touchHeihgt: 0, // 全局核心, 记录滚动的高度
  totalHeight: 0,

  asset: null, // 资源对象
  bus: null, // 事件系统
  stage: null, // 舞台
  scroller: null, // 滚动装置

  touchSpeed: 3, // 整体滑动速度

  rectArray: [0, 0, width, height]
}
