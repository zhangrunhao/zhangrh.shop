# Hidden Object Game Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone `hidden-object-game` frontend project in `zhangrh.shop` that preserves the legacy hidden-object gameplay using frontend-only mock data and no Sohu backend, native bridge, captcha, share, or tracking dependencies.

**Architecture:** Add one Vite React project at `frontend/project/hidden-object-game`. Port the legacy game UI into project-local pages/components, replace old `/api` calls with a local async mock service, keep legacy CDN media URLs for the first version, and use local browser-only replacements for popup, toast, storage, title, and navigation behavior.

**Tech Stack:** Vite 7, React 19, TypeScript, CSS modules or Less modules, local JSON fixtures, Node static audit scripts, Playwright CLI for browser smoke verification.

---

## File Structure

Create or modify these files in `/Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration`:

- Create: `frontend/project/hidden-object-game/index.html` - Vite HTML entry.
- Create: `frontend/project/hidden-object-game/vite.config.ts` - project-local Vite config using `createProjectConfig`.
- Create: `frontend/project/hidden-object-game/main.tsx` - React root renderer.
- Create: `frontend/project/hidden-object-game/app.tsx` - top-level route/view state.
- Create: `frontend/project/hidden-object-game/styles.css` - global page reset and mobile viewport styles.
- Create: `frontend/project/hidden-object-game/scripts/audit.mjs` - static migration audit.
- Create: `frontend/project/hidden-object-game/mock/fixtures/*.json` - copied legacy API snapshots.
- Create: `frontend/project/hidden-object-game/mock/types.ts` - mock data type aliases.
- Create: `frontend/project/hidden-object-game/mock/mock-service.ts` - local async stateful mock service.
- Create: `frontend/project/hidden-object-game/utils/query.ts` - URL query helpers.
- Create: `frontend/project/hidden-object-game/utils/rem.ts` - root font-size and pixel conversion helpers.
- Create: `frontend/project/hidden-object-game/utils/storage.ts` - localStorage wrapper for tutorial flags.
- Create: `frontend/project/hidden-object-game/components/popup.tsx` - local replacement for `GlobalPopup`.
- Create: `frontend/project/hidden-object-game/components/toast.tsx` - local toast provider/helper.
- Create: `frontend/project/hidden-object-game/components/loading.tsx` - image preload progress UI.
- Create: `frontend/project/hidden-object-game/pages/home/*` - home page, venue cards, operation buttons, prize dialog, rule dialog, lottery dialog.
- Create: `frontend/project/hidden-object-game/pages/venue/*` - venue stage, touch mask, process bar, next target tip, reward dialog, tutorial masks.
- Modify: `frontend/package.json` and `frontend/package-lock.json` only if the implementation keeps Less files and must add `less`.

Read-only source paths:

- `/Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game`
- `/Users/runhaozhang/Documents/project/re-activity/src/components/global-popup/index.tsx`
- `/Users/runhaozhang/Documents/project/re-activity/src/components/global-toast/index.tsx`
- `/Users/runhaozhang/Documents/project/re-activity/src/components/my-scroller/scroller-y.tsx`
- `/Users/runhaozhang/Documents/project/re-activity/src/common/storage.ts`

Do not modify `re-activity` during this migration.

---

### Task 1: Bootstrap The Vite Project Shell

**Files:**
- Create: `frontend/project/hidden-object-game/index.html`
- Create: `frontend/project/hidden-object-game/vite.config.ts`
- Create: `frontend/project/hidden-object-game/main.tsx`
- Create: `frontend/project/hidden-object-game/app.tsx`
- Create: `frontend/project/hidden-object-game/styles.css`
- Create: `frontend/project/hidden-object-game/scripts/audit.mjs`

- [ ] **Step 1: Run the failing build before creating the project**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration/frontend
npm run build -- hidden-object-game
```

Expected: FAIL with `Missing project name` or `Missing Vite config`, proving the project is not registered yet.

- [ ] **Step 2: Create `frontend/project/hidden-object-game/vite.config.ts`**

Use this exact file content:

```ts
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProjectConfig } from '../../vite.config'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

