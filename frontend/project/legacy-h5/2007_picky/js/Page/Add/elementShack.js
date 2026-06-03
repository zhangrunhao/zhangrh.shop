export default function elementToShack (elem) {
  var t = 0
  var a = 0.35 // 阻尼
  var b = 3.5 // 劲度系数
  var A = 239.5 // 质量
  var phi = 0 // 初始质量

  var intervalId = 0

  function render () {
    clearInterval(intervalId)
    t = 0
    intervalId = setInterval(function () {
      t++
      // x = exp(-at)*A*cos(bt + phi)
      elem.style.left = Math.exp(-a * t) * A * Math.cos(b * t + phi) + phi + 'px'
    }, 30)
  }

  render()
}
