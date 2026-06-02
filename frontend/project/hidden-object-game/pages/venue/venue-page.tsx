import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loading } from '../../components/loading'
import { useToast } from '../../components/toast'
import {
  getVenue,
  reduceTip,
  submitTarget as submitTargetService,
  type RewardDialogData,
  type TargetElement,
  type VenueData,
} from '../../mock/mock-service'
import { RewardDialog } from './reward-dialog'
import { Stage, type ScrollPosition } from './stage'
import { TouchMask } from './touch-mask'
import './venue-page.css'

type VenuePageProps = {
  venueId: number
  goHome: () => void
  openLottery: () => void
}

type RewardState = {
  content: string
  icon: string
  type: number
}

const getScrollLimit = (stageSize: number, viewportSize: number) => Math.max(0, stageSize - viewportSize)

const getTargetScrollPosition = (
  target: TargetElement,
  scrollMaxX: number,
  scrollMaxY: number,
): ScrollPosition => {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const targetCenterX = target.abscissa + target.width / 2
  const targetCenterY = target.ordinate + target.height / 2
  const x = Math.min(scrollMaxX, Math.max(0, targetCenterX - viewportWidth / 2))
  const y = Math.min(scrollMaxY, Math.max(0, targetCenterY - viewportHeight / 2))

  return { x: -x, y: -y }
}

const rewardFromResponse = (reward: RewardDialogData): RewardState => ({
  content: reward.rewardName,
  icon: reward.rewardLogo,
  type: reward.giftType,
})

