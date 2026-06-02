import Global from '../Class/Global'
import Resource from '../Class/Resource'
import Hilo from 'hilo'
import { judgeEqualArray, randomNumBoth } from '../Util/util'
import Types from './result_types.json'
import Map from './result_map.json'

export default class Result {
  constructor () {
    this.queue = new Hilo.LoadQueue()
    this.resource = new Resource()
    this.types = Types
    this.map = Map
  }
  /**
   * 判断在游戏区的组合是否正确
   * @param {Array} btns 游戏区按钮的组合
   */
  checkCorrect (btns) {
    const btnIds = btns.map(i => {
      return i.info.id
    })
    const res = this.map.filter(i => {
      return judgeEqualArray(i.ids, btnIds)
    })
    return res
  }
  /**
   * 判断某个类型下的位置是否正确
   * @param {String} type 类型
   * @param {Array} originPosition 需要判断的位置
   */
  checkPositionCorrect (type, ori) {
    let flag = false
    const maybe = [] // 所有的可能性
    ori.forEach(i => {
      ori.forEach(ii => {
        if (i.pos !== ii.pos) {
          maybe.push({
            name: `${i.pos}_${ii.pos}`,
            x: ii.x - i.x,
            y: ii.y - i.y
          })
        }
      })
    })
    const corPo = type.postion
    Object.keys(corPo).map(po => {
      maybe.forEach(mb => {
        if (po === mb.name) {
          if (
            mb.x >= Math.min(...corPo[po].x) &&
            mb.x <= Math.max(...corPo[po].x) &&
            mb.y >= Math.min(...corPo[po].y) &&
            mb.y <= Math.max(...corPo[po].y)
          ) {
            flag = true
          }
        }
      })
    })
    return flag
  }
  /**
   * 加载分享页需要的静态资源
   * @param {Object} res 结果信息
   * @param {Function} cb 资源加载完成回调函数
   */
  toLoadShareAsset (map, cb) {
    if (this.queue.tag === 'isWasted') {
      this.queue._source.forEach(i => {
        i.content.src = ''
        i.content = null
        i = null
      })
      this.queue = null
      this.queue = new Hilo.LoadQueue()
    }
    this.queue.off('complete')
    this.queue.on('complete', () => {
      if (cb instanceof Function) cb(this.queue)
    })
    const publibPath = this.resource.getAssetPath()
    map.forEach(i => {
      this.queue.add({
        noCache: Global.noCache,
        crossOrigin: Global.crossOrigin,
        id: i,
        src: `${publibPath}/${i}?version=${Global.assetVersion}`
      })
    })

    if (Global.isWX) {
      this.queue.add({
        noCache: Global.noCache,
        crossOrigin: Global.crossOrigin,
        id: 'user_avatar',
        src: Global.userInfo.headUrl
      })
    }

    this.queue.start()
  }
  /**
   * 根据结果信息生成需要加载的静态资源
   * @param {Object} info 结果信息
   * @returns {Object} 需要加载的资源路径
   */
  createShareAsset (info) {
    let assteMap = {
      // transition: [],
      sprite: [],
      info: {}
    }
    // for (let i = 0; i <= 22; i++) {
    //   assteMap.transition.push(`share/transition/${info.id}/${i}.jpg`)
    // }
    for (let i = 0; i <= 12; i++) {
      // const src = `share/sprite/${info.id}/${i < 10 ? `0${i}` : i}.png`
      const src = `share/sprite/${info.id}/${i}.png`
      assteMap.sprite.push(src)
    }
    if (info.sort === 'normal') {
      const vNum = randomNumBoth(1, info.count.poetry)
      assteMap.info = {
        word: `share/normal/${info.id}/w.png`,
        pronounce: `share/normal/${info.id}/p.png`,
        explain: `share/normal/${info.id}/e${randomNumBoth(1, info.count.explain)}.png`,
        verse: `share/normal/${info.id}/v${vNum}.png`,
        verse_explain: `share/normal/${info.id}/v${vNum}e.png`,
        verse_picture: `share/normal/${info.id}/v${vNum}p.png`
      }
    } else if (info.sort === 'rare') {
      assteMap.info = {
        word: `share/rare/${info.id}/w.png`,
        pronounce: `share/rare/${info.id}/p.png`,
        explain: `share/rare/${info.id}/e.png`,
        diagram: `share/rare/${info.id}/d.png`,
        test: `share/rare/${info.id}/t${randomNumBoth(1, info.count)}.png`
      }
    } else {
      throw new Error('出现sort既不是normal也不是rare的结果!')
    }
    return assteMap
  }
}
