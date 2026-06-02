// 展示, 或者隐藏其他Dom元素
import NewDom from '../NewDom'
export default class OtherDom {
  constructor (asset, name, params) {
    this.name = name
    this.asset = asset
    this.domArr = []
    this.cardView = params.cardObject.view
    this.headView = params.cardObject.head
    this.headPosition = params.headPosition
  }
  showGif () {
    const headGif = this.asset.getContent('head.gif')
    headGif.className = 'gif'
    let headGifNewDom = null
    switch (this.name) {
      case 'c1':
        headGifNewDom = new NewDom(headGif, {
          top: this.headPosition.y,
          left: this.headPosition.x,
          width: 638 + 4,
          height: 220
        })
        break
      case 'c2':
        headGifNewDom = new NewDom(headGif, {
          top: this.headPosition.y,
          left: this.headPosition.x,
          width: 638 + 4,
          height: 220
        })
        break
      case 'c5':
        headGifNewDom = new NewDom(headGif, {
          top: this.headPosition.y,
          left: this.headPosition.x,
          width: 638 + 4,
          height: 220
        })
        break
      default:
        headGifNewDom = new NewDom(headGif, {
          top: this.headPosition.y,
          left: this.headPosition.x,
          width: 636,
          height: 220
        })
        break
    }

    headGifNewDom.listenChange()
    this.domArr.push(headGifNewDom)
    this.headView.removeFromParent()
    document.body.appendChild(headGif)

    const videoGif = this.asset.getContent('video.gif')
    videoGif.className = 'gif'
    const videoGifNewDom = new NewDom(videoGif, {
      top: 410,
      left: 126,
      width: 500,
      height: 281
    })
    videoGifNewDom.listenChange()
    this.domArr.push(videoGifNewDom)
    document.body.appendChild(videoGif)
    videoGif.addEventListener('click', () => {
      this.showVideo()
    })
  }
  showVideo () {
    const videoDom = document.getElementById(`video_${this.name}`)
    const nextVideo = document.getElementById(`video_c${Number(this.name.charAt(1)) + 1}`)
    // TODO: 视频采用真正的预加载
    if (nextVideo) nextVideo.preload = 'auto'
    if (videoDom) {
      const videoNewDom = new NewDom(videoDom, {
        top: 410,
        left: 127,
        width: 500,
        height: 281
      })
      videoNewDom.listenChange()
      this.domArr.push(videoNewDom)
      videoDom.addEventListener('play', () => {
        videoDom.style.display = 'block'
      })
      videoDom.play()
    }
  }
  hideGif () {
    this.headView.addTo(this.cardView)
    const gifarr = document.getElementsByClassName('gif')
    const l = gifarr.length
    for (var i = 0; i < l; i++) {
      document.body.removeChild(gifarr[0])
    }
  }
  heideOhterDom () {
    this.hideVideo()
    this.hideGif()
  }
  hideVideo () {
    const videoDom = document.getElementById(`video_${this.name}`)
    if (videoDom) {
      videoDom.pause()
      videoDom.style.display = 'none'
    }
  }
  scroll (y) {
    this.domArr.forEach(i => {
      i.fouceSetStyle('top', i.fixPostionValue('top', y))
    })
  }
}
