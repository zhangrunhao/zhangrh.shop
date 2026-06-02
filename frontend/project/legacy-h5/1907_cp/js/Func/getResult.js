import {
  getWomanRule,
  getManRule
} from './getRule.js'
import getMaxAnswer from './getMaxAnswer.js'
export default (answer, info) => {
  const rule = info === 'man' ? getManRule() : getWomanRule()
  let res = {}
  answer.forEach(ans => {
    if (rule[ans.topic]) {
      const key = rule[ans.topic][ans.answer]
      if (res[key]) {
        res[key] += 1
      } else {
        res[key] = 1
      }
    }
  })
  return getMaxAnswer(res)
}
