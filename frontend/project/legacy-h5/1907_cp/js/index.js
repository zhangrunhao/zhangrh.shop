import '../../legacy/styles/reset.css'
import '../style/index.less'
import App from './Class/App'
document.addEventListener('touchmove', function (e) {
  e.preventDefault()
}, {
  passive: false
})
const app = new App()
app.init()
