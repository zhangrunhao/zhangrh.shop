# Legacy H5 Migration Design

## Goal

Migrate the four representative legacy H5 projects from `bantang` into `zhangrh.shop` as one independent frontend project that builds and deploys all four activities together.

The migrated project only needs to preserve source, local assets, playable interaction, and display quality. It must not depend on OSS, CDN-hosted project assets, old Sohu backend APIs, WeChat login, WeChat sharing signatures, sensitive-word APIs, tracking APIs, or server-side save APIs.

## Scope

Projects to migrate:

- `1904_tale`
- `1905_word`
- `1907_cp`
- `1908_parade`

Target project:

- `frontend/project/legacy-h5`

Target URLs after build and deployment:

- `/legacy-h5/`
- `/legacy-h5/1904_tale/`
- `/legacy-h5/1905_word/`
- `/legacy-h5/1907_cp/`
- `/legacy-h5/1908_parade/`

## Architecture

Create a single Vite multi-page frontend project named `legacy-h5`. The root page is a lightweight gallery linking to the four migrated activities. Each activity remains an isolated HTML page with its own source, styles, and assets under a subdirectory.

The old activity code is kept mostly intact and adapted through small compatibility modules:

- Vite aliases map legacy imports such as `hilo`, `$`, `Scroller`, and `wx` to local shims.
- Runtime scripts such as Hilo, jQuery, Zepto, and Scroller are copied locally and loaded by each activity HTML before the module entry.
- Asset paths are converted to local relative paths under each activity's `asset/` folder.
- Backend, WeChat, tracking, sensitive-word, and save behavior is removed or short-circuited inside the local source.

## File Layout

```text
frontend/project/legacy-h5/
  index.html
  main.css
  vite.config.ts
  legacy/
    shims/
      hilo.js
      jquery.js
      scroller.js
      wx.js
    utils/
      legacy-utils.js
      no-op-services.js
  script/
    hilo/
    jquery/
    scroller/
    zepto/
  1904_tale/
    index.html
    js/
    css/
    asset/
  1905_word/
    index.html
    js/
    css/
    asset/
  1907_cp/
    index.html
    js/
    style/
    asset/
  1908_parade/
    index.html
    js/
    style/
    asset/
```

Vite build output:

```text
frontend/dist/legacy-h5/
  index.html
  1904_tale/
  1905_word/
  1907_cp/
  1908_parade/
  static/
```

## Vite Configuration

`frontend/project/legacy-h5/vite.config.ts` will use the existing shared project config from `frontend/vite.config.ts` and extend it with Rollup multi-page input:

- `index.html`
- `1904_tale/index.html`
- `1905_word/index.html`
- `1907_cp/index.html`
- `1908_parade/index.html`

Aliases:

- `hilo` -> `legacy/shims/hilo.js`
- `$` -> `legacy/shims/jquery.js`
- `Scroller` -> `legacy/shims/scroller.js`
- `wx` -> `legacy/shims/wx.js`

The project still uses the existing `frontend` scripts:

```bash
npm run dev -- legacy-h5
npm run build -- legacy-h5
npm run deploy -- legacy-h5
```

## Runtime Dependencies

The migrated project will not install old H5 libraries from npm. It will copy browser scripts from the legacy repository into the project:

- `src/script/hilo/1.4.2/hilo-min.js`
- `src/script/hilo/1.6.0/hilo-min.js`
- `src/script/jquery/3.4.1/jquery.min.js`
- `src/script/zepto/1.2.0/zepto.min.js`
- `src/script/scroller/1.2.2/Animate.js`
- `src/script/scroller/1.2.2/Scroller.js`

Each activity loads only the scripts it needs. The module entry runs after those scripts, so shim modules can safely return global browser objects.

## Removed Backend And WeChat Behavior

The following behavior is removed from all migrated activities:

- WeChat login
- WeChat OAuth redirects
- WeChat JS SDK signature requests
- WeChat share binding
- Sensitive-word checks
- Tracking pixel/API calls
- Result save APIs
- User info APIs
- Old Sohu CDN or OSS project-asset URLs

Replacement behavior:

