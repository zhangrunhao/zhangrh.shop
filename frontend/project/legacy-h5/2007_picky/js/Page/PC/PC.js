import $ from '$'
import Handlebars from 'handlebars'
import pcTemplateSource from './PC.hbs?raw'
import './PC.less'

const PCHbs = Handlebars.compile(pcTemplateSource)

export default class PCPage {
  constructor () {
    this.html = PCHbs()
  }
  show () {
    $('#App').hide()
    $('body').html(this.html)
  }
}
