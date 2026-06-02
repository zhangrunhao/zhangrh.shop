import { useEffect, useState } from 'react'
import { Popup } from '../../components/popup'
import { drawLottery, getLotteryInfo, type LotteryInfo, type LotteryReward } from '../../mock/mock-service'

type LotteryDialogProps = {
  visible: boolean
  close: () => void
}

export const LotteryDialog = ({ visible, close }: LotteryDialogProps) => {
  const [info, setInfo] = useState<LotteryInfo | null>(null)
  const [reward, setReward] = useState<LotteryReward | null>(null)
  const [drawing, setDrawing] = useState(false)

  useEffect(() => {
    if (!visible) {
      return
    }
    let mounted = true
    setReward(null)
    getLotteryInfo().then((nextInfo) => {
      if (mounted) {
        setInfo(nextInfo)
      }
    })
    return () => {
      mounted = false
    }
  }, [visible])

  const startDraw = () => {
    if (drawing || !info || info.times <= 0) {
      return
    }
    setDrawing(true)
    drawLottery()
      .then((nextReward) => {
        setReward(nextReward)
        setInfo((current) => (current ? { ...current, times: nextReward.times } : current))
      })
      .finally(() => setDrawing(false))
  }

  return (
    <Popup visible={visible} close={close} panelStyle={{ width: '6.5rem' }}>
      <section className="home-dialog lottery-dialog">
        <button className="home-dialog-close" type="button" aria-label="关闭抽奖弹窗" onClick={close}>
          x
        </button>
        <h2>幸运抽奖</h2>
        <p className="lottery-times">剩余抽奖次数：{info?.times ?? '--'}</p>
        <div className="lottery-grid">
          {info?.lotteryInfo.map((item) => (
            <div className="lottery-item" key={`${item.id}-${item.name}`}>
              <img src={item.icon} alt="" />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
        <button className="lottery-start" type="button" disabled={drawing || !info || info.times <= 0} onClick={startDraw}>
          {drawing ? '抽奖中...' : '开始抽奖'}
        </button>
        {reward ? (
          <div className="lottery-result">
            <img src={reward.rewardInfo.rewardLogo} alt="" />
            <span>获得{reward.rewardInfo.rewardName}</span>
          </div>
        ) : null}
      </section>
    </Popup>
  )
}