export default createProjectConfig({
  projectRoot,
})
```

- [ ] **Step 3: Create `frontend/project/hidden-object-game/index.html`**

Use this exact file content:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
    <meta
      name="description"
      content="A standalone hidden-object game demo migrated to zhangrh.shop with local mock data."
    />
    <title>隐藏物品游戏</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create `frontend/project/hidden-object-game/main.tsx`**

Use this exact file content:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 5: Create `frontend/project/hidden-object-game/app.tsx`**

Use this exact first shell content:

```tsx
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
```

- [ ] **Step 6: Create `frontend/project/hidden-object-game/styles.css`**

Use this exact first shell content:

```css
* {
  box-sizing: border-box;
}

html,
body,
#root {
  width: 100%;
  min-height: 100%;
  margin: 0;
}

body {
  background: #050505;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  color: #ffffff;
}

.debug-panel {
  width: min(90vw, 420px);
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
}
```

- [ ] **Step 7: Create `frontend/project/hidden-object-game/scripts/audit.mjs`**

Use this exact first audit content:

```js
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const projectRoot = path.resolve(import.meta.dirname, '..')

const requiredFiles = [
  'index.html',
  'vite.config.ts',
  'main.tsx',
  'app.tsx',
  'styles.css',
]

const forbiddenPatterns = [
  /\/api\//,
  /trackAGif/,
  /trackH5Gif/,
  /\btrace\(/,
  /wxConfig/,
  /callUpApp/,
  /toolsApi/,
  /newsApi/,
  /viewApi/,
  /commonApi/,
  /captcha/i,
  /share:\/\//,
  /fastshare:\/\//,
]

const listFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') {
        return []
      }
      return listFiles(fullPath)
    }
    return [fullPath]
  })
}

const failures = []

for (const file of requiredFiles) {
  const fullPath = path.join(projectRoot, file)
  if (!fs.existsSync(fullPath)) {
    failures.push(`Missing required file: ${file}`)
  }
}

