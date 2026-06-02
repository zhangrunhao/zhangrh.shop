import {
  targetWidth,
  targetHeight,
  getWinHeight,
  winWidth
} from './Global'

const s = (function () {
  var scaleW = winWidth / targetWidth // 应该缩放的比例
  var scaleH = getWinHeight() / targetHeight

  var scale = Math.min(scaleW, scaleH)

  return {
    w: scale / scaleW,
    h: scale / scaleH
  }
})()

export const scaleX = s.w
export const scaleY = s.h

export const getW = function (w) {
  return w * s.w
}

export const getH = function (h) {
  return h * s.h
}

export const parseW = function (w) {
  return w / s.w
}

export const px = function (px) {
  return px / 100 * parseFloat(document.documentElement.style.fontSize)
}

/**
 * 记录距离右边距离
 * @param {Number} distance 距离右边距离
 * @param {Number} width 本身宽度
 */
export const right = function (distance, width) {
  return targetWidth - distance - width * scaleX
}
/**
 * 计算记录右边的距离
 * @param {Number} distance 距离底部距离
 * @param {Number} height 本身高度
 */
export const bottom = function (distance, height) {
  return getWinHeight() - distance - height
}

/**
 * x轴居中
 * @param {Number} width 本身宽度
 */
export const centerX = function (width) {
  return (winWidth - width) / 2
}

/**
 * y轴居中
 * @param {Number} height 本身高度
 */
export const centerY = function (height) {
  return (getWinHeight() - height) / 2
}
