# Hidden Object Game Migration Design

## Goal

Migrate the legacy `20240328_hidden_object_game` experience from `re-activity` into `zhangrh.shop` as a standalone frontend project that can run without Sohu backend APIs.

Target project path:

```text
frontend/project/hidden-object-game
```

Expected production path:

```text
/hidden-object-game/
```

## Non-Goals

- Do not migrate Sohu native bridge behavior.
- Do not keep Sohu tracking or analytics.
- Do not add backend endpoints in `zhangrh.shop/backend`.
- Do not self-host all image/audio assets in the first pass.
- Do not preserve real login, captcha, share, prize redemption, or authenticated request flows.

## Runtime Model

The migrated project will be a normal Vite React project following the existing `zhangrh.shop/frontend/project/*` pattern:

- `index.html`
- `main.tsx`
- `app.tsx`
- `styles.css` or Less/CSS module files
- `vite.config.ts`

The app will not call `/api`. All former interfaces will be represented by a local frontend mock service.

## Mock Service

Create a local module such as:

```text
frontend/project/hidden-object-game/mock/mock-service.ts
```

The service owns the game state in memory and exposes async functions with the same product meaning as the old APIs:

- `getHome()`
- `getVenue(barrierId)`
- `submitTarget(eid)`
- `reduceTip()`
- `addTip()`
- `getPrizeList()`
- `getLotteryInfo()`
- `drawLottery()`
- `getUserInfo()`

The functions should return promises to keep the UI close to the old async flow, but they should never make network requests.

Initial data can be adapted from the existing JSON snapshots:

- `api-home.json`
- `api-venue-trial.json`
- `api-submit-win.json`
- `api-reduce.json`
- `api-add-tip.json`
- `api-prize-lot.json`
- `api-lottery.json`
- `api-reward.json`
- `api-user.json`

## State Behavior

The first version should support a deterministic playable flow:

- Home page shows the activity background, rules entry, prize entry, lottery entry, and open venue cards.
- Venue page starts with `0 / 10` found targets and at least one usable tip.
- Clicking the current target or using the tip calls `submitTarget(eid)` and shows a reward dialog.
- The reward dialog can navigate back to the home view and open the lottery dialog.
- The lottery dialog can call `drawLottery()` and show the reward result dialog.
- Local state can reset on page refresh. Persistence is optional and should be limited to tutorial dismissal flags in `localStorage`.

## Code To Remove

Remove these legacy concerns instead of porting them:

- Sohu native request/auth modules.
- Captcha modules and captcha token handling.
- Login checks and native login flow.
- `trackAGif`, `trackH5Gif`, and the `trace()` wrapper.
- `wxConfig`, `callUpApp`, `share://`, `fastshare://`, and app deep-link behavior.
- Native page title, close page, hide top button, and native navigation APIs.

Browser replacements:

- Page title: `document.title`.
- Navigation: React state or normal browser URL state.
- Share/add-tip button in venue: direct local tip action.
- Prize redemption actions: disabled/no-op local UI, or a local toast that says the action is unavailable in demo mode.

## Component Strategy

Do not import `re-activity` shared components directly. Bring over only the small UI behavior needed by this game:

- `Popup`: local replacement for `GlobalPopup`.
- `Toast`: local lightweight toast component or imperative helper.
- `Scroller`: replace with CSS `overflow: auto` unless a specific drag behavior requires a custom component.
- Storage helpers: replace with direct `localStorage` helpers.
- Asset loader: keep a small local version if preloading still improves the loading screen.

The main page split should stay close to the existing product concepts:

```text
app.tsx
mock/
components/
pages/home/
pages/venue/
styles/
assets/
```

## Asset Strategy

First pass: keep legacy CDN URLs in mock data and CSS.

This includes:

- `n1.itc.cn`
- `static.k.sohu.com`
- `v1.k.sohu.com`

If CDN assets fail later, create a second pass to download and rewrite assets into:

```text
frontend/project/hidden-object-game/assets/
```

The first migration should not block on asset self-hosting.

## Styling Strategy

Fastest path: allow Less or convert only the minimum needed styles.

Preferred first-pass options:

1. Keep existing Less/CSS module styling and add `less` to `frontend/package.json` if needed.
2. If dependency churn should be avoided, convert files to plain CSS modules during migration.

The first pass should prioritize behavioral parity over visual refactoring.

## Routing

A single Vite SPA can manage both old pages internally:

- Home route/state: default view.
- Venue route/state: selected venue id.

The app can use query parameters for direct debugging, for example:

```text
/hidden-object-game/?venueid=1
```

No React Router dependency is needed.

## Verification Plan

Before implementation is considered complete:

- `npm run build -- hidden-object-game` from `frontend`.
- `npm run dev -- hidden-object-game` from `frontend`.
- Browser smoke test:
  - home renders
  - venue renders
  - tip/target produces reward dialog
  - reward dialog opens lottery
  - lottery produces reward result
- Confirm no network calls to `/api` occur during gameplay.
- Confirm no console errors from missing Sohu globals.

## Risks

- Some legacy images/audio may disappear from Sohu CDN. This is accepted in the first pass and handled by a later asset-localization pass.
- The original project uses a large number of CSS background-image controls, so accessibility snapshots will be sparse.
- The original code mixes app-specific behavior into UI handlers; migration should remove those paths rather than conditionally keep them.
- If Less is added, frontend dependency footprint grows slightly.

## Recommended Implementation Order

1. Create `frontend/project/hidden-object-game` Vite shell.
2. Add local mock data and mock service.
3. Port home view with local popup/toast replacements.
4. Port venue view and target interaction.
5. Port prize and lottery dialogs.
6. Remove all remaining native/tracking/captcha/API references.
7. Build and browser-smoke-test.
