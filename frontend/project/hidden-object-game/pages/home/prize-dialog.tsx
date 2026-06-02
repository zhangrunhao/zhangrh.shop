import { useEffect, useState } from 'react'
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
  const { showToast } = useToast()

  useEffect(() => {
    if (!visible) {
      return
    }
    let mounted = true
    setLoading(true)
    getPrizeList()
      .then((list) => {
        if (mounted) {
          setPrizes(list)
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })
    return () => {
      mounted = false
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
              <button className="prize-action" type="button" onClick={() => showToast('当前为本地演示，暂不可操作')}>
                {prize.recharged ? prize.chargedTitle || '已使用' : prize.unchargedTitle || '使用'}
              </button>
            </article>
          ))}
        </div>
      </section>
    </Popup>
  )
}
