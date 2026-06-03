
import info from '../../../Info/vegetable.json'
import SelectPanel from './SelectPanel'
export default class VegetableView extends SelectPanel {
  constructor (asset, flag) {
    super(asset, 2050, info, 'vegetable', flag)
  }
}
