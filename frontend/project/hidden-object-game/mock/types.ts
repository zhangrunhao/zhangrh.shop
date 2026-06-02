export type ApiResponse<T> = {
  statusMsg: string
  statusCode: string | number
  data: T
}

export type VenueSummary = {
  barrierId: number
  barrierName: string
  abscissa: number
  ordinate: number
  width: number
  height: number
  open: boolean
  startTime?: string
  passed?: boolean
  colourStadiumPicUrl: string
  grayStadiumPicUrl: string
}

export type TargetElement = {
  eid: string
  uid: number
  isFind: boolean
  ordinate: number
  name: string
  width: number
  url: string
  abscissa: number
  height: number
  status: string
  findId?: string
}

export type HomeData = {
  activityBackgroundMusic: string
  activityEndTime: string
  activityId: number
  activityName: string
  activityRule: string
  activityStartTime: string
  homepageBgImage: string
  homepageHeight: number
  homepageWidth: number
  largeTurntableImage: string
  largeTurntableLotteryId: number
  largeTurntableLotteryNumber: number
  simpleBarrierInfos: VenueSummary[]
}

export type VenueData = {
  tipCode: number
  tipNum: number
  elementAllNum: number
  redPackRate: number
  nextFind: TargetElement | null
  elementFoundNum: number
  awardIndex: string
  barrierName: string
  blessingBagPic: string
  rewardReceivedNum: number
  barrierId: number
  rewardAllNum: number
  elementPic: TargetElement[]
  gameBgPic: Array<{
    url: string
    width: number
    height: number
    status: string
  }>
  activityBackgroundMusic: string
}

export type RewardDialogData = {
  giftType: 1 | 2 | 3 | 4 | 5
  rewardLogo: string
  rewardName: string
  hasReward: boolean
}

export type PrizeItem = {
  giftType: number
  recharged: boolean
  rewardId: number
  rewardLogo?: string
  rewardName: string
  ticketId: number
  ticketName?: string
  unchargedTitle?: string
  chargedTitle?: string
}

export type LotteryInfo = {
  lotteryInfo: Array<{
    name: string
    icon: string
    id: number
    value?: number
    rewardLogo?: string
    rewardName?: string
  }>
  times: number
}

export type LotteryReward = {
  periodId: number
  times: number
  rewardInfo: {
    rewardLogo: string
    rewardName: string
    giftType: number
    tgId: number
    ticketId: number
    ticketName: string
  }
}