for (const file of listFiles(projectRoot)) {
  if (!/\.(ts|tsx|js|jsx|html|css|json)$/.test(file)) {
    continue
  }
  const content = fs.readFileSync(file, 'utf8')
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      failures.push(`Forbidden pattern ${pattern} found in ${path.relative(projectRoot, file)}`)
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('hidden-object-game audit passed')
```

- [ ] **Step 8: Run the shell audit and build**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration/frontend
node project/hidden-object-game/scripts/audit.mjs
npm run build -- hidden-object-game
```

Expected: audit prints `hidden-object-game audit passed`; Vite build succeeds and writes `frontend/dist/hidden-object-game`.

- [ ] **Step 9: Commit the shell**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration
git add frontend/project/hidden-object-game
git commit -m "feat: 新增隐藏物品游戏项目壳"
```

---

### Task 2: Add Local Mock Fixtures And Stateful Service

**Files:**
- Create: `frontend/project/hidden-object-game/mock/fixtures/api-home.json`
- Create: `frontend/project/hidden-object-game/mock/fixtures/api-venue-trial.json`
- Create: `frontend/project/hidden-object-game/mock/fixtures/api-submit-win.json`
- Create: `frontend/project/hidden-object-game/mock/fixtures/api-reduce.json`
- Create: `frontend/project/hidden-object-game/mock/fixtures/api-add-tip.json`
- Create: `frontend/project/hidden-object-game/mock/fixtures/api-prize-lot.json`
- Create: `frontend/project/hidden-object-game/mock/fixtures/api-lottery.json`
- Create: `frontend/project/hidden-object-game/mock/fixtures/api-reward.json`
- Create: `frontend/project/hidden-object-game/mock/fixtures/api-user.json`
- Create: `frontend/project/hidden-object-game/mock/types.ts`
- Create: `frontend/project/hidden-object-game/mock/mock-service.ts`
- Modify: `frontend/project/hidden-object-game/scripts/audit.mjs`

- [ ] **Step 1: Extend audit to require the mock service before creating it**

In `frontend/project/hidden-object-game/scripts/audit.mjs`, replace `requiredFiles` with this array:

```js
const requiredFiles = [
  'index.html',
  'vite.config.ts',
  'main.tsx',
  'app.tsx',
  'styles.css',
  'mock/types.ts',
  'mock/mock-service.ts',
  'mock/fixtures/api-home.json',
  'mock/fixtures/api-venue-trial.json',
  'mock/fixtures/api-submit-win.json',
  'mock/fixtures/api-reduce.json',
  'mock/fixtures/api-add-tip.json',
  'mock/fixtures/api-prize-lot.json',
  'mock/fixtures/api-lottery.json',
  'mock/fixtures/api-reward.json',
  'mock/fixtures/api-user.json',
]
```

- [ ] **Step 2: Run audit to verify it fails for missing mock files**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration/frontend
node project/hidden-object-game/scripts/audit.mjs
```

Expected: FAIL with missing `mock/types.ts`, `mock/mock-service.ts`, and fixture files.

- [ ] **Step 3: Copy fixture JSON from `re-activity`**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration/frontend/project/hidden-object-game
mkdir -p mock/fixtures
cp /Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/api/api-home.json mock/fixtures/api-home.json
cp /Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/api/api-venue-trial.json mock/fixtures/api-venue-trial.json
cp /Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/api/api-submit-win.json mock/fixtures/api-submit-win.json
cp /Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/api/api-reduce.json mock/fixtures/api-reduce.json
cp /Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/api/api-add-tip.json mock/fixtures/api-add-tip.json
cp /Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/api/api-prize-lot.json mock/fixtures/api-prize-lot.json
cp /Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/api/api-lottery.json mock/fixtures/api-lottery.json
cp /Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/api/api-reward.json mock/fixtures/api-reward.json
cp /Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/api/api-user.json mock/fixtures/api-user.json
```

- [ ] **Step 4: Create `frontend/project/hidden-object-game/mock/types.ts`**

Use this exact file content:

```ts
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
```

- [ ] **Step 5: Create `frontend/project/hidden-object-game/mock/mock-service.ts`**

Use this exact first implementation:

```ts
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
```

- [ ] **Step 6: Run audit and build**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration/frontend
node project/hidden-object-game/scripts/audit.mjs
npm run build -- hidden-object-game
```

Expected: audit passes; Vite build succeeds.

- [ ] **Step 7: Commit the mock service**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration
git add frontend/project/hidden-object-game
git commit -m "feat: 新增隐藏物品游戏本地mock服务"
```

---

### Task 3: Add Browser Utilities And Local UI Primitives

**Files:**
- Create: `frontend/project/hidden-object-game/utils/query.ts`
- Create: `frontend/project/hidden-object-game/utils/rem.ts`
- Create: `frontend/project/hidden-object-game/utils/storage.ts`
- Create: `frontend/project/hidden-object-game/components/popup.tsx`
- Create: `frontend/project/hidden-object-game/components/toast.tsx`
- Create: `frontend/project/hidden-object-game/components/loading.tsx`
- Modify: `frontend/project/hidden-object-game/styles.css`

- [ ] **Step 1: Extend audit to require utility and primitive files**

Append these entries to `requiredFiles` in `frontend/project/hidden-object-game/scripts/audit.mjs`:

```js
  'utils/query.ts',
  'utils/rem.ts',
  'utils/storage.ts',
  'components/popup.tsx',
  'components/toast.tsx',
  'components/loading.tsx',
```

- [ ] **Step 2: Run audit to verify it fails for missing utility files**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration/frontend
node project/hidden-object-game/scripts/audit.mjs
```

Expected: FAIL with missing utility and component files.

- [ ] **Step 3: Create `frontend/project/hidden-object-game/utils/query.ts`**

Use this exact file content:

```ts
export const readQuery = () => new URLSearchParams(window.location.search)

export const getQueryValue = (key: string) => readQuery().get(key) ?? ''

export const updateQuery = (params: Record<string, string | number | null>) => {
  const url = new URL(window.location.href)
  Object.entries(params).forEach(([key, value]) => {
    if (value === null) {
      url.searchParams.delete(key)
    } else {
      url.searchParams.set(key, String(value))
    }
  })
  window.history.pushState(null, '', url)
}
```

- [ ] **Step 4: Create `frontend/project/hidden-object-game/utils/rem.ts`**

Use this exact file content:

```ts
export const DESIGN_WIDTH = 750
export const DESIGN_HEIGHT = 1206

export const refreshRootFont = () => {
  let width = window.innerWidth
  const height = window.innerHeight
  const formalRatio = DESIGN_WIDTH / DESIGN_HEIGHT
  const currentRatio = width / height
  if (currentRatio > formalRatio) {
    width = height * formalRatio
  }
  const rootFontSize = (width / DESIGN_WIDTH) * 100
  document.documentElement.style.fontSize = `${rootFontSize}px`
  return rootFontSize
}

export const px = (value: number) => (value / 100) * refreshRootFont()
```

- [ ] **Step 5: Create `frontend/project/hidden-object-game/utils/storage.ts`**

Use this exact file content:

```ts
export const readStorage = (key: string) => {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export const writeStorage = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    return
  }
}
```

- [ ] **Step 6: Create `frontend/project/hidden-object-game/components/popup.tsx`**

Use this exact file content:

```tsx
import type { CSSProperties, ReactNode } from 'react'

type PopupProps = {
  visible: boolean
  children: ReactNode
  close: () => void
  panelStyle?: CSSProperties
  maskOpacity?: number
}

export const Popup = ({ visible, children, close, panelStyle, maskOpacity = 0.72 }: PopupProps) => {
  if (!visible) {
    return null
  }

  return (
    <div className="popup-root" role="dialog" aria-modal="true">
      <button className="popup-mask" type="button" aria-label="关闭弹窗" onClick={close} style={{ opacity: maskOpacity }} />
      <div className="popup-panel" style={panelStyle}>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create `frontend/project/hidden-object-game/components/toast.tsx`**

Use this exact file content:

```tsx
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type ToastContextValue = {
  showToast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => undefined,
})

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState('')

  const showToast = useCallback((nextMessage: string) => {
    setMessage(nextMessage)
    window.setTimeout(() => setMessage(''), 1600)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? <div className="toast">{message}</div> : null}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
```

- [ ] **Step 8: Create `frontend/project/hidden-object-game/components/loading.tsx`**

Use this exact file content:

```tsx
export const Loading = ({ progress }: { progress: number }) => (
  <div className="loading-screen">
    <div className="loading-spinner" />
    <div className="loading-text">{Math.round(progress * 100)}%</div>
  </div>
)
```

- [ ] **Step 9: Append local primitive styles to `styles.css`**

Append this exact CSS:

```css
.popup-root {
  position: fixed;
  inset: 0;
  z-index: 50;
}

.popup-mask {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  background: #000000;
}

.popup-panel {
  position: relative;
  z-index: 1;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 12%;
  z-index: 80;
  transform: translateX(-50%);
  max-width: min(86vw, 360px);
  padding: 10px 14px;
  border-radius: 6px;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.78);
  font-size: 14px;
}

