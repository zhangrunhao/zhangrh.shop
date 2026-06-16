# ShotMarker Frontend Setup Plan

## Goal

Create an independent frontend project for the iOS app ShotMarker, served under:

```txt
https://zhangrh.shop/shotmarker/support
https://zhangrh.shop/shotmarker/privacy
```

This plan only covers project structure, routing, build output, deployment mapping, and Nginx configuration. It does not define the final support or privacy page content.

## Current Project Context

The repository already supports multiple Vite frontend projects:

```txt
frontend/project/hub
frontend/project/cardgame
```

The shared Vite helper derives each project's production base path from its folder name:

```txt
frontend/project/<project-name> -> /<project-name>/
```

That means a new project at:

```txt
frontend/project/shotmarker
```

will naturally build with:

```txt
base: /shotmarker/
dist: frontend/dist/shotmarker
```

The existing deploy script maps build output by project name:

```txt
frontend/dist/shotmarker -> /opt/zhangrh-shop/site/shotmarker
```

## Recommended Approach

Add ShotMarker as a new independent Vite React project, not as a route inside `hub`.

Reasons:

- ShotMarker is a standalone iOS app, so its App Store support and privacy URLs should look product-specific.
- The current frontend tooling already supports independent projects under `frontend/project/<name>`.
- The new app can keep its own metadata, title, favicon, styles, routing, and future marketing/support pages.
- The deploy and Nginx model stays consistent with `hub` and `cardgame`.

## Target Directory Structure

Create this minimal project structure:

```txt
frontend/project/shotmarker/
├── vite.config.ts
├── index.html
├── main.tsx
├── app.tsx
├── styles.css
└── shared/
    └── route.ts
```

Suggested file responsibilities:

- `vite.config.ts`: reuse `createProjectConfig` from `frontend/vite.config.ts`.
- `index.html`: app shell and page metadata for ShotMarker.
- `main.tsx`: React root bootstrap.
- `app.tsx`: top-level layout and route switch.
- `styles.css`: project-specific styling.
- `shared/route.ts`: normalize `/shotmarker/support`, `/shotmarker/privacy`, `/support`, and `/privacy` into internal route names.

The support/privacy content can start as placeholders during setup, then be replaced once the app data practices and support process are finalized.

## Routing Design

Use a small client-side router for the ShotMarker project:

```txt
/shotmarker/         -> redirect or render support by default
/shotmarker/support  -> Support page
/shotmarker/privacy  -> Privacy Policy page
```

Recommended behavior:

- Treat `/shotmarker/` as a redirect to `/shotmarker/support`, or render the support page directly.
- Keep `/shotmarker/support` and `/shotmarker/privacy` as clean URLs for App Store Connect.
- Do not create separate static folders such as `/shotmarker/support/index.html`; let Nginx fall back to `/shotmarker/index.html` and let React choose the page.

## Production Nginx Status

The production Nginx config at `/opt/zhangrh-shop/nginx/conf.d/zhangrh.shop.conf` has already been updated and reloaded for ShotMarker.

The project route section should contain:

```nginx
location = /hub {
    return 301 /hub/;
}

location /hub/ {
    try_files $uri $uri/ /hub/index.html;
}

location = /cardgame {
    return 301 /cardgame/;
}

location /cardgame/ {
    try_files $uri $uri/ /cardgame/index.html;
}

location = /shotmarker {
    return 301 /shotmarker/;
}

location /shotmarker/ {
    try_files $uri $uri/ /shotmarker/index.html;
}
```

Why the ShotMarker block is needed:

- `/shotmarker/support` and `/shotmarker/privacy` are client-side routes.
- Those files will not physically exist on disk.
- `try_files ... /shotmarker/index.html` makes Nginx serve the ShotMarker SPA entry for every `/shotmarker/...` route.
- The exact `/shotmarker` redirect prevents a no-trailing-slash request from missing the `/shotmarker/` location.

No additional Nginx change is needed for the first ShotMarker frontend deployment unless the server config is rebuilt from scratch.

For the current Docker Compose deployment documented in this repo, the intended static root is:

```txt
/opt/zhangrh-shop/site
```

So the server must contain:

```txt
/opt/zhangrh-shop/site/shotmarker/index.html
/opt/zhangrh-shop/site/shotmarker/static/...
```

## Implementation Steps

1. Create `frontend/project/shotmarker`.
2. Add a Vite config that reuses the shared `createProjectConfig`.
3. Add the React app shell and a small router for `support` and `privacy`.
4. Add placeholder pages only to validate routing.
5. Build locally:

```bash
cd frontend
npm run build -- shotmarker
```

6. Confirm output:

```txt
frontend/dist/shotmarker/index.html
frontend/dist/shotmarker/static/...
```

7. Deploy:

```bash
cd frontend
npm run deploy -- shotmarker
```

8. Verify production routes and assets. Nginx has already been updated for `/shotmarker/`.

## Verification Checklist

Run these after implementation and deployment:

```bash
cd frontend
npm run lint
npx tsc -p tsconfig.app.json
npm run build -- shotmarker
rg '/shotmarker/static/' dist/shotmarker/index.html
```

After deploy:

```bash
curl -k -I https://zhangrh.shop/shotmarker/
curl -k -I https://zhangrh.shop/shotmarker/support
curl -k -I https://zhangrh.shop/shotmarker/privacy
curl -ks https://zhangrh.shop/shotmarker/ | rg '/shotmarker/static/'

asset_path="$(curl -ks https://zhangrh.shop/shotmarker/ | sed -nE 's/.*"(\/shotmarker\/static\/[^"]+)".*/\1/p' | head -1)"
test -n "$asset_path"
curl -k -I "https://zhangrh.shop${asset_path}"
```

Expected results:

- `/shotmarker/` returns `200` or redirects to `/shotmarker/support`.
- `/shotmarker/support` returns `200`.
- `/shotmarker/privacy` returns `200`.
- `dist/shotmarker/index.html` references `/shotmarker/static/...`.
- A deployed asset under `/shotmarker/static/...` returns `200`.

## App Store Connect URLs

Use these full URLs in App Store Connect after deployment:

```txt
Support URL: https://zhangrh.shop/shotmarker/support
Privacy Policy URL: https://zhangrh.shop/shotmarker/privacy
```

The privacy URL should also be linked inside the iOS app before submission, because App Review expects the privacy policy to be easily accessible in the app.

## Open Decisions For Later

- Final support page copy and contact method.
- Final privacy policy text based on the actual iOS data collection behavior.
- Whether `/shotmarker/` should redirect to support or become a small product landing page later.
- Whether ShotMarker should eventually be listed inside `hub` as a product card that links to `/shotmarker/support` or a future `/shotmarker/` landing page.
