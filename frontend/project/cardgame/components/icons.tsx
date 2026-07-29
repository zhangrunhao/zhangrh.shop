import type { ReactNode } from 'react'

export type CardgameIconName =
  | 'create'
  | 'join'
  | 'bot'
  | 'help'
  | 'back'
  | 'sword'
  | 'shield'
  | 'heart'
  | 'hp'
  | 'alert'
  | 'deck'
  | 'discard'

type CardgameIconProps = {
  name: CardgameIconName
  className?: string
}

const ICON_CONTENT: Record<CardgameIconName, ReactNode> = {
  create: (
    <>
      <rect x="4" y="5" width="12" height="14" rx="2" />
      <path d="M8 9h4M10 7v4M16 9h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-8" />
    </>
  ),
  join: (
    <>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M11 8l4 4-4 4M15 12H4" />
    </>
  ),
  bot: (
    <>
      <rect x="4" y="7" width="16" height="12" rx="3" />
      <path d="M12 3v4M8 12h.01M16 12h.01M8 16h8" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9a2.4 2.4 0 1 1 3.8 1.95c-.9.65-1.6 1.08-1.6 2.05M12 17h.01" />
    </>
  ),
  back: <path d="M19 12H5M11 18l-6-6 6-6" />,
  sword: (
    <>
      <path d="M14 5l5-2-2 5L8 17l-3 1 1-3 8-10Z" />
      <path d="M11 14l3 3M5 19l-1 1" />
    </>
  ),
  shield: <path d="M12 3l7 3v5c0 4.6-2.8 8.1-7 10-4.2-1.9-7-5.4-7-10V6l7-3Z" />,
  heart: <path d="M20.8 5.9a5.5 5.5 0 0 0-7.8 0L12 7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-7.3a5.5 5.5 0 0 0 0-7.8Z" />,
  hp: (
    <>
      <path d="M20.8 5.9a5.5 5.5 0 0 0-7.8 0L12 7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-7.3a5.5 5.5 0 0 0 0-7.8Z" />
      <path d="M7 12h3l1.2-2.4L13 15l1-3h3" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 4.2 2.8 17.5A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.5L13.7 4.2a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  deck: (
    <>
      <rect x="6" y="4" width="13" height="16" rx="2" />
      <path d="M3 7v11a3 3 0 0 0 3 3h10" />
      <path d="M10 8h5M10 12h5" />
    </>
  ),
  discard: (
    <>
      <path d="M7 7h10l-1 13H8L7 7ZM5 7h14M9 7V4h6v3" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
}

export const CardgameIcon = ({ className, name }: CardgameIconProps) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    focusable="false"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    {ICON_CONTENT[name]}
  </svg>
)
