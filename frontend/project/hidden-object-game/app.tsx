import { useEffect, useState } from 'react'
import { ToastProvider } from './components/toast'
import { HomePage } from './pages/home/home-page'
import { VenuePage } from './pages/venue/venue-page'
import { refreshRootFont } from './utils/rem'

type View =
  | { name: 'home'; openLottery?: boolean }
  | { name: 'venue'; venueId: number }

export const App = () => {
  const [view, setView] = useState<View>({ name: 'home' })

  useEffect(() => {
    refreshRootFont()
    const handleResize = () => refreshRootFont()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <ToastProvider>
      {view.name === 'home' ? (
        <HomePage
          openVenue={(venueId) => setView({ name: 'venue', venueId })}
          openLotteryInitially={Boolean(view.openLottery)}
          onLotteryInitialOpenConsumed={() => setView({ name: 'home' })}
        />
      ) : null}
      {view.name === 'venue' ? (
        <VenuePage
          venueId={view.venueId}
          goHome={() => setView({ name: 'home' })}
          openLottery={() => setView({ name: 'home', openLottery: true })}
        />
      ) : null}
    </ToastProvider>
  )
}
