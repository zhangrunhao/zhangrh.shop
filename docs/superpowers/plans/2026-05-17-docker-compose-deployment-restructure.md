# Docker Compose Deployment Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Continue the `zhangrh.shop` deployment restructure from the current nginx-only state: first publish the real frontend to `/opt/zhangrh-shop/site`, then prepare and activate the backend Docker service in a separate phase.

**Architecture:** The main server already runs `zhangrh-nginx` from `/opt/zhangrh-shop` and serves `/hub/` and `/cardgame/` from `/opt/zhangrh-shop/site`. Keep this nginx entry stable while frontend publishing is fixed. Backend Docker work is deferred until the backend image, backend publish script, server `compose.yml`, and Nginx `/api/` proxy can be changed together without breaking the current frontend-only deployment.

**Tech Stack:** React/Vite, Node.js 20, Express, WebSocket, Docker Compose, Nginx, rsync, Node `node:test`

---

## Current Production State

This state is already complete and should not be repeated as part of the next frontend publishing step:

```txt
/opt/zhangrh-shop
├── compose.yml
├── nginx/conf.d/zhangrh.shop.conf
├── certs/zhangrh.shop.pem
├── certs/zhangrh.shop.key
└── site/
    ├── hub/index.html
    └── cardgame/index.html
```

Running container:

```txt
zhangrh-nginx   nginx:alpine   80/443
```

Current route behavior:

```txt
http://zhangrh.shop        -> 301 to https
https://zhangrh.shop       -> 302 to /hub/
/hub/                      -> returns current temporary page
/cardgame/                 -> returns current temporary page
/api/                      -> 503 backend is not deployed yet
```

Operational rules from this point:

- Do not stop or recreate `zhangrh-nginx` for frontend publishing.
- Do not re-run the old `nginx-gateway` cutover steps.
- Do not add the backend service to server `compose.yml` until backend files and publish scripts are ready.
- Do not change Nginx `/api/` from `503` to `proxy_pass http://backend:3001` until the backend container has been built and started.
- Do not publish frontend files to `/var/www/zhangrh.shop`.
- Do not use PM2 for backend deployment.
- Do not involve `static.zhangrh.shop` or OSS in this phase.

---

## Target Final State

After all phases are complete:

```txt
/opt/zhangrh-shop
├── compose.yml
├── nginx/
│   └── conf.d/
│       └── zhangrh.shop.conf
├── certs/
│   ├── zhangrh.shop.pem
│   └── zhangrh.shop.key
├── site/
│   ├── hub/
│   └── cardgame/
└── backend/
    ├── Dockerfile
    ├── server.js
    ├── package.json
    ├── package-lock.json
    └── projects/
```

Final request flow:

```txt
user
  -> zhangrh.shop
  -> zhangrh-nginx container
     -> /hub/       serves /opt/zhangrh-shop/site/hub
     -> /cardgame/  serves /opt/zhangrh-shop/site/cardgame
     -> /api/       proxies to backend:3001
```

---

## Phase Order

Execute phases in this order:

1. **Phase 1: Publish real frontend.** Only change frontend deploy target and publish `hub` / `cardgame` static files to `/opt/zhangrh-shop/site`.
2. **Phase 2: Prepare backend Docker locally.** Add `backend/Dockerfile` and rewrite backend publishing so it no longer uses PM2.
3. **Phase 3: Activate backend on server.** Upload backend files, add backend service to server Compose, start backend, then switch Nginx `/api/` to proxy.
4. **Phase 4: Documentation cleanup.** Record the new server state and remove stale `/var/www` / PM2 instructions from project docs.

---

### Task 1: Update Frontend Deploy Target

**Files:**
- Modify: `frontend/scripts/deploy-static.test.mjs`
- Modify: `frontend/scripts/deploy-static.mjs`

- [ ] **Step 1: Update deploy-static tests first**

Modify `frontend/scripts/deploy-static.test.mjs` so the deployment target assertions use `/opt/zhangrh-shop/site`:

```js
test('defaults use compose site rsync target', () => {
  assert.equal(DEFAULT_PROJECT_NAME, 'hub')
  assert.equal(DEFAULT_RSYNC_USER, 'root')
  assert.equal(DEFAULT_RSYNC_HOST, '101.200.185.29')
  assert.equal(DEFAULT_RSYNC_DEST, '/opt/zhangrh-shop/site')
})

test('remoteDirForProject joins base and project', () => {
  assert.equal(remoteDirForProject('/opt/zhangrh-shop/site', 'hub'), '/opt/zhangrh-shop/site/hub')
  assert.equal(remoteDirForProject('/opt/zhangrh-shop/site/', 'hub'), '/opt/zhangrh-shop/site/hub')
})

test('ensureTrailingSlash appends once', () => {
  assert.equal(ensureTrailingSlash('/opt/zhangrh-shop/site/hub'), '/opt/zhangrh-shop/site/hub/')
  assert.equal(ensureTrailingSlash('/opt/zhangrh-shop/site/hub/'), '/opt/zhangrh-shop/site/hub/')
})

test('shellEscape quotes safely', () => {
  assert.equal(shellEscape('/opt/zhangrh-shop/site/hub'), "'/opt/zhangrh-shop/site/hub'")
  assert.equal(shellEscape("abc'def"), "'abc'\\''def'")
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
cd frontend
node --test scripts/deploy-static.test.mjs
```

Expected: FAIL because `DEFAULT_RSYNC_DEST` still points to `/var/www/zhangrh.shop`.

- [ ] **Step 3: Change deploy-static default destination**

Modify `frontend/scripts/deploy-static.mjs`:

```js
export const DEFAULT_RSYNC_USER = 'root'
export const DEFAULT_RSYNC_HOST = '101.200.185.29'
export const DEFAULT_RSYNC_DEST = '/opt/zhangrh-shop/site'
```

Keep this logic unchanged:

```js
export const distDirForProject = (projectName) => path.join('dist', projectName)

export const remoteDirForProject = (baseDir, projectName) =>
  `${baseDir.replace(/\/+$/, '')}/${projectName}`
```

This preserves the intended mapping:

```txt
dist/hub      -> /opt/zhangrh-shop/site/hub/
dist/cardgame -> /opt/zhangrh-shop/site/cardgame/
```

- [ ] **Step 4: Run frontend deployment tests**

Run:

```bash
cd frontend
node --test scripts/deploy-static.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Run frontend static checks**

Run:

```bash
cd frontend
npm run lint
npx tsc -p tsconfig.app.json
```

Expected: both commands pass.

- [ ] **Step 6: Build real frontend projects**

Run:

```bash
cd frontend
npm run build -- hub
npm run build -- cardgame
```

Expected:

```txt
frontend/dist/hub/index.html
frontend/dist/hub/static/...
frontend/dist/cardgame/index.html
frontend/dist/cardgame/static/...
```

Also verify the generated asset paths remain project-prefixed:

```bash
rg '"/hub/static|/hub/static' dist/hub/index.html
rg '"/cardgame/static|/cardgame/static' dist/cardgame/index.html
```

Expected: `hub` output references `/hub/static/...`; `cardgame` output references `/cardgame/static/...`.

- [ ] **Step 7: Commit frontend deploy target change**

```bash
git add frontend/scripts/deploy-static.mjs frontend/scripts/deploy-static.test.mjs
git commit -m "chore: 前端发布目录迁移到 opt"
```

---

### Task 2: Publish Real Frontend To The New Server Layout

**Files:**
- Verify only

- [ ] **Step 1: Publish hub**

Run:

```bash
cd frontend
npm run deploy -- hub
```

Expected final upload target:

```txt
root@101.200.185.29:/opt/zhangrh-shop/site/hub/
```

- [ ] **Step 2: Publish cardgame**

Run:

```bash
cd frontend
npm run deploy -- cardgame
```

Expected final upload target:

```txt
root@101.200.185.29:/opt/zhangrh-shop/site/cardgame/
```

- [ ] **Step 3: Verify public frontend routes**

Run:

```bash
curl -k -I https://zhangrh.shop/hub/
curl -k -I https://zhangrh.shop/cardgame/
```

Expected:

```txt
/hub/ returns 200
/cardgame/ returns 200
```

- [ ] **Step 4: Verify API is still intentionally unavailable**

Run:

```bash
curl -k -i https://zhangrh.shop/api/
```

Expected:

```txt
HTTP/2 503
backend is not deployed yet
```

Do not treat this as a failure during Phase 1. It confirms the backend has not been half-wired.

---

### Task 3: Prepare Backend Docker Runtime Locally

**Files:**
- Create: `backend/Dockerfile`
- Modify: `backend/package.json`

- [ ] **Step 1: Add backend Dockerfile**

Create `backend/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY server.js ./server.js
COPY projects ./projects

