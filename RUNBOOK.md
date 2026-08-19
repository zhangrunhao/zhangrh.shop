# zhangrh.shop 运行手册

当前仓库维护 `hub`、`cardgame`、`shotmarker`、`analytics` 四个前端项目和一个 `backend` 服务。所有命令均以仓库根目录为起点。

## 环境准备

使用 Node.js 24，并分别安装前后端依赖：

```bash
npm --prefix frontend ci
npm --prefix backend ci
```

## 本地启动

交互式选择一个前端项目或后端：

```bash
npm run dev
```

也可以在不同终端直接启动：

```bash
npm --prefix backend run dev
npm --prefix frontend run dev -- hub
npm --prefix frontend run dev -- cardgame
npm --prefix frontend run dev -- shotmarker
npm --prefix frontend run dev -- analytics
```

前端 Vite 开发服务器会把 `/api` 请求代理到 `http://localhost:3001`，Cardgame 的 WebSocket 也使用该代理。因此联调 Cardgame 或 Analytics 时需要同时启动后端和对应前端。

## 本地验证

```bash
# 根自动化、前端和后端测试
npm test

# 测试、lint、类型检查和全部前端构建
npm run check

# 单独构建一个前端项目
npm --prefix frontend run build -- hub

# 单独测试后端
npm --prefix backend test
```

## 发布前提

- 本机可通过 SSH 访问 `zhangrh.shop`，并已安装 `rsync`。
- 发布前端前设置 `OSS_ACCESS_KEY_ID` 和 `OSS_ACCESS_KEY_SECRET`。
- 前端发布脚本首先执行 `git pull`；运行前确认当前分支和工作区允许拉取远端更新。

## 埋点趋势查询

趋势接口的 `project`、`event`、`days` 全部必填。查询 Hub 默认事件最近 30 个上海自然日：

```bash
curl --fail-with-body \
  'https://zhangrh.shop/api/track/trend?project=hub&event=home_page_load&days=30'
```

查询 ShotMarker 默认事件并保存 JSON：

```bash
curl --fail-with-body \
  'https://zhangrh.shop/api/track/trend?project=shotmarker&event=app_launch&days=30' \
  --output track-trend.json
```

成功响应严格只有 `daily`。数组长度必须等于 `days`，日期按上海自然日连续升序且不重复，`pv`、`uv` 是满足 `0 <= uv <= pv` 的安全整数；没有记录的日期和完全没有该事件的范围也返回零值项。

该接口是公开只读聚合；客户端事件和设备标识可以伪造，不能把结果用于计费、风控或审计。稳定错误的处置方式如下：

- `400`：修正缺失、非法、未知或重复的 `project`、`event`、`days` 参数；`days` 只允许 `1`、`7`、`30`、`90`。
- `503 track_query_busy`：已有扫描，至少等待 `Retry-After` 指定的秒数再手工重试。
- `503 track_log_unavailable`：检查 Backend 的 Track 只读挂载、目录穿越权限和当前 `events.jsonl`。Backend 不读取轮转文件或 gzip。
- `503 track_log_too_large`：当前文件已超过 Backend 的 `64 MiB` 读取上限；停止重复查询并设计、验证、上线下一套存储机制，不临时移除上限。
- `503 track_query_timeout`：扫描超过 20 秒；停止重复查询并检查当前文件规模和主机 I/O。
- `500 internal_error`：检查 Backend 日志中的服务端异常；公开响应不会包含文件路径、原始行或堆栈。

四字段版本只使用当前 `events.jsonl`，不自动轮转、压缩或删除。达到 `32 MiB` 时启动存储方案评估，为 `64 MiB` 查询上限留出余量：

```bash
stat -c '%s bytes %n' /opt/zhangrh-shop/data/track/events.jsonl
```

## 四字段生产状态

私有台账记录的四字段生产切换与验收日期为 2026-08-16，本次文档迁移没有重新验证线上状态。

首次停服切换、旧数据删除和验证过程已经结束，记录保存在[四字段历史设计与执行清单](./docs/archive/2026-08-16-track-four-field-trend-redesign-spec.md#12-生产服务器执行清单)。不得把历史清单作为当前操作指令重新执行。

后续生产配置或存储迁移必须建立新的 Change，先完成只读预检，再获得对应外部变更和破坏性操作授权。普通代码发布不得删除 Track 数据或改写私有基础设施配置。

## 发布

在根目录交互式选择发布目标：

```bash
npm run publish
```

也可以直接发布指定目标：

```bash
npm --prefix frontend run publish -- hub
npm --prefix frontend run publish -- cardgame
npm --prefix frontend run publish -- shotmarker
npm --prefix frontend run publish -- analytics
npm --prefix backend run publish
```

前端发布流程与仓库脚本一致：

1. 在仓库根目录执行 `git pull`。
2. 构建指定前端项目。
3. 上传 `dist/<project>/static` 下的静态资源到 OSS，并把 HTML 中的资源地址改写为 `https://static.zhangrh.shop/zhangrh-shop/<project>/static/...`。
4. 把 `dist/<project>` 中的 HTML 上传到 `/opt/zhangrh-shop/site/<project>/`。

后端发布会把运行文件同步到 `/opt/zhangrh-shop/backend/`，随后在 `/opt/zhangrh-shop` 执行：

```bash
docker compose up -d --build backend
```

部署结构和发布后的只读检查见 [部署文档](./docs/deploy/README.md)。