.loading-screen {
  min-height: 100vh;
  display: grid;
  place-items: center;
  color: #ffffff;
  background: #050505;
}

.loading-spinner {
  width: 44px;
  height: 44px;
  border: 4px solid rgba(255, 255, 255, 0.24);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: hidden-object-spin 0.8s linear infinite;
}

.loading-text {
  margin-top: 12px;
  text-align: center;
}

@keyframes hidden-object-spin {
  to {
    transform: rotate(360deg);
  }
}
```

- [ ] **Step 10: Run audit and build**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration/frontend
node project/hidden-object-game/scripts/audit.mjs
npm run build -- hidden-object-game
```

Expected: audit passes; Vite build succeeds.

- [ ] **Step 11: Commit utilities and primitives**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration
git add frontend/project/hidden-object-game
git commit -m "feat: 新增隐藏物品游戏浏览器基础组件"
```

---

### Task 4: Port Home View With Local Navigation

**Files:**
- Create: `frontend/project/hidden-object-game/pages/home/home-page.tsx`
- Create: `frontend/project/hidden-object-game/pages/home/home-page.css`
- Create: `frontend/project/hidden-object-game/pages/home/rule-dialog.tsx`
- Create: `frontend/project/hidden-object-game/pages/home/prize-dialog.tsx`
- Create: `frontend/project/hidden-object-game/pages/home/lottery-dialog.tsx`
- Modify: `frontend/project/hidden-object-game/app.tsx`
- Modify: `frontend/project/hidden-object-game/styles.css`

- [ ] **Step 1: Extend audit to require home page files**

Append these entries to `requiredFiles` in `frontend/project/hidden-object-game/scripts/audit.mjs`:

```js
  'pages/home/home-page.tsx',
  'pages/home/home-page.css',
  'pages/home/rule-dialog.tsx',
  'pages/home/prize-dialog.tsx',
  'pages/home/lottery-dialog.tsx',
