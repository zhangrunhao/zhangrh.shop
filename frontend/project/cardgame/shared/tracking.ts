import { track } from '../../../common/track'

export const CARDGAME_EVENTS = [
  'cardgame_page_load',
  'create_room_click',
  'join_room_click',
  'ai_battle_click',
  'play_cards_click',
  'round_confirm_click',
  'play_again_click',
] as const

export type CardgameEvent = (typeof CARDGAME_EVENTS)[number]

export const trackCardgameEvent = (event: CardgameEvent) =>
  track({ event, project: 'cardgame' })
