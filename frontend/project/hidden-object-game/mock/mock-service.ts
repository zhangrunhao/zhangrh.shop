import homeJson from './fixtures/api-home.json'
import venueJson from './fixtures/api-venue-trial.json'
import submitWinJson from './fixtures/api-submit-win.json'
import reduceJson from './fixtures/api-reduce.json'
import addTipJson from './fixtures/api-add-tip.json'
import prizeJson from './fixtures/api-prize-lot.json'
import lotteryJson from './fixtures/api-lottery.json'
import rewardJson from './fixtures/api-reward.json'
import userJson from './fixtures/api-user.json'
import type {
  ApiResponse,
  HomeData,
  LotteryInfo,
  LotteryReward,
  PrizeItem,
  RewardDialogData,
  TargetElement,
  VenueData,
} from './types'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

type GameState = {
  venue: VenueData
  lotteryTimes: number
}

const createInitialState = (): GameState => {
  const venue = clone((venueJson as ApiResponse<VenueData>).data)
  const firstTarget = venue.elementPic.find((item) => !item.isFind) ?? null
  venue.nextFind = firstTarget
  venue.elementFoundNum = venue.elementPic.filter((item) => item.isFind).length
  venue.tipNum = Math.max(venue.tipNum, 1)
  venue.tipCode = venue.tipNum > 0 ? 2 : 1
  return {
    venue,
    lotteryTimes: clone((lotteryJson as ApiResponse<LotteryInfo>).data).times,
  }
}

let state = createInitialState()

const wait = async <T>(value: T): Promise<T> => {
  await new Promise((resolve) => window.setTimeout(resolve, 120))
  return clone(value)
}

const refreshNextTarget = () => {
  state.venue.nextFind = state.venue.elementPic.find((item) => !item.isFind) ?? null
  state.venue.elementFoundNum = state.venue.elementPic.filter((item) => item.isFind).length
  state.venue.tipCode = state.venue.tipNum > 0 && state.venue.nextFind ? 2 : 1
}

export const resetMockGame = () => {
  state = createInitialState()
}

export const getHome = async () => wait(clone((homeJson as ApiResponse<HomeData>).data))

export const getVenue = async (_barrierId: number | string) => wait(state.venue)

export const submitTarget = async (eid: string) => {
  const target = state.venue.elementPic.find((item: TargetElement) => item.eid === eid)
  if (target) {
    target.isFind = true
  }
  state.venue.rewardReceivedNum = Math.min(state.venue.rewardAllNum, state.venue.rewardReceivedNum + 1)
  refreshNextTarget()
  const data = clone((submitWinJson as ApiResponse<RewardDialogData>).data)
  data.hasReward = true
  return wait(data)
}

export const reduceTip = async () => {
  state.venue.tipNum = Math.max(0, state.venue.tipNum - 1)
  refreshNextTarget()
  return wait(clone((reduceJson as ApiResponse<{ tipNum: number; reduceResult: boolean }>).data))
}

export const addTip = async () => {
  state.venue.tipNum += 1
  refreshNextTarget()
  return wait(clone((addTipJson as ApiResponse<{ tipNum: number }>).data))
}

export const getPrizeList = async () => wait(clone((prizeJson as ApiResponse<PrizeItem[]>).data))

export const getLotteryInfo = async () => {
  const data = clone((lotteryJson as ApiResponse<LotteryInfo>).data)
  data.times = state.lotteryTimes
  return wait(data)
}

export const drawLottery = async () => {
  state.lotteryTimes = Math.max(0, state.lotteryTimes - 1)
  const data = clone((rewardJson as ApiResponse<LotteryReward>).data)
  data.times = state.lotteryTimes
  return wait(data)
}

export const getUserInfo = async () => wait(clone(userJson.data))
