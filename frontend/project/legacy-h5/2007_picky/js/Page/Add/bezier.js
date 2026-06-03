/**
 * @desc 贝塞尔曲线算法，包含了3阶贝塞尔
 */
export default class Bezier {

  /**
   * @desc 一阶贝塞尔
   * @param {number} t 当前百分比
   * @param {Array} p1 起点坐标
   * @param {Array} p2 终点坐标
   */
  oneBezier(t, p1, p2) {
      const [x1, y1] = p1;
      const [x2, y2] = p2;
      let x = x1 + (x2 - x1) * t;
      let y = y1 + (y2 - y1) * t;
      return [x, y];
  }

  /**
   * @desc 二阶贝塞尔
   * @param {number} t 当前百分比
   * @param {Array} p1 起点坐标
   * @param {Array} p2 终点坐标
   * @param {Array} cp 控制点
   */
  twoBezier(t, p1, cp, p2) {
      const [x1, y1] = p1;
      const [cx, cy] = cp;
      const [x2, y2] = p2;
      let x = (1 - t) * (1 - t) * x1 + 2 * t * (1 - t) * cx + t * t * x2;
      let y = (1 - t) * (1 - t) * y1 + 2 * t * (1 - t) * cy + t * t * y2;
      return [x, y];
  }

  /**
   * @desc 三阶贝塞尔
   * @param {number} t 当前百分比
   * @param {Array} p1 起点坐标
   * @param {Array} p2 终点坐标
   * @param {Array} cp1 控制点1
   * @param {Array} cp2 控制点2
   */
  threeBezier(t, p1, cp1, cp2, p2) {
      const [x1, y1] = p1;
      const [x2, y2] = p2;
      const [cx1, cy1] = cp1;
      const [cx2, cy2] = cp2;
      let x =
          x1 * (1 - t) * (1 - t) * (1 - t) +
          3 * cx1 * t * (1 - t) * (1 - t) +
          3 * cx2 * t * t * (1 - t) +
          x2 * t * t * t;
      let y =
          y1 * (1 - t) * (1 - t) * (1 - t) +
          3 * cy1 * t * (1 - t) * (1 - t) +
          3 * cy2 * t * t * (1 - t) +
          y2 * t * t * t;
      return [x, y];
  }
}