EXPOSE 3001
CMD ["node", "server.js"]
```

- [ ] **Step 2: Give backend a real test script**

Modify `backend/package.json`:

```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "publish": "node tools/publish.mjs",
    "start": "node server.js",
    "test": "node --test tools/*.test.mjs"
  }
}
```

- [ ] **Step 3: Verify Docker build locally**

Run:

```bash
cd backend
docker build -t zhangrh-backend:test .
```

Expected: the image builds successfully and installs production dependencies only.

- [ ] **Step 4: Commit backend Dockerfile**

```bash
git add backend/Dockerfile backend/package.json
git commit -m "chore: 后端改为 Docker 运行"
```

---

### Task 4: Rewrite Backend Publish Flow For Docker Compose

**Files:**
- Create: `backend/tools/publish-lib.mjs`
- Create: `backend/tools/publish-lib.test.mjs`
- Modify: `backend/tools/publish.mjs`

- [ ] **Step 1: Write backend publish helper tests**

Create `backend/tools/publish-lib.test.mjs`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_COMPOSE_ROOT,
  DEFAULT_RSYNC_DEST,
  buildRemoteComposeCommand,
  buildRsyncArgs,
  ensureTrailingSlash,
} from './publish-lib.mjs'

test('backend publish default destination is the compose backend directory', () => {
  assert.equal(DEFAULT_RSYNC_DEST, '/opt/zhangrh-shop/backend')
})

test('backend compose root is the deployment root', () => {
  assert.equal(DEFAULT_COMPOSE_ROOT, '/opt/zhangrh-shop')
})

test('ensureTrailingSlash appends one trailing slash', () => {
  assert.equal(ensureTrailingSlash('/opt/zhangrh-shop/backend'), '/opt/zhangrh-shop/backend/')
  assert.equal(ensureTrailingSlash('/opt/zhangrh-shop/backend/'), '/opt/zhangrh-shop/backend/')
})

test('buildRsyncArgs includes Docker runtime files', () => {
  const args = buildRsyncArgs({ remote: 'root@example.com', remoteDest: '/opt/zhangrh-shop/backend/' })
  assert.deepEqual(args.slice(0, 2), ['-avz', '--delete'])
  assert.ok(args.includes('Dockerfile'))
  assert.ok(args.includes('server.js'))
  assert.ok(args.includes('package.json'))
  assert.ok(args.includes('package-lock.json'))
  assert.ok(args.includes('projects/***'))
  assert.equal(args.at(-1), 'root@example.com:/opt/zhangrh-shop/backend/')
})

test('buildRemoteComposeCommand rebuilds only backend service from deployment root', () => {
  assert.equal(
    buildRemoteComposeCommand('/opt/zhangrh-shop'),
    "cd '/opt/zhangrh-shop' && docker compose up -d --build backend",
  )
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd backend
npm test
```

Expected: FAIL because `backend/tools/publish-lib.mjs` does not exist.

- [ ] **Step 3: Add backend publish helper module**

Create `backend/tools/publish-lib.mjs`:

```js
export const DEFAULT_RSYNC_USER = 'root'
export const DEFAULT_RSYNC_HOST = '101.200.185.29'
export const DEFAULT_RSYNC_DEST = '/opt/zhangrh-shop/backend'
export const DEFAULT_COMPOSE_ROOT = '/opt/zhangrh-shop'

export const ensureTrailingSlash = (value) => (value.endsWith('/') ? value : `${value}/`)

export const shellEscape = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`

export const buildRsyncArgs = ({ remote, remoteDest }) => [
  '-avz',
  '--delete',
  '--include',
  'Dockerfile',
  '--include',
  'server.js',
  '--include',
  'package.json',
  '--include',
  'package-lock.json',
  '--include',
  'projects/',
  '--include',
  'projects/***',
  '--exclude',
  '*',
  './',
  `${remote}:${ensureTrailingSlash(remoteDest)}`,
]

export const buildRemoteComposeCommand = (composeRoot = DEFAULT_COMPOSE_ROOT) =>
  `cd ${shellEscape(composeRoot)} && docker compose up -d --build backend`
