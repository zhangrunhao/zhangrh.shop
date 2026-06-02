import info from './resinfo'
import {
  getRandomElementFromArray
} from '../../../legacy/utils/legacy-utils.js'

export default (res) => {
  const content = getRandomElementFromArray(info[res.gender][res.num])
  const text = content.distinction ? content[res.state] : content['text']
  content.content = text.map(i => {
    return i.replace(/\$/, res.name)
  })
  return content
}
