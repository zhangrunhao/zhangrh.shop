import { Popup } from '../../components'

type RuleDialogProps = {
  visible: boolean
  imageUrl: string
  close: () => void
}

export const RuleDialog = ({ visible, imageUrl, close }: RuleDialogProps) => (
  <Popup visible={visible} close={close} panelStyle={{ width: '100%', height: '100%' }}>
    <button className="rule-dialog" type="button" onClick={close}>
      <img src={imageUrl} alt="活动规则" />
    </button>
  </Popup>
)
