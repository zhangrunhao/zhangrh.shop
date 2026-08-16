# zhangrh.shop 部署说明

本文档只记录仓库脚本能够证实的部署约定，不记录云实例、网络地址或资源台账。

## 逻辑架构

```text
浏览器
├── https://zhangrh.shop/hub/        -> Hub HTML
├── https://zhangrh.shop/cardgame/   -> Cardgame HTML
├── https://zhangrh.shop/shotmarker/ -> ShotMarker HTML
├── https://zhangrh.shop/track        -> Nginx 返回 204 并写入 JSONL
├── https://zhangrh.shop/api/track/summary
│                                      -> Node/Express 只读流式聚合 JSONL
├── https://zhangrh.shop/api/cardgame/health
│                                      -> Node/Express
└── wss://zhangrh.shop/api/cardgame/ws -> WebSocket

前端 HTML 引用的 JS、CSS、图片等静态资源
└── https://static.zhangrh.shop/zhangrh-shop/<project>/static/
```

前端发布把 HTML 和静态资源分开：HTML 通过 SSH/rsync 上传到站点目录，`static` 目录中的构建产物上传到 OSS。后端通过 SSH/rsync 上传，再由目标环境中的 Docker Compose 重建 `backend` 服务。

## 目标目录

发布脚本使用以下目录约定：

```text
/opt/zhangrh-shop/
├── data/
│   └── track/                 # 埋点 JSONL 持久目录（服务器私有维护）
├── site/
│   ├── hub/
│   ├── cardgame/
│   └── shotmarker/
└── backend/
    ├── .dockerignore
    ├── Dockerfile
    ├── server.js
    ├── package.json
    ├── package-lock.json
    └── projects/
```

Compose 的项目根目录是 `/opt/zhangrh-shop`。`data/track` 是逻辑上的宿主机持久目录，由 Nginx 写入并以只读方式挂载给 Backend。目标环境的 Compose、Nginx 和该数据目录都由服务器私有维护，不提交到当前仓库；其具体配置内容不在本文档中推断。

当前 Track 存储刻意保持简单：Nginx 持续追加单一的 `events.jsonl`，不配置 Track 专用 logrotate，也不自动删除历史数据。部署早期产生的 `.gz` 文件保留不动，Backend 仍兼容读取，但正常运行不会再自动生成新的轮转文件。当前文件达到 `32 MiB` 时应重新评估存储方案，不要等到 Backend 的 `64 MiB` 总解码上限才处理。

## OSS 配置

发布前端前在本地设置：

```bash
export OSS_ACCESS_KEY_ID='...'
export OSS_ACCESS_KEY_SECRET='...'
```

前端构建产物的公开前缀为：

```text
https://static.zhangrh.shop/zhangrh-shop/<project>/static/
```

不要把凭据写入仓库。

## 发布命令

在仓库根目录使用交互式入口：

```bash
npm run publish
```

或直接指定目标：

```bash
npm --prefix frontend run publish -- hub
npm --prefix frontend run publish -- cardgame
npm --prefix frontend run publish -- shotmarker
npm --prefix backend run publish
```

前端脚本依次执行 `git pull`、指定项目构建、OSS 静态资源上传与 HTML 资源地址改写、HTML rsync。后端脚本同步受控的运行文件，然后执行：

```bash
cd /opt/zhangrh-shop
docker compose up -d --build backend
```

首次启用埋点查询时，必须先在服务器完成以下私有基础设施，再发布 Backend：

1. 建立并校验 Track 宿主机持久目录及 Nginx 写权限。
2. 配置 `/track` 的 schema v1 JSONL 写入；当前只写单一 `events.jsonl`，不安装 Track 专用 logrotate。
3. 在 Compose 中把同一目录只读挂载到 Backend，并设置对应的 `TRACK_LOG_DIR`。
4. 为精确路径 `/api/track/summary` 配置公网只读代理和专用限流。
5. 验证 Nginx、Compose、当前文件写入和 Backend 只读查询后，再运行 Backend 发布命令。

仓库发布脚本只同步 Backend 受控运行文件并重建 `backend` 服务；它不会修改服务器 Compose、Nginx、Track 数据目录或服务器上的日志保留策略。

## 线上只读验证

发布完成后可从本地检查公开入口，不修改线上状态：

```bash
curl -I https://zhangrh.shop/hub/
curl -I https://zhangrh.shop/cardgame/
curl -I https://zhangrh.shop/shotmarker/
curl https://zhangrh.shop/api/cardgame/health
curl --fail-with-body 'https://zhangrh.shop/api/track/summary?days=1'
```

前三个请求应返回可访问的 HTML 响应；Cardgame 健康检查应返回包含 `ok: true` 和 `project: "cardgame"` 的 JSON；Track 查询应返回包含 `range`、`totals`、breakdown、`daily` 和 `diagnostics` 的 JSON。若前端 HTML 可访问但页面资源加载失败，再检查浏览器网络面板中 `static.zhangrh.shop` 的资源请求。

## 私有台账维护

完整的服务器、域名、证书和部署关系记录保存在 `docs/private.local/`。该目录是独立的私有 Git 仓库，并被当前公开仓库忽略；密码、SSH 私钥和 Token 仍只保存在 1Password。

修改台账后，在 `zhangrh.shop` 仓库根目录依次执行：

```bash
git -C docs/private.local status --short
git -C docs/private.local add -A
git -C docs/private.local diff --cached
git -C docs/private.local commit -m "docs: 更新项目台账"
git -C docs/private.local push
```

提交前必须检查暂存差异，确认其中没有密码、私钥、Token 或 `.env` 实际值。`git -C docs/private.local status --short --branch` 应在推送后显示工作区干净，且 `main` 与 `origin/main` 同步。
