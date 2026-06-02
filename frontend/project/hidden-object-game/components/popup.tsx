import type { CSSProperties, ReactNode } from 'react'

type PopupProps = {
  visible: boolean
  children: ReactNode
  close: () => void
  panelStyle?: CSSProperties
  maskOpacity?: number
}

export const Popup = ({ visible, children, close, panelStyle, maskOpacity = 0.72 }: PopupProps) => {
  if (!visible) {
    return null
  }

  return (
    <div className="popup-root" role="dialog" aria-modal="true">
      <button className="popup-mask" type="button" aria-label="关闭弹窗" onClick={close} style={{ opacity: maskOpacity }} />
      <div className="popup-panel" style={panelStyle}>
        {children}
      </div>
    </div>
  )
}