export const VenuePage = ({ venueId, goHome, openLottery }: VenuePageProps) => {
  const { showToast } = useToast()
  const [data, setData] = useState<VenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({ x: 0, y: 0 })
  const [hideChrome, setHideChrome] = useState(false)
  const [elementShow, setElementShow] = useState(true)
  const [scaleEid, setScaleEid] = useState('')
  const [rewardVisible, setRewardVisible] = useState(false)
  const [reward, setReward] = useState<RewardState>({ content: '', icon: '', type: 0 })
  const [musicEnabled, setMusicEnabled] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const refreshVenue = useCallback(async () => {
    const venue = await getVenue(venueId)
    setData(venue)
    document.title = venue.barrierName || '隐藏物品游戏'
    return venue
  }, [venueId])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getVenue(venueId).then((venue) => {
      if (!mounted) {
        return
      }
      setData(venue)
      setLoading(false)
      document.title = venue.barrierName || '隐藏物品游戏'
    })
    return () => {
      mounted = false
    }
  }, [venueId])

  const stageWidth = data?.gameBgPic[0]?.width ?? window.innerWidth
  const stageHeight = data?.gameBgPic[0]?.height ?? window.innerHeight
  const scrollMaxX = useMemo(() => getScrollLimit(stageWidth, window.innerWidth), [stageWidth])
  const scrollMaxY = useMemo(() => getScrollLimit(stageHeight, window.innerHeight), [stageHeight])

  const closeReward = useCallback(() => {
    setRewardVisible(false)
    setScaleEid('')
  }, [])

  const handleSubmitTarget = useCallback(
    async (eid: string) => {
      if (!data?.nextFind || eid !== data.nextFind.eid) {
        showToast('请先找到提示中的目标')
        return
      }

      const submitResult = await submitTargetService(eid)
      if (submitResult.hasReward) {
        setReward(rewardFromResponse(submitResult))
        setRewardVisible(true)
      }
      await refreshVenue()
      setScaleEid('')
    },
    [data?.nextFind, refreshVenue, showToast],
  )

  const handleWrongTarget = useCallback(() => {
    showToast(data?.nextFind ? '不是这个目标' : '本场馆目标已全部找到')
  }, [data?.nextFind, showToast])

  const tipMove = useCallback(async () => {
    if (!data?.nextFind) {
      showToast('没有可提示的目标')
      return
    }
    if (data.tipNum <= 0) {
      showToast('提示次数不足')
      return
    }

    const nextFind = data.nextFind
    setElementShow(true)
    setScrollPosition(getTargetScrollPosition(nextFind, scrollMaxX, scrollMaxY))
    setScaleEid(nextFind.eid)
    const reduceResult = await reduceTip()
    if (!reduceResult.reduceResult) {
      await refreshVenue()
      showToast('提示次数不足')
      setScaleEid('')
      return
    }
    await handleSubmitTarget(nextFind.eid)
  }, [data, handleSubmitTarget, refreshVenue, scrollMaxX, scrollMaxY, showToast])

  const toggleMusic = useCallback(() => {
    if (!data?.activityBackgroundMusic) {
      showToast('暂无背景音乐')
      return
    }
    if (!audioRef.current) {
      audioRef.current = new Audio(data.activityBackgroundMusic)
      audioRef.current.loop = true
    }
    if (musicEnabled) {
      audioRef.current.pause()
      setMusicEnabled(false)
      return
    }
    audioRef.current
      .play()
      .then(() => setMusicEnabled(true))
      .catch(() => {
        setMusicEnabled(false)
        showToast('点击后可开启音乐')
      })
  }, [data?.activityBackgroundMusic, musicEnabled, showToast])

  useEffect(
    () => () => {
      audioRef.current?.pause()
    },
    [],
  )

  if (loading || !data) {
    return <Loading progress={0.45} />
  }

  const foundCount = data.elementFoundNum
  const totalCount = data.elementAllNum
  const nextTarget = data.nextFind
  const rewardProgress = data.rewardAllNum > 0 ? data.rewardReceivedNum / data.rewardAllNum : 0

  return (
    <div className="venue-page">
      <Stage
        width={stageWidth}
        height={stageHeight}
        backgroundImages={data.gameBgPic}
        scrollPosition={scrollPosition}
        elementArr={data.elementPic}
        nextTargetId={nextTarget?.eid}
        submitTarget={handleSubmitTarget}
        onWrongTarget={handleWrongTarget}
        scaleEid={scaleEid}
        setScaleEid={setScaleEid}
      />

      {elementShow ? (
        <>
          <section className={`next-object-tip ${hideChrome ? 'venue-chrome-muted' : ''}`} aria-label="下一个目标">
            <div
              className={`next-target-icon ${foundCount === totalCount ? 'all-find' : ''}`}
              style={{ backgroundImage: nextTarget ? `url(${nextTarget.url})` : undefined }}
            />
            <div className="process-tip">{`${foundCount} / ${totalCount}`}</div>
            <button className="lottery-btn" type="button" onClick={openLottery}>
              抽奖
            </button>
          </section>

          <div className={`venue-btn-list ${hideChrome ? 'venue-chrome-muted' : ''}`}>
            <button
              className={`venue-icon-btn venue-music-btn ${musicEnabled ? '' : 'venue-music-btn-closed'}`}
              type="button"
              onClick={toggleMusic}
              aria-label={musicEnabled ? '关闭音乐' : '开启音乐'}
            />
            <button
              className="venue-icon-btn venue-prize-btn"
              type="button"
              onClick={() => showToast('奖品列表请回首页查看')}
              aria-label="奖品"
            />
            <button
              className={`venue-icon-btn venue-tip-btn ${data.tipNum > 0 && nextTarget ? '' : 'venue-tip-btn-disabled'}`}
              type="button"
              onClick={tipMove}
              aria-label="提示"
            >
              <span>{data.tipNum}</span>
            </button>
          </div>

          <div className={`venue-progress ${hideChrome ? 'venue-chrome-muted' : ''}`}>
            <div className="venue-progress-track">
              <div className="venue-progress-fill" style={{ width: `${Math.min(100, rewardProgress * 100)}%` }} />
            </div>
            <div className="venue-progress-text">{`${data.rewardReceivedNum} / ${data.rewardAllNum}`}</div>
          </div>

          <button className="venue-back-btn" type="button" onClick={goHome} aria-label="返回首页">
            首页
          </button>
        </>
      ) : null}

      <TouchMask
        scrollMaxX={scrollMaxX}
        scrollMaxY={scrollMaxY}
        startTouch={() => setHideChrome(true)}
        endTouch={() => setHideChrome(false)}
        setScrollPosition={setScrollPosition}
        switchElementShow={() => setElementShow((show) => !show)}
      />

      <RewardDialog
        visible={rewardVisible}
        content={reward.content}
        icon={reward.icon}
        type={reward.type}
        close={closeReward}
        openLottery={openLottery}
      />
    </div>
  )
}
