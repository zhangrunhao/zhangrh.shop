export const getMenuRewindLineCount = (renderedLineCount) =>
  Math.max(0, renderedLineCount - 1)

export const buildMenuLines = ({ title, choices, currentIndex }) => {
  const lines = [`? ${title}:`]
  for (let i = 0; i < choices.length; i += 1) {
    const selected = i === currentIndex
    const prefix = selected ? '\x1b[36m❯\x1b[0m' : ' '
    const label = selected ? `\x1b[36m${choices[i].label}\x1b[0m` : choices[i].label
    lines.push(`${prefix} ${label}`)
  }
  return lines
}
