/**
 * 加载页
 * 现在加载进度百分比
 */
import $ from '$'
import Handlebars from 'handlebars'
import Page from '../../Class/Page'
import asset from './asset'
import './Load.less'
import loadTemplateSource from './Load.hbs?raw'

const loadHbs = Handlebars.compile(loadTemplateSource)

export default class Load extends Page {
  constructor () {
    super()
    this.asset = asset
  }
  setRate (rate) {
    $('#Load').find('.rate').text(rate)
  }
  render () {
    var html = loadHbs()
    return html
  }
  hide () {
    $('#Load').hide()
  }
}
