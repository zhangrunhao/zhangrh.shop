import { useEffect, useRef, useState } from 'react'
import { Popup } from '../../components/popup'
import { useToast } from '../../components/toast'
import { getPrizeList, type PrizeItem } from '../../mock/mock-service'

type PrizeDialogProps = {
  visible: boolean
  close: () => void
}

export const PrizeDialog = ({ visible, close }: PrizeDialogProps) => {
  const [prizes, setPrizes] = useState<PrizeItem[]>([])
  const [loading, setLoading] = useState(false)
  const requestIdRef = useRef(0)
  const { showToast } = useToast()

  useEffect(() => {
    requestIdRef.current += 1
    if (!visible) {
      return
    }
    const requestId = requestIdRef.current
    setPrizes([])
    setLoading(true)
    getPrizeList()
      .then((list) => {
        if (requestIdRef.current === requestId) {
          setPrizes(list)
        }
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setLoading(false)
        }
      })
    return () => {
      requestIdRef.current += 1
    }
  }, [visible])

  return (
    <Popup visible={visible} close={close} panelStyle={{ width: '6.4rem' }}>
      <section className="home-dialog prize-dialog">
        <button className="home-dialog-close" type="button" aria-label="关闭奖品弹窗" onClick={close}>
          x
        </button>
        <h2>我的奖品</h2>
        <div className="prize-list">
          {loading ? <p className="dialog-state">加载中...</p> : null}
          {!loading && prizes.length === 0 ? <p className="dialog-state">暂无奖品</p> : null}
          {prizes.map((prize) => (
            <article className="prize-item" key={`${prize.ticketId}-${prize.rewardId}-${prize.rewardName}`}>
              <div className="prize-icon">{prize.rewardLogo ? <img src={prize.rewardLogo} alt="" /> : null}</div>
              <div className="prize-title">{prize.rewardName || prize.ticketName || '奖品'}</div>
              <button className="prize-action" type="button" onClick={() => showToast('演示模式不支持领取或使用奖品')}>
                {prize.recharged ? prize.chargedTitle || '已使用' : prize.unchargedTitle || '使用'}
              </button>
            </article>
          ))}
        </div>
      </section>
    </Popup>
  )
}
