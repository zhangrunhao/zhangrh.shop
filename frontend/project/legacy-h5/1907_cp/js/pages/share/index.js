import Hilo from 'hilo'
import asset from './asset'
import NewDom from '../../Class/NewDom'
import Topic from '../../Class/Topic'
export default class Share extends Topic {
  constructor (p) {
    super(p)
    this.asset = asset
  }
  toCreateView (info) {
    const content = new Hilo.Container()
    new Hilo.Bitmap({
      image: info.img
    }).addTo(content)

    new Hilo.Bitmap({
      x: 92,
      y: 1216,
      image: asset.getContent('logo.jpg')
    }).addTo(content)

    new Hilo.Bitmap({
      x: 530,
      y: 1080,
      image: asset.getContent('code.png')
    }).addTo(content)

    const c = new Hilo.Container({
      x: 94,
      y: 212
    }).addTo(content)
    new Hilo.Text({
      color: 'black',
      text: info.name
    }).setFont('36px arial').addTo(c)
    const position = [
      {
        x: 64,
        y: 730 + 5
      },
      {
        x: 384,
        y: 730 + 5
      },
      {
        x: 64,
        y: 986 + 5
      },
      {
        x: 384,
        y: 986 + 5
      }
    ]
    info.content.map((c, i) => {
      const con = new Hilo.Container({
        x: position[i].x,
        y: position[i].y,
        width: 302,
        height: 40
      }).addTo(content)
      new Hilo.Text({
        align: Hilo.align.TOP,
        color: 'white',
        text: c,
        maxWidth: 320,
        outline: false
      }).setFont('26px arial').addTo(con)
    })
    return content
  }
  show (parent, time, info) {
    time = 1000
    this.view = this.toCreateView(info)
    this.view.addTo(parent.getStage(), 0)
    this.view.y = -1000
    Hilo.Tween.to(this.view, {
      y: -15
    }, {
      duration: time,
      onComplete: () => {
        parent.autoChange(true)
        parent.getTicker().nextTick(() => {
          this.showImage()
        })
      }
    })
  }
  showImage () {
    const canvas = document.getElementsByTagName('canvas')[0]
    const img = document.getElementById('shareImage')
    img.src = canvas.toDataURL()
    document.getElementById('app').style.display = 'none'
    img.style.display = 'block'
    document.getElementById('out').style.display = 'block'
    new NewDom(img, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',

      width: 750,
      height: 1464
    }).listenChange()
  }
}
