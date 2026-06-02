export const DESIGN_WIDTH = 750
export const DESIGN_HEIGHT = 1206

export const refreshRootFont = () => {
  let width = window.innerWidth
  const height = window.innerHeight
  const formalRatio = DESIGN_WIDTH / DESIGN_HEIGHT
  const currentRatio = width / height
  if (currentRatio > formalRatio) {
    width = height * formalRatio
  }
  const rootFontSize = (width / DESIGN_WIDTH) * 100
  document.documentElement.style.fontSize = `${rootFontSize}px`
  return rootFontSize
}

export const px = (value: number) => (value / 100) * refreshRootFont()
