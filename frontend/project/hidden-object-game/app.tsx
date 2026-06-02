import { useEffect, useState } from 'react'
import { ToastProvider } from './components/toast'
import { HomePage } from './pages/home/home-page'
import { refreshRootFont } from './utils/rem'

type View =
  | { name: 'home' }
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
      {view.name === 'home' ? <HomePage openVenue={(venueId) => setView({ name: 'venue', venueId })} /> : null}
      {view.name === 'venue' ? <div className="debug-panel">Venue {view.venueId}</div> : null}
    </ToastProvider>
  )
}
