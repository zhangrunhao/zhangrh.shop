
import info from '../../../Info/fruit.json'
import SelectPanel from './SelectPanel'
export default class FruitView extends SelectPanel {
  constructor (asset, flag) {
    super(asset, 1200, info, 'fruit', flag)
  }
}
