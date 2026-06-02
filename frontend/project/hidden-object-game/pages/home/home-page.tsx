import { useEffect, useState } from 'react'
import { Loading } from '../../components/loading'
import { getHome, getUserInfo, type HomeData } from '../../mock/mock-service'
import { LotteryDialog } from './lottery-dialog'
import { PrizeDialog } from './prize-dialog'
import { RuleDialog } from './rule-dialog'
import './home-page.css'

type HomePageProps = {
  openVenue: (venueId: number) => void
  openLotteryInitially?: boolean
  onLotteryInitialOpenConsumed?: () => void
}

export const HomePage = ({ openVenue, openLotteryInitially = false, onLotteryInitialOpenConsumed }: HomePageProps) => {
  const [data, setData] = useState<HomeData | null>(null)
  const [avatar, setAvatar] = useState('')
  const [ruleVisible, setRuleVisible] = useState(false)
  const [prizeVisible, setPrizeVisible] = useState(false)
  const [lotteryVisible, setLotteryVisible] = useState(false)

  useEffect(() => {
    let mounted = true
    Promise.all([getHome(), getUserInfo()]).then(([home, user]) => {
      if (!mounted) {
        return
      }
      setData(home)
      setAvatar(user.userIcon)
      document.title = home.activityName || '隐藏物品游戏'
    })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!openLotteryInitially) {
      return
    }
    setLotteryVisible(true)
    onLotteryInitialOpenConsumed?.()
  }, [onLotteryInitialOpenConsumed, openLotteryInitially])

  if (!data) {
    return <Loading progress={0.4} />
  }

  return (
    <div className="home-scroll">
      <div
        className="home-board"
        style={{
          width: `${data.homepageWidth / 100}rem`,
          height: `${data.homepageHeight / 100}rem`,
          backgroundImage: `url(${data.homepageBgImage})`,
        }}
      >
        <div className="home-avatar" style={{ backgroundImage: avatar ? `url(${avatar})` : undefined }} />
        <div className="home-actions">
          <button className="home-action home-action-rule" type="button" aria-label="规则" onClick={() => setRuleVisible(true)} />
          <button className="home-action home-action-prize" type="button" aria-label="奖品" onClick={() => setPrizeVisible(true)} />
          <button className="home-action home-action-lottery" type="button" aria-label="抽奖" onClick={() => setLotteryVisible(true)} />
        </div>
        {data.simpleBarrierInfos.map((venue) => (
          <button
            key={venue.barrierId}
            className="venue-card"
            type="button"
            style={{
              width: `${venue.width / 100}rem`,
              height: `${venue.height / 100}rem`,
              top: `${venue.ordinate / 100}rem`,
              left: `${venue.abscissa / 100}rem`,
              backgroundImage: `url(${venue.open ? venue.colourStadiumPicUrl : venue.grayStadiumPicUrl})`,
            }}
            onClick={() => venue.open && openVenue(venue.barrierId)}
          >
            {venue.passed ? <span className="venue-finished" /> : null}
          </button>
        ))}
      </div>
      <RuleDialog visible={ruleVisible} imageUrl={data.activityRule} close={() => setRuleVisible(false)} />
      <PrizeDialog visible={prizeVisible} close={() => setPrizeVisible(false)} />
      <LotteryDialog visible={lotteryVisible} close={() => setLotteryVisible(false)} />
    </div>
  )
}
