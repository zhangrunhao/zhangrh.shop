import SelectPanel from './SelectPanel'
import info from '../../../Info/other.json'
export default class OtherView extends SelectPanel {
  constructor (asset, flag) {
    super(asset, 800, info, 'other', flag)
  }
}
