import { useEffect, useRef, type Dispatch, type SetStateAction, type TouchEvent, type MouseEvent } from 'react'
import type { ScrollPosition } from './stage'

type TouchMaskProps = {
  startTouch: () => void
  endTouch: () => void
  setScrollPosition: Dispatch<SetStateAction<ScrollPosition>>
  scrollMaxX: number
  scrollMaxY: number
  switchElementShow: () => void
}

export const TouchMask = ({
  setScrollPosition,
  startTouch,
  endTouch,
  scrollMaxX,
  scrollMaxY,
  switchElementShow,
}: TouchMaskProps) => {
  const touchTimeoutRef = useRef<number | null>(null)
  const maskRef = useRef<HTMLDivElement | null>(null)
  const startPosition = useRef({ x: 0, y: 0 })
  const currentPosition = useRef({ x: 0, y: 0 })

  useEffect(() => endTouch, [endTouch])

  const clearTouchTimeout = () => {
    if (touchTimeoutRef.current !== null) {
      window.clearTimeout(touchTimeoutRef.current)
      touchTimeoutRef.current = null
    }
  }

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    if (!touch) {
      return
    }

    const prevX = startPosition.current.x
    const nowX = touch.clientX
    const nowY = touch.clientY

    if (touchTimeoutRef.current !== null && Math.abs(prevX - nowX) < 10 && event.touches.length === 1) {
      switchElementShow()
      clearTouchTimeout()
    } else {
      touchTimeoutRef.current = window.setTimeout(clearTouchTimeout, 300)
    }

    startPosition.current = { x: nowX, y: nowY }
  }

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    if (!touch) {
      return
    }

    clearTouchTimeout()
    startTouch()

    currentPosition.current = {
      x: touch.clientX,
      y: touch.clientY,
    }

    const distanceX = currentPosition.current.x - startPosition.current.x
    const distanceY = currentPosition.current.y - startPosition.current.y

    setScrollPosition((prevPosition) => ({
      x: Math.min(0, Math.max(-scrollMaxX, prevPosition.x + distanceX)),
      y: Math.min(0, Math.max(-scrollMaxY, prevPosition.y + distanceY)),
    }))

    startPosition.current = currentPosition.current
  }

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const mask = maskRef.current
    if (!mask) {
      return
    }

    mask.style.pointerEvents = 'none'
    const target = document.elementFromPoint(event.clientX, event.clientY)
    if (target) {
      target.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: event.clientX,
          clientY: event.clientY,
        }),
      )
    }
    window.setTimeout(() => {
      mask.style.pointerEvents = 'auto'
    }, 0)
  }

  return (
    <div
      ref={maskRef}
      className="touch-mask"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={endTouch}
      onClick={handleClick}
    />
  )
}
