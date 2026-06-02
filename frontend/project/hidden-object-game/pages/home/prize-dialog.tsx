import { useEffect, useRef, useState } from 'react'
import { Popup } from '../../components/popup'
import { useToast } from '../../components/toast'
import { getPrizeList, type PrizeItem } from '../../mock/mock-service'

type PrizeDialogProps = {
  visible: boolean
  close: () => void
}

type PrizeDialogState = {
  openKey: number
  prizes: PrizeItem[]
  loading: boolean
}

export const PrizeDialog = ({ visible, close }: PrizeDialogProps) => {
  const [state, setState] = useState<PrizeDialogState>({
    openKey: 0,
    prizes: [],
    loading: false,
  })
  const openKeyRef = useRef(0)
  const previousVisibleRef = useRef(visible)
  const requestIdRef = useRef(0)
  const { showToast } = useToast()

  if (visible && !previousVisibleRef.current) {
    openKeyRef.current += 1
  }
  if (!visible && previousVisibleRef.current) {
    openKeyRef.current += 1
  }
  previousVisibleRef.current = visible
  const currentOpenKey = visible ? openKeyRef.current : 0
  const isCurrentOpen = visible && state.openKey === currentOpenKey
  const displayPrizes = isCurrentOpen ? state.prizes : []
  const displayLoading = visible && (!isCurrentOpen || state.loading)

  useEffect(() => {
    if (!visible) {
      return
    }
    const requestOpenKey = currentOpenKey
    const requestId = ++requestIdRef.current
    setState({ openKey: requestOpenKey, prizes: [], loading: true })
    getPrizeList()
      .then((list) => {
        if (openKeyRef.current === requestOpenKey && requestIdRef.current === requestId) {
          setState({ openKey: requestOpenKey, prizes: list, loading: false })
        }
      })
      .finally(() => {
        if (openKeyRef.current === requestOpenKey && requestIdRef.current === requestId) {
          setState((current) => (current.openKey === requestOpenKey ? { ...current, loading: false } : current))
        }
      })
    return () => {
      requestIdRef.current += 1
    }
  }, [visible, currentOpenKey])

  return (
    <Popup visible={visible} close={close} panelStyle={{ width: '6.4rem' }}>
      <section className="home-dialog prize-dialog">
        <button className="home-dialog-close" type="button" aria-label="关闭奖品弹窗" onClick={close}>
          x
        </button>
        <h2>我的奖品</h2>
        <div className="prize-list">
          {displayLoading ? <p className="dialog-state">加载中...</p> : null}
          {!displayLoading && displayPrizes.length === 0 ? <p className="dialog-state">暂无奖品</p> : null}
          {displayPrizes.map((prize) => (
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
