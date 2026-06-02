import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import type { TargetElement, VenueData } from '../../mock/mock-service'

export type ScrollPosition = {
  x: number
  y: number
}

type StageProps = {
  width: number
  height: number
  backgroundImages: VenueData['gameBgPic']
  scrollPosition: ScrollPosition
  elementArr: TargetElement[]
  nextTargetId?: string
  submitTarget: (eid: string) => void
  onWrongTarget: () => void
  scaleEid?: string
  setScaleEid: (eid: string) => void
}

type FaultIcon = {
  x: number
  y: number
}

export const Stage = ({
  width,
  height,
  backgroundImages,
  scrollPosition,
  elementArr,
  nextTargetId,
  submitTarget,
  onWrongTarget,
  scaleEid,
  setScaleEid,
}: StageProps) => {
  const [faultIcon, setFaultIcon] = useState<FaultIcon | null>(null)
  const timeoutIdRef = useRef<number | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const submittingRef = useRef(false)

  const clearFaultTimeout = useCallback(() => {
    if (timeoutIdRef.current !== null) {
      window.clearTimeout(timeoutIdRef.current)
      timeoutIdRef.current = null
    }
  }, [])

  useEffect(() => clearFaultTimeout, [clearFaultTimeout])

  const showWrongClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      clearFaultTimeout()
      const rect = stageRef.current?.getBoundingClientRect()
      setFaultIcon({
        x: event.clientX - (rect?.left ?? 0),
        y: event.clientY - (rect?.top ?? 0),
      })
      timeoutIdRef.current = window.setTimeout(() => {
        setFaultIcon(null)
        timeoutIdRef.current = null
      }, 900)
      onWrongTarget()
    },
    [clearFaultTimeout, onWrongTarget],
  )

  const handleTargetClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>, target: TargetElement) => {
      event.stopPropagation()
      if (!nextTargetId || target.eid !== nextTargetId || submittingRef.current) {
        showWrongClick(event)
        return
      }
      submittingRef.current = true
      setScaleEid(target.eid)
      window.setTimeout(() => {
        submitTarget(target.eid)
        submittingRef.current = false
      }, 650)
    },
    [nextTargetId, setScaleEid, showWrongClick, submitTarget],
  )

  return (
    <div className="stage-wrapper">
      <div
        ref={stageRef}
        className="stage"
        style={{
          width,
          height,
          transform: `translate(${scrollPosition.x}px, ${scrollPosition.y}px)`,
          backgroundImage: backgroundImages[0] ? `url(${backgroundImages[0].url})` : undefined,
        }}
        onClick={showWrongClick}
      >
        {backgroundImages.slice(1).map((image) => (
          <img
            key={`${image.url}-${image.width}-${image.height}`}
            className="stage-background-layer"
            src={image.url}
            width={image.width}
            height={image.height}
            alt=""
            draggable={false}
          />
        ))}
        {elementArr.map((element) => (
          <button
            key={element.eid}
            className={`target ${scaleEid === element.eid ? 'target-scale' : ''} ${element.isFind ? 'target-found' : ''}`}
            type="button"
            aria-label={element.name}
            style={{
              width: element.width,
              height: element.height,
              top: element.ordinate,
              left: element.abscissa,
              backgroundImage: `url(${element.url})`,
            }}
            onClick={(event) => handleTargetClick(event, element)}
          />
        ))}
        {faultIcon ? <div className="fault-icon" style={{ left: faultIcon.x, top: faultIcon.y }} /> : null}
      </div>
    </div>
  )
}
