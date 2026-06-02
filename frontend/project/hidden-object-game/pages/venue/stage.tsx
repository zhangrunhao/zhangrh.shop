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
  submitTarget: (eid: string) => Promise<void>
  onWrongTarget: () => void
  scaleEid?: string
  setScaleEid: (eid: string) => void
  submitting: boolean
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
  submitting,
}: StageProps) => {
  const [faultIcon, setFaultIcon] = useState<FaultIcon | null>(null)
  const [localSubmitting, setLocalSubmitting] = useState(false)
  const timeoutIdRef = useRef<number | null>(null)
  const submitTimeoutRef = useRef<number | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const submittingRef = useRef(false)
  const mountedRef = useRef(false)

  const clearFaultTimeout = useCallback(() => {
    if (timeoutIdRef.current !== null) {
      window.clearTimeout(timeoutIdRef.current)
      timeoutIdRef.current = null
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      clearFaultTimeout()
      if (submitTimeoutRef.current !== null) {
        window.clearTimeout(submitTimeoutRef.current)
        submitTimeoutRef.current = null
      }
      submittingRef.current = false
    }
  }, [clearFaultTimeout])

  const showWrongClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (submitting || submittingRef.current) {
        return
      }
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
    [clearFaultTimeout, onWrongTarget, submitting],
  )

  const handleTargetClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>, target: TargetElement) => {
      event.stopPropagation()
      if (submitting || submittingRef.current) {
        return
      }
      if (!nextTargetId || target.eid !== nextTargetId) {
        showWrongClick(event)
        return
      }
      submittingRef.current = true
      setLocalSubmitting(true)
      setScaleEid(target.eid)
      submitTimeoutRef.current = window.setTimeout(async () => {
        submitTimeoutRef.current = null
        try {
          await submitTarget(target.eid)
        } catch {
          return
        } finally {
          submittingRef.current = false
          if (mountedRef.current) {
            setLocalSubmitting(false)
          }
        }
      }, 650)
    },
    [nextTargetId, setScaleEid, showWrongClick, submitTarget, submitting],
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
            disabled={submitting || localSubmitting}
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