```

- [ ] **Step 2: Run audit to verify it fails for missing home files**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration/frontend
node project/hidden-object-game/scripts/audit.mjs
```

Expected: FAIL with missing home page files.

- [ ] **Step 3: Copy home image assets used by CSS modules**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration/frontend/project/hidden-object-game
mkdir -p assets/images
cp /Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/assets/images/rule.png assets/images/rule.png
cp /Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/assets/images/prize.png assets/images/prize.png
cp /Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/assets/images/lottery.png assets/images/lottery.png
cp /Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/assets/images/avatar-default.png assets/images/avatar-default.png
cp /Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/assets/images/venue-finished.png assets/images/venue-finished.png
```

- [ ] **Step 4: Create home page components**

Use the old entry page as visual reference, but implement with local mock service only:

- Source reference: `/Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/entry.tsx`
- Source reference: `/Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/page/entry/venue-list.tsx`
- Source reference: `/Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/page/entry/operation-list.tsx`

Create `frontend/project/hidden-object-game/pages/home/home-page.tsx` with these exports and props:

```tsx
import { useEffect, useState } from 'react'
import { getHome, getUserInfo, type HomeData } from '../../mock/mock-service'
import { Loading } from '../../components/loading'
import { RuleDialog } from './rule-dialog'
import { PrizeDialog } from './prize-dialog'
import { LotteryDialog } from './lottery-dialog'
import './home-page.css'

type HomePageProps = {
  openVenue: (venueId: number) => void
}

