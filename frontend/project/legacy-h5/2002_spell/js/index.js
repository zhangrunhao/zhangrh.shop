import '../../legacy/styles/reset.css'
import '../style/index.less'
import App from './Class/App'
document.body.addEventListener('touchmove', function (e) {
  e.preventDefault()
}, {
  passive: false
})

const app = new App()
app.init()
