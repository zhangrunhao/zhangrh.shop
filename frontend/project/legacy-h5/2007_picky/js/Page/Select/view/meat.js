import SelectPanel from './SelectPanel'
import info from '../../../Info/meat.json'
export default class MeatView extends SelectPanel {
  constructor (asset, flag) {
    super(asset, 1550, info, 'meat', flag)
  }
}