```

- [ ] **Step 4: Rewrite backend publish script**

Replace `backend/tools/publish.mjs` with:

```js
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import {
  DEFAULT_COMPOSE_ROOT,
  DEFAULT_RSYNC_DEST,
  DEFAULT_RSYNC_HOST,
  DEFAULT_RSYNC_USER,
  buildRemoteComposeCommand,
  buildRsyncArgs,
  ensureTrailingSlash,
  shellEscape,
} from './publish-lib.mjs'

const findBackendRoot = (start) => {
  let current = start
  while (true) {
    const pkgPath = path.join(current, 'package.json')
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
        if (pkg?.name === 'backend') {
          return current
        }
      } catch {
        // ignore invalid package.json
      }
    }
    const parent = path.dirname(current)
    if (parent === current) {
      return null
    }
    current = parent
  }
}

const parseArgs = (args) => {
  const options = {}
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '--user') {
      options.user = args[i + 1]
      i += 1
      continue
    }
    if (arg === '--host') {
      options.host = args[i + 1]
      i += 1
      continue
    }
    if (arg === '--dest') {
      options.dest = args[i + 1]
      i += 1
      continue
    }
    if (arg === '--compose-root') {
      options.composeRoot = args[i + 1]
      i += 1
    }
  }
  return options
}

