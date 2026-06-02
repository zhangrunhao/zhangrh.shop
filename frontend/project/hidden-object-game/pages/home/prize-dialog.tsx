import { useEffect, useRef, useState } from 'react'
import { Popup, useToast } from '../../components'
import { getPrizeList, type PrizeItem } from '../../mock/mock-service'

type PrizeDialogProps = {
  visible: boolean
  close: () => void
}

type PrizeDialogState = {
  prizes: PrizeItem[]
  loading: boolean
}

const initialPrizeState: PrizeDialogState = {
  prizes: [],
  loading: true,
}

export const PrizeDialog = ({ visible, close }: PrizeDialogProps) => {
  const [state, setState] = useState<PrizeDialogState>(initialPrizeState)
  const requestIdRef = useRef(0)
  const { showToast } = useToast()

  useEffect(() => {
    if (!visible) {
      return
    }
    const requestId = ++requestIdRef.current
    getPrizeList()
      .then((list) => {
        if (requestIdRef.current === requestId) {
          setState({ prizes: list, loading: false })
        }
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setState((current) => ({ ...current, loading: false }))
        }
      })
    return () => {
      requestIdRef.current += 1
    }
  }, [visible])

  const handleClose = () => {
    requestIdRef.current += 1
    setState(initialPrizeState)
    close()
  }

  return (
    <Popup visible={visible} close={handleClose} panelStyle={{ width: '6.4rem' }}>
      <section className="home-dialog prize-dialog">
        <button className="home-dialog-close" type="button" aria-label="关闭奖品弹窗" onClick={handleClose}>
          x
        </button>
        <h2>我的奖品</h2>
        <div className="prize-list">
          {state.loading ? <p className="dialog-state">加载中...</p> : null}
          {!state.loading && state.prizes.length === 0 ? <p className="dialog-state">暂无奖品</p> : null}
          {state.prizes.map((prize) => (
            <article className="prize-item" key={`${prize.ticketId}-${prize.rewardId}-${prize.rewardName}`}>
              <div className="prize-icon">{prize.rewardLogo ? <img src={prize.rewardLogo} alt="" /> : null}</div>
              <div className="prize-copy">
                <div className="prize-title">{prize.rewardName || '奖品'}</div>
                {prize.ticketName ? <div className="prize-ticket">{prize.ticketName}</div> : null}
              </div>
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
