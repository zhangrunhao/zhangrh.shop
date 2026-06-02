import Hilo from 'hilo'
import Global from '../Global'
export default (commonAsset, asset, params) => {
  // 构成视图, 应该放到其他地方, 以便简化代码
  const view = new Hilo.Container({
    // background: 'red',
    width: Global.width,
    height: Global.height
  })
  new Hilo.Bitmap({
    x: 28,
    y: 30,
    image: commonAsset.getContent('logo.png')
  }).addTo(view)

  new Hilo.Bitmap({
    x: 45,
    y: 206,
    image: commonAsset.getContent('frame.png')
  }).addTo(view)

  new Hilo.Bitmap({
    x: 126,
    y: 410,
    image: asset.getContent('video.png')
  }).addTo(view)
  new Hilo.Bitmap({
    x: 110,
    y: 740,
    image: asset.getContent('intro.png')
  }).addTo(view)
  new Hilo.Bitmap({
    x: 284,
    y: 266,
    image: asset.getContent('year.png')
  }).addTo(view)
  new Hilo.Bitmap({
    x: 115,
    y: 330,
    image: asset.getContent('title.png')
  }).addTo(view)
  new Hilo.Bitmap({
    x: 312,
    y: 956,
    image: asset.getContent('time.png')
  }).addTo(view)
  const head = new Hilo.Bitmap({
    x: params.headPosition.x,
    y: params.headPosition.y,
    image: asset.getContent('head.png')
  }).addTo(view)

  const scrollTipView = new Hilo.Bitmap({
    x: 376,
    y: 1036,
    image: commonAsset.getContent('scroll_tip.png')
  }).addTo(view)

  const scrollDocView = new Hilo.Bitmap({
    x: 376,
    y: 1066,
    image: commonAsset.getContent('scroll_doc.png')
  }).addTo(view)

  const scrollViewTween = new Hilo.Tween(scrollTipView, {
    alpha: 1,
    y: 1036
  }, {
    alpha: 0,
    y: 970
  }, {
    duration: 3000,
    loop: true
  })

  new Hilo.Tween(scrollDocView, {
    y: 1066 - 5
  }, {
    y: 1066 + 5
  }, {
    // ease: Hilo.Ease.Bounce.EaseOut,
    reverse: true,
    duration: 500,
    loop: true
  }).start()

  return {
    view,
    scrollViewTween,
    head,
    scrollView: {
      scrollTipView,
      scrollDocView
    }
  }
}
