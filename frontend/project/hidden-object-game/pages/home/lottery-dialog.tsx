import { useEffect, useRef, useState } from 'react'
import { Popup } from '../../components/popup'
import { drawLottery, getLotteryInfo, type LotteryInfo, type LotteryReward } from '../../mock/mock-service'

type LotteryDialogProps = {
  visible: boolean
  close: () => void
}

type LotteryDialogState = {
  info: LotteryInfo | null
  reward: LotteryReward | null
  drawing: boolean
}

const initialLotteryState: LotteryDialogState = {
  info: null,
  reward: null,
  drawing: false,
}

export const LotteryDialog = ({ visible, close }: LotteryDialogProps) => {
  const [state, setState] = useState<LotteryDialogState>(initialLotteryState)
  const infoRequestIdRef = useRef(0)
  const drawRequestIdRef = useRef(0)

  useEffect(() => {
    infoRequestIdRef.current += 1
    drawRequestIdRef.current += 1
    if (!visible) {
      return
    }
    const requestId = infoRequestIdRef.current
    getLotteryInfo().then((nextInfo) => {
      if (infoRequestIdRef.current === requestId) {
        setState({ info: nextInfo, reward: null, drawing: false })
      }
    })
    return () => {
      infoRequestIdRef.current += 1
      drawRequestIdRef.current += 1
    }
  }, [visible])

  const handleClose = () => {
    infoRequestIdRef.current += 1
    drawRequestIdRef.current += 1
    setState(initialLotteryState)
    close()
  }

  const startDraw = () => {
    if (state.drawing || !state.info || state.info.times <= 0) {
      return
    }
    const requestId = ++drawRequestIdRef.current
    const infoRequestId = ++infoRequestIdRef.current
    setState((current) => ({ ...current, drawing: true }))
    drawLottery()
      .then((nextReward) => {
        if (drawRequestIdRef.current !== requestId) {
          return
        }
        setState((current) =>
          current.info
            ? {
                info: { ...current.info, times: nextReward.times },
                reward: nextReward,
                drawing: false,
              }
            : current,
        )
        getLotteryInfo().then((nextInfo) => {
          if (drawRequestIdRef.current === requestId && infoRequestIdRef.current === infoRequestId) {
            setState((current) => ({ ...current, info: nextInfo }))
          }
        })
      })
      .finally(() => {
        if (drawRequestIdRef.current === requestId) {
          setState((current) => ({ ...current, drawing: false }))
        }
      })
  }

  return (
    <Popup visible={visible} close={handleClose} panelStyle={{ width: '6.5rem' }}>
      <section className="home-dialog lottery-dialog">
        <button className="home-dialog-close" type="button" aria-label="关闭抽奖弹窗" onClick={handleClose}>
          x
        </button>
        <h2>幸运抽奖</h2>
        <p className="lottery-times">剩余抽奖次数：{state.info?.times ?? '--'}</p>
        <div className="lottery-grid">
          {state.info?.lotteryInfo.map((item) => (
            <div className="lottery-item" key={`${item.id}-${item.name}`}>
              <img src={item.icon} alt="" />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
        <button className="lottery-start" type="button" disabled={state.drawing || !state.info || state.info.times <= 0} onClick={startDraw}>
          {state.drawing ? '抽奖中...' : '开始抽奖'}
        </button>
        {state.reward ? (
          <div className="lottery-result">
            <img src={state.reward.rewardInfo.rewardLogo} alt="" />
            <span>获得{state.reward.rewardInfo.rewardName}</span>
          </div>
        ) : null}
      </section>
    </Popup>
  )
}
