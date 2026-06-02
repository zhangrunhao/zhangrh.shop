import { Popup } from '../../components/popup'

type RewardDialogProps = {
  visible: boolean
  content: string
  icon: string
  type: number
  close: () => void
  openLottery: () => void
}

export const RewardDialog = ({ visible, content, icon, type, close, openLottery }: RewardDialogProps) => {
  const handleOpenLottery = () => {
    close()
    openLottery()
  }

  return (
    <Popup visible={visible} close={close} panelStyle={{ width: '100%', height: '100%' }} maskOpacity={0.8}>
      <div className="reward-dialog">
        <button className="reward-dialog-close-layer" type="button" onClick={close} aria-label="关闭奖励弹窗" />
        <div className="reward-dialog-title">恭喜获得！</div>
        <div className="reward-dialog-card">
          <div className="reward-dialog-icon" style={{ backgroundImage: `url(${icon})` }} />
          <div className="reward-dialog-content">{content}</div>
          {type === 5 ? (
            <button className="reward-dialog-button" type="button" onClick={handleOpenLottery}>
              去抽奖
            </button>
          ) : null}
        </div>
        <button className="reward-dialog-close" type="button" onClick={close} aria-label="关闭" />
      </div>
    </Popup>
  )
}