export const HomePage = ({ openVenue }: HomePageProps) => {
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
        <div className="home-avatar" style={{ backgroundImage: `url(${avatar})` }} />
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
```

- [ ] **Step 5: Create dialog files**

Implement these files with local `Popup` and mock service:

`rule-dialog.tsx`:

```tsx
import { Popup } from '../../components/popup'

type RuleDialogProps = {
  visible: boolean
  imageUrl: string
  close: () => void
}

export const RuleDialog = ({ visible, imageUrl, close }: RuleDialogProps) => (
  <Popup visible={visible} close={close} panelStyle={{ width: '100%', height: '100%' }}>
    <button className="rule-dialog" type="button" onClick={close}>
      <img src={imageUrl} alt="活动规则" />
    </button>
  </Popup>
)
```

`prize-dialog.tsx` must call `getPrizeList()` on open and render prize names plus disabled action buttons that show a toast message.

`lottery-dialog.tsx` must call `getLotteryInfo()` on open, call `drawLottery()` on start, and render reward result using local `Popup`.

- [ ] **Step 6: Create `home-page.css`**

Copy positional values from the legacy Less files where practical:

- Source reference: `/Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/page/entry/venue-list.module.less`
- Source reference: `/Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/page/entry/operation-list.module.less`
- Source reference: `/Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/page/entry/btn-rule.module.less`
- Source reference: `/Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/page/entry/btn-prize.module.less`
- Source reference: `/Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/page/entry/btn-lottery.module.less`

Use CSS class names from `home-page.tsx` and local copied assets.

- [ ] **Step 7: Replace shell app with home routing**

Update `frontend/project/hidden-object-game/app.tsx` to import `ToastProvider`, `refreshRootFont`, `HomePage`, and use local `view` state:

```tsx
import { useEffect, useState } from 'react'
import { ToastProvider } from './components/toast'
import { refreshRootFont } from './utils/rem'
import { HomePage } from './pages/home/home-page'

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
```

- [ ] **Step 8: Run audit and build**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration/frontend
node project/hidden-object-game/scripts/audit.mjs
npm run build -- hidden-object-game
```

Expected: audit passes; Vite build succeeds.

- [ ] **Step 9: Commit the home view**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration
git add frontend/project/hidden-object-game
git commit -m "feat: 迁移隐藏物品游戏首页"
```

---

### Task 5: Port Venue Gameplay

**Files:**
- Create: `frontend/project/hidden-object-game/pages/venue/venue-page.tsx`
- Create: `frontend/project/hidden-object-game/pages/venue/stage.tsx`
- Create: `frontend/project/hidden-object-game/pages/venue/touch-mask.tsx`
- Create: `frontend/project/hidden-object-game/pages/venue/reward-dialog.tsx`
- Create: `frontend/project/hidden-object-game/pages/venue/venue-page.css`
- Modify: `frontend/project/hidden-object-game/app.tsx`

- [ ] **Step 1: Extend audit to require venue page files**

Append these entries to `requiredFiles` in `frontend/project/hidden-object-game/scripts/audit.mjs`:

```js
  'pages/venue/venue-page.tsx',
  'pages/venue/stage.tsx',
  'pages/venue/touch-mask.tsx',
  'pages/venue/reward-dialog.tsx',
  'pages/venue/venue-page.css',
```

- [ ] **Step 2: Run audit to verify it fails for missing venue files**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration/frontend
node project/hidden-object-game/scripts/audit.mjs
```

Expected: FAIL with missing venue files.

- [ ] **Step 3: Copy venue CSS image assets**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration/frontend/project/hidden-object-game
cp /Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/assets/images/click-error.png assets/images/click-error.png
cp /Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/assets/images/share-tip-icon.png assets/images/share-tip-icon.png
cp /Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/assets/images/share-tip.png assets/images/share-tip.png
cp /Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/assets/images/music.png assets/images/music.png
cp /Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/assets/images/music-closed.png assets/images/music-closed.png
cp /Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/assets/images/share-finished.png assets/images/share-finished.png
cp /Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/assets/images/intro-arrow.png assets/images/intro-arrow.png
```

- [ ] **Step 4: Create `stage.tsx` with browser-only target submission**

Port from:

```text
/Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/page/venue/stage.tsx
```

Required changes:

- Remove `isSohu`.
- Remove `callapp`.
- Keep only local `postSubmitTarget(eid)`.
- Keep wrong-click feedback.
- Use class names from `venue-page.css`.

- [ ] **Step 5: Create `touch-mask.tsx`**

Port from:

```text
/Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/page/venue/touch-mask.tsx
```

Required changes:

- Keep drag scrolling and click-through behavior.
- Remove comments about native/iOS app behavior.
- Keep props: `startTouch`, `endTouch`, `setScrollPosition`, `scrollMaxX`, `scrollMaxY`, `switchElementShow`.

- [ ] **Step 6: Create `reward-dialog.tsx`**

Use local `Popup` and local navigation props:

```tsx
import { Popup } from '../../components/popup'

type RewardDialogProps = {
  visible: boolean
  content: string
  icon: string
  type: number
  close: () => void
  openLottery: () => void
}

export const RewardDialog = ({ visible, content, icon, type, close, openLottery }: RewardDialogProps) => (
  <Popup visible={visible} close={close} panelStyle={{ width: '100%', height: '100%' }} maskOpacity={0.8}>
    <div className="reward-dialog">
      <button className="reward-dialog-close-layer" type="button" onClick={close} aria-label="关闭奖励弹窗" />
      <div className="reward-dialog-title">恭喜获得！</div>
      <div className="reward-dialog-card">
        <div className="reward-dialog-icon" style={{ backgroundImage: `url(${icon})` }} />
        <div className="reward-dialog-content">{content}</div>
        {type === 5 ? (
          <button className="reward-dialog-button" type="button" onClick={openLottery}>
            去抽奖
          </button>
        ) : null}
      </div>
      <button className="reward-dialog-close" type="button" onClick={close} aria-label="关闭" />
    </div>
  </Popup>
)
```

- [ ] **Step 7: Create `venue-page.tsx`**

Implement local gameplay with these required behaviors:

- Load `getVenue(venueId)` on mount.
- Render `Stage`.
- Render next target panel with `found / total`.
- Render music, prize, and tip buttons as browser-only controls.
- `tipMove()` moves to `data.nextFind`, calls `reduceTip()`, calls `submitTarget(nextFind.eid)`, shows `RewardDialog`.
- Direct target click calls `submitTarget(eid)` only when `eid === data.nextFind?.eid`.
- Use `getVenue()` refresh after each submit to get updated state.

- [ ] **Step 8: Create `venue-page.css`**

Copy visual rules from these references and replace relative asset URLs with local `assets/images/*` paths:

- `/Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/page/venue/stage.module.less`
- `/Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/page/venue/touch-mask.module.less`
- `/Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/page/venue/next-object-tip.module.less`
- `/Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/page/venue/process-bar.module.less`
- `/Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/page/venue/dialog.module.less`
- `/Users/runhaozhang/Documents/project/re-activity/src/project/20240328_hidden_object_game/page/venue/btn-list.module.less`

- [ ] **Step 9: Wire venue into `app.tsx`**

Replace the temporary venue debug div with:

```tsx
import { VenuePage } from './pages/venue/venue-page'

{view.name === 'venue' ? (
  <VenuePage
    venueId={view.venueId}
    goHome={() => setView({ name: 'home' })}
    openLottery={() => setView({ name: 'home', openLottery: true } as never)}
  />
) : null}
```

Then adjust `View` to include a lottery-opening flag without using `never`:

```ts
type View =
  | { name: 'home'; openLottery?: boolean }
  | { name: 'venue'; venueId: number }
```

Pass `openLotteryInitially={Boolean(view.name === 'home' && view.openLottery)}` into `HomePage`.

- [ ] **Step 10: Run audit and build**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration/frontend
node project/hidden-object-game/scripts/audit.mjs
npm run build -- hidden-object-game
```

Expected: audit passes; Vite build succeeds.

- [ ] **Step 11: Commit venue gameplay**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration
git add frontend/project/hidden-object-game
git commit -m "feat: 迁移隐藏物品游戏场馆玩法"
```

---

### Task 6: Complete Prize And Lottery Dialog Behavior

**Files:**
- Modify: `frontend/project/hidden-object-game/pages/home/prize-dialog.tsx`
- Modify: `frontend/project/hidden-object-game/pages/home/lottery-dialog.tsx`
- Modify: `frontend/project/hidden-object-game/pages/home/home-page.tsx`
- Modify: `frontend/project/hidden-object-game/pages/home/home-page.css`

- [ ] **Step 1: Add lottery state audit check**

In `frontend/project/hidden-object-game/scripts/audit.mjs`, add these forbidden patterns to `forbiddenPatterns`:

```js
  /window\.location\.href\s*=/,
  /location\.replace/,
  /openUrl/,
```

- [ ] **Step 2: Run audit before dialog completion**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration/frontend
node project/hidden-object-game/scripts/audit.mjs
```

Expected: PASS if previous tasks did not introduce navigation globals; FAIL if old dialog code still uses `window.location.href`, `location.replace`, or `openUrl`.

- [ ] **Step 3: Finish `prize-dialog.tsx`**

The final dialog must:

- Call `getPrizeList()` only when `visible` changes to true.
- Render empty state when list length is `0`.
- Render reward logo, reward name, ticket name.
- Use `useToast().showToast('演示模式不支持领取或使用奖品')` for prize action buttons.

- [ ] **Step 4: Finish `lottery-dialog.tsx`**

The final dialog must:

- Call `getLotteryInfo()` when opened.
- Render remaining times.
- Render all lottery item icons from `lotteryInfo`.
- Disable start button when times are less than `1`.
- Call `drawLottery()` on start.
- Show a result card with `rewardInfo.rewardLogo` and `rewardInfo.rewardName`.
- Refresh remaining times after draw.

- [ ] **Step 5: Wire `openLotteryInitially` in `home-page.tsx`**

Change `HomePageProps` to:

```ts
type HomePageProps = {
  openVenue: (venueId: number) => void
  openLotteryInitially?: boolean
  onLotteryInitialOpenConsumed?: () => void
}
```

Add this effect:

```tsx
useEffect(() => {
  if (openLotteryInitially) {
    setLotteryVisible(true)
    onLotteryInitialOpenConsumed?.()
  }
}, [openLotteryInitially, onLotteryInitialOpenConsumed])
```

- [ ] **Step 6: Run audit and build**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration/frontend
node project/hidden-object-game/scripts/audit.mjs
npm run build -- hidden-object-game
```

Expected: audit passes; Vite build succeeds.

- [ ] **Step 7: Commit prize and lottery dialogs**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration
git add frontend/project/hidden-object-game
git commit -m "feat: 完成隐藏物品游戏奖品和抽奖弹窗"
```

---

### Task 7: Remove Remaining Legacy Runtime References

**Files:**
- Modify: `frontend/project/hidden-object-game/scripts/audit.mjs`
- Modify any `frontend/project/hidden-object-game/**/*.{ts,tsx,css,html,json}` file flagged by the audit.

- [ ] **Step 1: Strengthen audit with import-boundary checks**

Add this block before the final failure check in `scripts/audit.mjs`:

```js
const forbiddenImportPatterns = [
  /from ['"].*re-activity/,
  /from ['"].*common\//,
  /from ['"].*components\//,
  /from ['"].*@sohu/,
  /import .*axios/,
]

for (const file of listFiles(projectRoot)) {
  if (!/\.(ts|tsx|js|jsx)$/.test(file)) {
    continue
  }
  const content = fs.readFileSync(file, 'utf8')
  for (const pattern of forbiddenImportPatterns) {
    if (pattern.test(content)) {
      failures.push(`Forbidden import ${pattern} found in ${path.relative(projectRoot, file)}`)
    }
  }
}
```

- [ ] **Step 2: Run audit and fix each concrete failure**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration/frontend
node project/hidden-object-game/scripts/audit.mjs
```

Expected: PASS. If it fails, remove the reported legacy import or forbidden runtime call, then rerun the audit until it passes.

- [ ] **Step 3: Search for legacy terms outside the audit**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration
rg -n "trackAGif|trackH5Gif|trace\\(|wxConfig|callUpApp|toolsApi|newsApi|viewApi|commonApi|captcha|share://|fastshare://|/api/" frontend/project/hidden-object-game
```

Expected: no matches.

- [ ] **Step 4: Run build**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration/frontend
npm run build -- hidden-object-game
```

Expected: Vite build succeeds.

- [ ] **Step 5: Commit runtime cleanup**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration
git add frontend/project/hidden-object-game
git commit -m "refactor: 移除隐藏物品游戏旧运行时依赖"
```

---

### Task 8: Browser Smoke Verification

**Files:**
- Create: `frontend/project/hidden-object-game/docs/smoke-test.md`
- Modify: `frontend/project/hidden-object-game/scripts/audit.mjs` if browser verification finds missing static checks.

- [ ] **Step 1: Start local dev server**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration/frontend
npm run dev -- hidden-object-game -- --host 127.0.0.1
```

Expected: Vite dev server starts and prints a localhost URL.

- [ ] **Step 2: Open the app with Playwright CLI**

Run in a second terminal:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
"$PWCLI" open "http://127.0.0.1:5173/"
"$PWCLI" console error
```

Expected: page opens; console error count is `0`.

- [ ] **Step 3: Verify no `/api` requests**

Run:

```bash
"$PWCLI" requests
```

Expected: no request URL contains `/api/`.

- [ ] **Step 4: Exercise gameplay manually**

In the browser:

1. Confirm home background and venue cards render.
2. Click the first open venue.
3. Confirm venue background, `0 / 10`, and target hint render.
4. Click the tip button or the highlighted target.
5. Confirm reward dialog appears.
6. Click `去抽奖`.
7. Confirm lottery dialog appears.
8. Click the lottery start button.
9. Confirm lottery result dialog appears.

- [ ] **Step 5: Record smoke result**

Create `frontend/project/hidden-object-game/docs/smoke-test.md` with this content after successful verification:

```md
# Hidden Object Game Smoke Test

Verified locally with Vite dev server.

- Home renders.
- Venue renders.
- Tip or target click opens reward dialog.
- Reward dialog opens lottery.
- Lottery draw opens result dialog.
- Browser console has no errors.
- Network request list has no `/api` calls.
```

- [ ] **Step 6: Stop dev server**

Press `Ctrl-C` in the terminal running Vite.

- [ ] **Step 7: Run final build**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration/frontend
node project/hidden-object-game/scripts/audit.mjs
npm run build -- hidden-object-game
```

Expected: audit passes; Vite build succeeds.

- [ ] **Step 8: Commit smoke documentation**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration
git add frontend/project/hidden-object-game
git commit -m "test: 记录隐藏物品游戏冒烟验证"
```

---

## Final Verification

Run all final checks from the worktree:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration
npm test
cd frontend
node project/hidden-object-game/scripts/audit.mjs
npm run build -- hidden-object-game
```

Expected:

- Root test suite passes.
- Hidden-object-game audit passes.
- Hidden-object-game Vite build succeeds.

Then inspect status:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/.worktrees/hidden-object-game-migration
git status --short
git log --oneline --max-count=8
```

Expected: clean worktree after commits; recent log contains the migration commits.