- WeChat modules export no-op functions.
- Tracking modules export no-op functions.
- Sensitive-word validation is replaced by local length/empty checks only.
- Save APIs are removed; successful local game actions proceed directly to the next page.
- User-specific counts use local storage when already present in the original non-WeChat flow, otherwise use deterministic local fallback values.

## Per-Project Migration Notes

### 1904_tale

Primary changes:

- Convert `index.hbs` to `1904_tale/index.html`.
- Fix hard-coded asset paths from old `src/project/tale/...` to local `./asset/...` paths.
- Remove `util.bindWX()` and `util.eventTracking()` from startup.
- Keep Hilo scene, Scroller interaction, local audio, and visual sequence intact.

Success criteria:

- Page loads without external script or API dependency.
- Loading completes from local image assets.
- Canvas scene appears and can scroll/interact.

### 1905_word

Primary changes:

- Convert `index.hbs` to `1905_word/index.html`.
- Change `Resource.getAssetPath()` to local `./asset/image/`.
- Force non-WeChat mode in `Global`.
- Remove OAuth, avatar fetch, share signature, tracking, result save, and user info API calls.
- Continue to result/share page from local front-end logic only.

Success criteria:

- Start page appears.
- Begin video can be played or skipped through the original interaction.
- Game page can be entered.
- A correct local result can reach the share/result screen without backend calls.

### 1907_cp

Primary changes:

- Convert `index.hbs` to `1907_cp/index.html`.
- Replace missing `config/Env.json` usage with local `Global.publicPath = import.meta.env.BASE_URL + '1907_cp/asset'`.
- Replace imports from old shared `components/util` with local `legacy-utils.js`.
- Remove `bindWX()` and tracking calls.
- Replace sensitive-word API with local name validation.
- Keep question flow, result calculation, long page, and share image generation.

Success criteria:

- Loading completes from local assets.
- Questions can be answered.
- Information page submits without backend request.
- Result/share page renders.

### 1908_parade

Primary changes:

- Convert `index.hbs` to `1908_parade/index.html`.
- Replace missing `config/Env.json` usage with local `Global.publicPath = import.meta.env.BASE_URL + '1908_parade/asset'`.
- Replace imports from old shared `components/util` with local `legacy-utils.js`.
- Remove `bindWX()` and tracking calls.
- Keep local audio/video assets and scrolling scene behavior.

Success criteria:

- Loading completes from local assets.
- Main parade sequence renders.
- Scroll interaction works.
- Local video/audio references resolve.

## Error Handling

Legacy startup should not crash when removed services are unavailable. No-op services must either return synchronously or resolve successfully. Any retained optional browser API calls, such as audio playback, should fail without blocking the page.

Network access is not required for the four activities to display and be experienced. Browser console errors caused by removed backend, missing globals, or missing local assets are treated as migration failures.

## Testing And Verification

Build verification:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run build -- legacy-h5
```

Local preview verification:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run dev -- legacy-h5
```

Browser verification:

- Open `/legacy-h5/`.
- Open each activity URL.
- Confirm no startup console errors for missing `Hilo`, `$`, `Scroller`, `wx`, local assets, or removed API calls.
- Confirm every activity reaches its main playable/display state.

Deployment verification:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run deploy -- legacy-h5
```

The production Nginx config must route `/legacy-h5/` to `/opt/zhangrh-shop/site/legacy-h5/` with `try_files $uri $uri/ /legacy-h5/index.html`.

After deployment, verify the same five URLs under the production host:

- `https://zhangrh.shop/legacy-h5/`
- `https://zhangrh.shop/legacy-h5/1904_tale/`
- `https://zhangrh.shop/legacy-h5/1905_word/`
- `https://zhangrh.shop/legacy-h5/1907_cp/`
- `https://zhangrh.shop/legacy-h5/1908_parade/`

## Non-Goals

- Rewriting activities in React.
- Recreating old WeChat production behavior.
- Reconnecting to old Sohu APIs.
- Uploading assets to OSS or any CDN.
- Optimizing image/video size during initial migration.
- Refactoring old activity internals beyond what is needed for local build and display.