const run = (command, args, options) => {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const backendRoot = findBackendRoot(process.cwd())
if (!backendRoot) {
  console.error('Unable to locate backend root (package.json name: backend).')
  process.exit(1)
}

const cliOptions = parseArgs(process.argv.slice(2))
const rsyncUser = cliOptions.user ?? DEFAULT_RSYNC_USER
const rsyncHost = cliOptions.host ?? DEFAULT_RSYNC_HOST
const rsyncDest = cliOptions.dest ?? DEFAULT_RSYNC_DEST
const composeRoot = cliOptions.composeRoot ?? DEFAULT_COMPOSE_ROOT

const remote = `${rsyncUser}@${rsyncHost}`
const remoteDest = ensureTrailingSlash(rsyncDest)

run('ssh', [remote, `mkdir -p ${shellEscape(rsyncDest)}`])
run('rsync', buildRsyncArgs({ remote, remoteDest }), { cwd: backendRoot })
run('ssh', [remote, buildRemoteComposeCommand(composeRoot)])
```

- [ ] **Step 5: Run backend tests**

Run:

```bash
cd backend
npm test
node --check server.js
node --check projects/cardgame.js
docker build -t zhangrh-backend:test .
```

Expected: all commands pass.

- [ ] **Step 6: Commit backend publish rewrite**

```bash
git add backend/tools/publish.mjs backend/tools/publish-lib.mjs backend/tools/publish-lib.test.mjs
git commit -m "chore: 后端发布改为 Docker Compose"
```

---

### Task 5: Activate Backend On Server

**Files:**
- Server only: `/opt/zhangrh-shop/compose.yml`
- Server only: `/opt/zhangrh-shop/nginx/conf.d/zhangrh.shop.conf`

- [ ] **Step 1: Add backend service to server compose**

On server, edit `/opt/zhangrh-shop/compose.yml` so it contains:

```yaml
services:
  nginx:
    image: nginx:alpine
    container_name: zhangrh-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certs:/etc/nginx/certs:ro
      - ./site:/usr/share/nginx/html:ro
      - ./logs/nginx:/var/log/nginx

  backend:
    build:
      context: ./backend
    container_name: zhangrh-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3001
    expose:
      - "3001"
```

- [ ] **Step 2: Publish backend files and build backend container**

Run:

```bash
cd backend
npm run publish
```

Expected: this uploads backend files to:

```txt
/opt/zhangrh-shop/backend/
```

Expected remote action:

```bash
cd /opt/zhangrh-shop
docker compose up -d --build backend
```

- [ ] **Step 3: Verify backend container without changing Nginx yet**

Run on server:

```bash
cd /opt/zhangrh-shop
docker compose ps
docker logs --tail=100 zhangrh-backend
```

Expected: `zhangrh-backend` is running.

- [ ] **Step 4: Switch Nginx `/api/` to backend proxy**

On server, replace the current `/api/` 503 location in `/opt/zhangrh-shop/nginx/conf.d/zhangrh.shop.conf` with:

```nginx
location /api/ {
  proxy_pass http://backend:3001;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection $connection_upgrade;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto https;
  proxy_connect_timeout 60s;
  proxy_send_timeout 3600s;
  proxy_read_timeout 3600s;
}
```

Keep `/track` as an Nginx `204` endpoint unless a backend tracking route is added in a separate feature.

- [ ] **Step 5: Reload Nginx**

Run on server:

```bash
docker exec zhangrh-nginx nginx -t
docker exec zhangrh-nginx nginx -s reload
```

Expected: `nginx -t` succeeds and reload completes without recreating the container.

- [ ] **Step 6: Verify backend public route**

Run:

```bash
curl -k https://zhangrh.shop/api/cardgame/health
```

Expected:

```json
{"ok":true,"project":"cardgame"}
```

---

### Task 6: Update Long-Term Deployment Documentation

**Files:**
- Create: `docs/deploy/zhangrh-shop-docker-compose.md`
- Modify: `docs/back.md`
- Modify: `automation/README.md`

- [ ] **Step 1: Create deployment state document**

Create `docs/deploy/zhangrh-shop-docker-compose.md`:

````md
# zhangrh.shop Docker Compose Deployment

## Current Layout

`zhangrh.shop` is deployed under `/opt/zhangrh-shop` on the main server.

```txt
/opt/zhangrh-shop
├── compose.yml
├── nginx/conf.d/zhangrh.shop.conf
├── certs/
├── site/
│   ├── hub/
│   └── cardgame/
└── backend/
```

## Frontend Publish

Frontend static files are built locally and uploaded with rsync:

```bash
cd frontend
npm run lint
npx tsc -p tsconfig.app.json
npm run build -- hub
npm run deploy -- hub
npm run build -- cardgame
npm run deploy -- cardgame
```

Targets:

```txt
dist/hub/      -> /opt/zhangrh-shop/site/hub/
dist/cardgame/ -> /opt/zhangrh-shop/site/cardgame/
```

Nginx reload is not required after frontend publishing.

## Backend Publish

Backend source is uploaded to `/opt/zhangrh-shop/backend` and run by Docker Compose:

```bash
cd backend
npm run publish
```

The backend publish flow rebuilds only the backend service:

```bash
cd /opt/zhangrh-shop
docker compose up -d --build backend
```

## Verification

```bash
curl -k -I https://zhangrh.shop/hub/
curl -k -I https://zhangrh.shop/cardgame/
curl -k https://zhangrh.shop/api/cardgame/health
docker exec zhangrh-nginx nginx -t
docker compose -f /opt/zhangrh-shop/compose.yml ps
```
````

- [ ] **Step 2: Update domain/service ledger**

Modify `docs/back.md` to include:

```md
- `zhangrh.shop` is served from `/opt/zhangrh-shop`.
- `/hub/` and `/cardgame/` are static directories under `/opt/zhangrh-shop/site`.
- `/api/` is currently `503` until backend Docker is activated; after backend activation it proxies to `backend:3001`.
- `static.zhangrh.shop` remains OSS-backed and is not part of the current app deployment path.
- `zhangrh.top` is not part of this deployment plan.
```

- [ ] **Step 3: Update automation boundary docs**

Modify `automation/README.md` so publish automation owns deployment helpers, while runtime ownership remains:

```md
- Frontend runtime files live under `/opt/zhangrh-shop/site` on the server.
- Backend runtime is managed by Docker Compose under `/opt/zhangrh-shop`.
- Automation scripts may upload files and trigger `docker compose`, but product runtime code stays in `frontend/` and `backend/`.
```

- [ ] **Step 4: Commit documentation**

```bash
git add docs/deploy/zhangrh-shop-docker-compose.md docs/back.md automation/README.md
git commit -m "docs: 更新 Docker Compose 部署状态"
```

---

## Final Verification Checklist

Run after all phases:

```bash
npm test

cd frontend
npm run lint
npx tsc -p tsconfig.app.json
node --test scripts/deploy-static.test.mjs
npm run build -- hub
npm run build -- cardgame

cd ../backend
npm test
node --check server.js
node --check projects/cardgame.js
docker build -t zhangrh-backend:test .
```

Run against production:

```bash
curl -k -I https://zhangrh.shop/hub/
curl -k -I https://zhangrh.shop/cardgame/
curl -k -I "https://zhangrh.shop/track?project=hub&event=test"
curl -k https://zhangrh.shop/api/cardgame/health
```

Expected:

```txt
/hub/ returns 200
/cardgame/ returns 200
/track returns 204
/api/cardgame/health returns {"ok":true,"project":"cardgame"} after backend activation
```
