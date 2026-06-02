import { useEffect, useState } from 'react'

type View = 'home' | 'venue'

export const App = () => {
  const [view, setView] = useState<View>('home')

  useEffect(() => {
    document.title = view === 'home' ? '隐藏物品游戏' : '隐藏物品游戏 - 场馆'
  }, [view])

  return (
    <main className="app-shell">
      <section className="debug-panel">
        <h1>隐藏物品游戏</h1>
        <p>Migration shell is ready.</p>
        <button type="button" onClick={() => setView(view === 'home' ? 'venue' : 'home')}>
          Toggle view: {view}
        </button>
      </section>
    </main>
  )
}
