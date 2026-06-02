import { useEffect, useRef, useState } from 'react'
import { Popup } from '../../components/popup'
import { drawLottery, getLotteryInfo, type LotteryInfo, type LotteryReward } from '../../mock/mock-service'

type LotteryDialogProps = {
  visible: boolean
  close: () => void
}

type LotteryDialogState = {
  openKey: number
  info: LotteryInfo | null
  reward: LotteryReward | null
  drawing: boolean
}

export const LotteryDialog = ({ visible, close }: LotteryDialogProps) => {
  const [state, setState] = useState<LotteryDialogState>({
    openKey: 0,
    info: null,
    reward: null,
    drawing: false,
  })
  const openKeyRef = useRef(0)
  const previousVisibleRef = useRef(visible)
  const infoRequestIdRef = useRef(0)
  const drawRequestIdRef = useRef(0)

  if (visible && !previousVisibleRef.current) {
    openKeyRef.current += 1
  }
  if (!visible && previousVisibleRef.current) {
    openKeyRef.current += 1
  }
  previousVisibleRef.current = visible
  const currentOpenKey = visible ? openKeyRef.current : 0
  const isCurrentOpen = visible && state.openKey === currentOpenKey
  const displayInfo = isCurrentOpen ? state.info : null
  const displayReward = isCurrentOpen ? state.reward : null
  const displayDrawing = isCurrentOpen ? state.drawing : false

  useEffect(() => {
    infoRequestIdRef.current += 1
    drawRequestIdRef.current += 1
    if (!visible) {
      return
    }
    const requestOpenKey = currentOpenKey
    const requestId = infoRequestIdRef.current
    setState({ openKey: requestOpenKey, info: null, reward: null, drawing: false })
    getLotteryInfo().then((nextInfo) => {
      if (openKeyRef.current === requestOpenKey && infoRequestIdRef.current === requestId) {
        setState({ openKey: requestOpenKey, info: nextInfo, reward: null, drawing: false })
      }
    })
    return () => {
      infoRequestIdRef.current += 1
      drawRequestIdRef.current += 1
    }
  }, [visible, currentOpenKey])

  const startDraw = () => {
    if (displayDrawing || !displayInfo || displayInfo.times <= 0) {
      return
    }
    const requestOpenKey = currentOpenKey
    const requestId = ++drawRequestIdRef.current
    setState((current) => (current.openKey === requestOpenKey ? { ...current, drawing: true } : current))
    drawLottery()
      .then((nextReward) => {
        if (openKeyRef.current !== requestOpenKey || drawRequestIdRef.current !== requestId) {
          return
        }
        setState((current) =>
          current.openKey === requestOpenKey
            ? {
                openKey: requestOpenKey,
                info: current.info ? { ...current.info, times: nextReward.times } : current.info,
                reward: nextReward,
                drawing: false,
              }
            : current,
        )
      })
      .finally(() => {
        if (openKeyRef.current === requestOpenKey && drawRequestIdRef.current === requestId) {
          setState((current) => (current.openKey === requestOpenKey ? { ...current, drawing: false } : current))
        }
      })
  }

  return (
    <Popup visible={visible} close={close} panelStyle={{ width: '6.5rem' }}>
      <section className="home-dialog lottery-dialog">
        <button className="home-dialog-close" type="button" aria-label="关闭抽奖弹窗" onClick={close}>
          x
        </button>
        <h2>幸运抽奖</h2>
        <p className="lottery-times">剩余抽奖次数：{displayInfo?.times ?? '--'}</p>
        <div className="lottery-grid">
          {displayInfo?.lotteryInfo.map((item) => (
            <div className="lottery-item" key={`${item.id}-${item.name}`}>
              <img src={item.icon} alt="" />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
        <button className="lottery-start" type="button" disabled={displayDrawing || !displayInfo || displayInfo.times <= 0} onClick={startDraw}>
          {displayDrawing ? '抽奖中...' : '开始抽奖'}
        </button>
        {displayReward ? (
          <div className="lottery-result">
            <img src={displayReward.rewardInfo.rewardLogo} alt="" />
            <span>获得{displayReward.rewardInfo.rewardName}</span>
          </div>
        ) : null}
      </section>
    </Popup>
  )
}
