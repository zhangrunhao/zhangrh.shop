export const targetWidth = 750
export const targetHeight = 1206
export const winWidth = document.documentElement.clientWidth || window.screen.width || window.outerWidth || document.documentElement.scrollWidth
// export const winHeight = document.documentElement.clientHeight || window.screen.height || window.outerHeight || document.documentElement.scrollHeight
export const winHeight = document.getElementById('bottom-util').getBoundingClientRect().bottom

export const getWinHeight = function () {
  return document.getElementById('bottom-util').getBoundingClientRect().bottom
}
