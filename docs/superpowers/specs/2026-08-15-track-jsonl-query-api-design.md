# Nginx 埋点持久化与公开查询接口实现 Spec

> **状态更新（2026-08-16）：** 本文已被[四字段埋点与单事件趋势重构设计](./2026-08-16-track-four-field-trend-redesign-design.md)取代，仅保留历史记录。旧 schema、轮转/gzip 读取、可选事件汇总 API 和响应字段不再代表当前实现。

> **状态更新（2026-08-16）：** 本文中的 Track 专用 logrotate、约 98 天保留和自动轮转设计已被[单一 JSONL 存储设计](./2026-08-16-track-single-jsonl-storage-design.md)取代。生产环境当前只持续追加 `events.jsonl`，不自动轮转或删除；历史 gzip 保留，Backend 兼容读取。本文其余 API、校验与聚合设计仍作为已实现功能的历史依据。

## 背景

Hub 与 Cardgame 已共用 `frontend/common/track.ts` 发送一方埋点。浏览器将
`time`、`project`、`device_id`、`event` 和 `params` 编码到同源
`GET /track` 请求中。线上 Nginx 对 `/track` 直接返回 `204`，请求不进入
Node/Express Backend。

2026-08-15 的现状盘点确认：

- `/track` 继承 Nginx 全局 Combined Log，完整查询参数与普通访问日志一起输出到
  stdout。
- Docker 使用 `json-file` 驱动；Nginx 容器已经配置单文件 `50 MB`、最多
  `3` 个文件的轮转上限。
- 旧容器日志曾累计约 `513 MB`、1,373,084 行，其中只有 395 条埋点，占
  `0.0288%`。
- 这 395 条埋点覆盖约 90 天、28 个设备标识；Hub 381 条，Cardgame 12 条，
  另有 2 条审计或诊断请求。
- 历史 Hub 数据包含已经下线的 `ideas`、`reviews`、`product_detail` 等值，
  说明参数值会随产品演进，读取端不能只接受当前页面和按钮枚举。
- 旧日志已经允许丢弃，不做历史迁移；新方案从正式上线时开始累计。
- 当前 Compose 与运行容器已经重新对齐：Nginx 只有配置、证书、站点三个只读
  挂载；全局 Docker 日志限制已经生效。

通用 Docker 日志适合故障排查，却不适合作为三个月产品埋点的来源：它的保留时间
受爬虫、静态页面、API 和错误流量共同影响，查询一次埋点需要扫描大量无关记录。
因此需要把 `/track` 从通用日志中分离，同时保持当前轻量级、无数据库的运行方式。

## 已确认决策

本设计基于用户确认的四项决策：

1. Nginx 接收 `/track`，将埋点独立写入
   `/var/log/nginx/track/events.jsonl`。
2. Backend 容器提供新的只读接口，直接查询 Nginx 保存的埋点并返回聚合结果。
3. 第一阶段查询接口无需鉴权，允许公网直接访问聚合结果。
4. 管理前端、账号密码登录和 Backend Session 管理属于独立的第二阶段；本 Spec 只记录
   方向，不实现该管理系统，也不为第一阶段预埋临时认证逻辑。

补充约束：

- 埋点保留目标为三个月。
- 普通 Nginx/Docker 日志继续使用已经生效的 `json-file`、`50 MB × 3` 配置。
- 所有服务器操作由用户执行；仓库实现和文档不能保存私钥、Token、IP、设备标识样本、
  真实访问日志或第二阶段未来使用的任何账号凭据与 Session 密钥。

## 目标

- 让 `/track` 事件独立、持久地保存为一行一条记录的 JSONL。
- 让埋点数据跨 Nginx 和 Backend 容器重建继续存在。
- 保留约 98 天数据，为最长 90 天查询预留一个轮转周期余量。
- 通过一个无需鉴权的公开 HTTP 接口查看 Hub 与 Cardgame 聚合数据。
- 查询接口默认可直接在浏览器打开并阅读 JSON，不依赖 SSH 拉日志或本地 CSV。
- Backend 对埋点目录保持只读，查询失败不能影响 Cardgame API 与 WebSocket。
- 不在埋点文件和接口响应中引入 IP、User-Agent、Referer、Cookie 或认证信息。
- 保持现有前端发送协议和事件调用点不变。

## 非目标

- 不引入 SQLite、PostgreSQL、ClickHouse、第三方分析 SDK 或独立分析平台。
- 第一阶段不增加统计后台页面、图表、账号系统、Session、登录接口、MFA 或多角色权限。
- 第一版不提供逐条原始事件接口、CSV 下载接口或具体 `device_id` 列表。
- 不补录已经删除的 Docker 日志，也不迁移旧的 395 条事件。
- 不修改 Hub 与 Cardgame 当前事件名称、参数或触发语义。
- 不把 GlitchTip、`back` 服务器或 OSS 纳入埋点链路。
- 不改变普通 Nginx/Docker 日志已经生效的 `50 MB × 3` 策略。
- 不把生产 Compose、真实 Nginx 配置或其他私有基础设施资产提交到公开仓库。
- 不把这些客户端可伪造的埋点用于计费、风控、审计或强一致业务指标。

## 分阶段范围

| 阶段 | 范围 | 本 Spec 状态 |
| --- | --- | --- |
| 第一阶段 | Nginx 独立保存 `events.jsonl`、logrotate 保留约三个月、Backend 只读聚合、公开 JSON API | 本次实现范围 |
| 第二阶段 | 独立管理前端、账号密码登录、Backend Session、面向全部项目的管理能力 | 仅记录方向，暂不实现 |

第一阶段可以独立上线，不依赖第二阶段。第二阶段必须先形成独立设计并再次确认，不能把
认证、Session 或管理页面实现混入第一阶段提交。

## 总体架构

```text
Hub / Cardgame
    │
    │ GET /track?time=...&project=...&device_id=...&event=...&params=...
    ▼
main 上的 Docker Nginx
    ├── 返回 204
    ├── 独立写 /var/log/nginx/track/events.jsonl
    └── 不再把 /track 写入通用 access log
                     │
                     │ 宿主机 bind mount
                     ▼
        /opt/zhangrh-shop/data/track
          ├── events.jsonl
          ├── events.jsonl-YYYYMMDD
          └── events.jsonl-YYYYMMDD.gz
                     │
                     │ Backend 只读挂载
                     ▼
GET /api/track/summary?days=30&project=hub
    │
    │ 公开访问 + Nginx 限流
    ▼
Backend 流式读取、校验、过滤和聚合
    │
    └── 返回不含原始设备标识的 JSON 汇总
```

职责边界：

- 前端只负责生成与发送事件。
- Nginx 负责接收、持久化、轮转配合、公开查询代理以及轻量限流。
- Backend 负责只读解析、时间过滤和聚合，不负责写入、删除或轮转。
- 宿主机负责持久目录和 `logrotate`。

## 前端协议

前端保持当前请求不变：

```text
GET /track
  ?time=<客户端毫秒时间戳>
  &project=<hub|cardgame>
  &device_id=<12 位字母数字标识>
  &event=<事件名称>
  &params=<URL 编码后的 JSON 对象>
```

约束：

- `time` 是客户端时间，只用于诊断，不作为查询范围和日维度统计依据。
- `received_at` 由服务器产生，是保留、筛选和按日聚合的唯一时间基准。
- `params` 继续允许扩展字段。聚合器只识别 `page_name` 和 `button`，同时允许
  其他字段存在。
- Nginx 对格式错误的请求仍返回 `204`，避免统计系统影响产品页面；错误记录由读取端
  拒绝并计数。

## JSONL 存储设计

### 路径与挂载

宿主机持久目录：

```text
/opt/zhangrh-shop/data/track
```

容器挂载：

| 服务 | 容器路径 | 模式 | 用途 |
| --- | --- | --- | --- |
| `nginx` | `/var/log/nginx/track` | 读写 | 追加 `events.jsonl` |
| `backend` | `/var/log/nginx/track` | 只读 | 查询当前和轮转日志 |

不得重新引入 `/var/log/nginx` 整目录挂载。只挂载 `track` 子目录，确保普通
`access.log` 与 `error.log` 继续输出到 stdout/stderr，并继续受 Docker
`50 MB × 3` 轮转约束。

宿主机权限目标：

- `/opt/zhangrh-shop/data/track`：`0750 root:root`。
- `events.jsonl` 及轮转文件：`0640 root:root`。
- 首次部署在重建 Nginx 前显式创建空的 `events.jsonl` 并设为 `0640`；不能依赖 Nginx
  用默认 mode 首次创建。后续新文件由 logrotate 的 `create 0640 root root` 保持一致。
- 当前 Nginx master 和 Backend 均以容器内 root 运行，因此能够分别写入和读取。
- 如果未来 Backend 改为非 root 用户，必须先重新设计共享组和文件所有权，不能简单
  放宽为全局可读。

### 单行格式

Nginx 使用 `escape=json` 输出严格的一行 JSON：

```json
{
  "schema_version": 1,
  "request_id": "0123456789abcdef0123456789abcdef",
  "received_at": "2026-08-15T04:00:00+00:00",
  "client_time": "1786766400000",
  "project": "hub",
  "device_id": "12 位设备标识",
  "event": "load_page",
  "params_encoded": "%7B%22page_name%22%3A%22home%22%7D"
}
```

示例中的 `request_id` 和事件内容均为合成值，不来自真实访问日志。

字段定义：

| 字段 | 来源 | 必填 | 说明 |
| --- | --- | --- | --- |
| `schema_version` | Nginx 常量 | 是 | 第一版固定为数字 `1` |
| `request_id` | `$request_id` | 是 | 32 位十六进制请求 ID，用于诊断和防止意外重复计数 |
| `received_at` | `$time_iso8601` | 是 | 服务器接收时间，带明确时区；容器当前可使用 UTC |
| `client_time` | `$arg_time` | 是 | 客户端毫秒时间戳，非可信 |
| `project` | `$arg_project` | 是 | 当前只接受 `hub`、`cardgame` |
| `device_id` | `$arg_device_id` | 是 | 必须匹配 `[A-Za-z0-9]{12}` |
| `event` | `$arg_event` | 是 | 非空字符串，最大 64 字符 |
| `params_encoded` | `$arg_params` | 是 | 表单查询编码后的 JSON 字符串 |

不写入以下字段：

- `$remote_addr`
- `$http_user_agent`
- `$http_referer`
- `$http_authorization`
- `$http_cookie`
- `$request` 或完整 `$request_uri`

这样既能保留产品分析必需信息，也不会把 IP、浏览器信息、Cookie、Authorization 或
整条 URL 复制到独立埋点文件。

### 数据有效性

存储层不阻塞客户端，读取端按以下规则验证：

- JSON 必须能解析为对象。
- `schema_version` 必须为 `1`；未知版本计入拒绝数。
- `request_id`、`received_at`、`project`、`device_id`、`event` 必须存在。
- `request_id` 必须严格匹配 32 位小写十六进制；不接受客户端提供的 ID。
- `received_at` 必须能被 JavaScript `Date` 正确解析。
- `client_time` 必须是 10～16 位十进制数字，但仍被视为非可信诊断字段。
- `project` 只允许 `hub`、`cardgame`；`audit`、`diagnostic` 和缺失值不会进入统计。
- `device_id` 必须严格匹配 12 位字母数字。
- `event` 必须匹配 `[A-Za-z][A-Za-z0-9_.:-]{0,63}`；不限定当前事件枚举，以兼容
  符合命名规范的历史和未来事件。
- `params_encoded` 使用查询字符串规则解码，尤其要正确处理 `+` 与 `%2B`；解码后不得
  超过 16 KiB，且结果必须是非 `null`、非数组的 JSON 对象。
- `page_name` 和 `button` 只有在值为 1～128 字符的字符串时才参与对应维度聚合；
  过长维度被忽略并计入诊断，但不使整条事件失效。
- 未识别的 `params` 字段被忽略，但不会导致整条事件无效。

### 去重

同一次查询中按 `request_id` 去重：

- 第一次出现的有效记录参与统计。
- 后续重复 `request_id` 被忽略并计入 `duplicate_records`。
- 不跨请求保存永久去重状态；正常 Nginx 与 logrotate 流程不应产生重复记录。

每一行按固定顺序分类：未完成尾行、空行、JSON 语法错误、结构/字段拒绝、重复、范围外、
项目过滤、最终纳入。除 `ignored_dimensions` 外，一行只进入一个排除分类，便于根据
`lines_read` 核对处理闭环。

## Nginx 设计

### 规范性配置骨架

以下片段是实现必须达到的配置形状，不是完整的 `zhangrh.shop.conf`。两个
`log_format` 与 `limit_req_zone` 位于 `http` 上下文；三个 `location` 位于现有主站
HTTPS `server` 中。部署时合并到现有私有配置，不能覆盖证书、静态站点和通用
`/api/` 代理。

```nginx
log_format track_json escape=json
    '{"schema_version":1,'
    '"request_id":"$request_id",'
    '"received_at":"$time_iso8601",'
    '"client_time":"$arg_time",'
    '"project":"$arg_project",'
    '"device_id":"$arg_device_id",'
    '"event":"$arg_event",'
    '"params_encoded":"$arg_params"}';

log_format track_query_redacted
    '$remote_addr - [$time_local] "$request_method $uri $server_protocol" '
    '$status $body_bytes_sent rt=$request_time';

limit_req_zone $binary_remote_addr zone=track_query:1m rate=10r/m;

location = /track {
    access_log /var/log/nginx/track/events.jsonl track_json;
    add_header Cache-Control "no-store" always;
    return 204;
}

location = /api/track {
    return 404;
}

location ^~ /api/track/ {
    access_log /var/log/nginx/access.log track_query_redacted;

    limit_req zone=track_query burst=10 nodelay;
    limit_req_status 429;

    proxy_pass http://backend:3001;
    proxy_http_version 1.1;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header Connection "";

    proxy_hide_header Cache-Control;

    add_header Cache-Control "no-store" always;
    add_header X-Content-Type-Options "nosniff" always;

    proxy_connect_timeout 5s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;
}
```

`track_query_redacted` 仍将来源 IP、状态和耗时写入现有 Docker 通用日志，供限流和性能
排障，但不记录查询参数、Referer 或 User-Agent。第一阶段的汇总接口被明确视为公开数据，
不以 CORS 作为访问控制边界；现有 Express CORS 响应头可以保留。

### `/track` 写入

在 `http` 上下文定义 `track_json` 日志格式，在主站 HTTPS `server` 中保留
`location = /track`：

- 使用独立 `access_log /var/log/nginx/track/events.jsonl track_json`。
- 继续返回 `204`，不代理到 Backend。
- 返回 `Cache-Control: no-store`，避免 GET 埋点被浏览器或中间层复用缓存结果。
- 该 location 重新定义 `access_log` 后，不继承全局 `main` access log，避免
  `/track` 同时进入 Docker 通用日志。
- 不把日志写入 `/usr/share/nginx/html`、Backend 目录或容器可写层。
- HTTP 入口继续统一重定向到 HTTPS，不在明文 HTTP 上接收正式前端埋点。

### 公开查询入口

新增公开的前缀 location：

```text
/api/track/
```

选择专用前缀是为了给日志聚合查询单独设置限流、超时和脱敏访问日志。Backend 仍使用
大小写敏感、严格 Router，只允许明确声明的路由，避免路径变体绕过专用入口后触发扫描。

该 location：

- 无需账号、密码、Cookie、Token 或其他认证信息。
- 直接代理到 `backend:3001`，保持原 URI。
- 不需要 WebSocket Upgrade 头。
- 设置 `Cache-Control: no-store`。
- 使用单独的轻量 IP 限流，目标为每 IP 每分钟 10 次、允许 10 次突发，防止公开接口被
  持续触发昂贵扫描。
- 超出限流时由 Nginx 返回 `429`，请求不进入 Backend。

现有通用 `/api/` location 保持不变。公开查询不设置 Basic Auth，也不创建或挂载
`.htpasswd` 文件。

## 第二阶段：统一管理系统（暂不实现）

第二阶段计划建设独立的管理前端和 Backend 登录/Session 能力，并逐步承载全部项目的
管理与数据查看功能。该阶段与本 Spec 的 JSONL 持久化和公开汇总接口解耦，本次不实现。

已明确的职责边界：

- Frontend 提供独立管理页面、登录表单和数据展示，不把 HTML 放入 Backend API 路由。
- Backend 提供账号密码校验、Session 生命周期和受保护管理 API，始终只返回 API 数据。
- Nginx 只承担 HTTPS、静态站点、反向代理和必要的流量保护，不使用 Basic Auth 代替
  应用登录。
- 账号密码哈希、Session 密钥及其他秘密只存在于服务器私有资产，不进入公开仓库。

第二阶段开始前必须另写并确认独立 Spec，至少明确账号模型、密码哈希、Session 存储、
Cookie 属性、CSRF/CORS、登录限流、过期与撤销、管理路由、审计边界、部署和回滚。第一阶段
不新增这些依赖、端点、数据目录或占位实现，也不以临时 Basic Auth 作为过渡方案。

第二阶段是否继续保留第一阶段的公开汇总接口，或改由受 Session 保护的管理 API 取代，
届时单独决策；本 Spec 不提前改变第一阶段的公开契约。

## Compose 设计

生产 Compose 仍由 `/opt/zhangrh-shop/compose.yml` 管理，不纳入公开仓库。

`nginx` 服务新增：

- `/opt/zhangrh-shop/data/track:/var/log/nginx/track` 读写挂载。

`backend` 服务新增：

- `/opt/zhangrh-shop/data/track:/var/log/nginx/track:ro` 只读挂载。
- 非敏感环境变量 `TRACK_LOG_DIR=/var/log/nginx/track`。

保持：

- Nginx 配置、证书、HTML 三个现有只读挂载。
- Backend 端口只存在于 Docker 网络，不映射宿主机或公网。
- Nginx `json-file` 的 `max-size=50m`、`max-file=3`。
- `restart: unless-stopped`。

禁止：

- 再次挂载整个 `/var/log/nginx`。
- 为查询接口单独把 Backend 3001 暴露到宿主机。

以下是需要合并的 Compose 结构，不是可替换现有文件的完整 Compose：

```yaml
services:
  nginx:
    volumes:
      - ./data/track:/var/log/nginx/track
    logging:
      driver: json-file
      options:
        max-size: "50m"
        max-file: "3"

  backend:
    environment:
      TRACK_LOG_DIR: /var/log/nginx/track
    volumes:
      - ./data/track:/var/log/nginx/track:ro
```

如果现有 `volumes`、`environment` 或 `logging` 已有其他条目，必须保留后合并，不能用
上面的节选整体替换。最终以 `docker compose config` 展开的绝对路径、只读标志和 config
hash 为准。

## Backend 工程设计

### 文件边界

新增生产源码：

```text
backend/projects/track.js
backend/projects/track-query.js
```

职责：

- `track-query.js`
  - 发现当前与轮转日志文件。
  - 流式读取普通 JSONL 和 gzip JSONL。
  - 解析、验证、去重、日期过滤和聚合。
  - 不依赖 Express，便于纯单元测试。
- `track.js`
  - 定义查询前缀和 HTTP 路由。
  - 验证 query 参数。
  - 调用 `track-query.js`。
  - 映射成功响应与错误状态，不暴露文件路径或原始异常。

模块接口固定为：

```js
// backend/projects/track-query.js
export async function summarizeTrackEvents(options) {}
export class TrackLogUnavailableError extends Error {}
export class TrackLogTooLargeError extends Error {}
export class TrackQueryTimeoutError extends Error {}

// backend/projects/track.js
export function registerTrack(app, options) {}
```

`summarizeTrackEvents` 的 `options` 包含 `logDir`、`days`、可空的 `project`、固定到查询
开始时刻的 `now` 以及仅供测试覆盖的 `limits`。`registerTrack` 接收 `logDir`，并允许测试
注入 `summarize` 与 `now`；生产调用使用默认实现。这样路由测试可启动一个临时 Express
监听端口并使用 Node 内置 `fetch`，无需引入 Supertest。

`registerTrack` 必须创建 `express.Router({ caseSensitive: true, strict: true })`，在该
Router 上注册完整的小写路径，再把 Router 挂到 app 根路径。原因是 Express 默认路由
大小写不敏感，而 Nginx 前缀匹配区分大小写；若直接使用默认 `app.get`，大小写变体可能
落入通用 `/api/` 后绕过 Track 专用限流并仍被 Backend 命中。正确实现下只有精确小写
`/api/track/summary` 返回数据，大小写、尾斜杠或其他路径变体均不匹配 Backend。

并发计数器归 `registerTrack` 创建的路由实例所有，在调用聚合器前加一，并在
`try/finally` 中无条件减一；参数校验失败不占用查询名额，聚合抛错也不能泄漏名额。

修改：

```text
backend/server.js
```

`server.js` 在 Cardgame 注册之外注册 Track 查询模块，并从
`TRACK_LOG_DIR` 读取目录；环境变量缺失时使用
`/var/log/nginx/track` 默认值。

测试放在现有非生产目录：

```text
backend/tools/track-query.test.mjs
backend/tools/track-route.test.mjs
```

现有 `backend/package.json` 已执行 `node --test tools/*.test.mjs`，因此不需要修改测试
入口。现有 Dockerfile 已复制整个 `projects` 目录，发布脚本也已包含
`projects/***`，因此新生产文件会自动进入镜像和 rsync 白名单，测试文件不会进入生产
发布内容。

### 依赖策略

第一版只使用 Node 24 标准库：

- `node:fs`
- `node:path`
- `node:stream`
- `node:timers/promises`
- `node:zlib`

路由继续使用现有 Express。不新增 npm 依赖，不修改 lockfile，不引入同步整文件读取。

### 日志文件发现

只在配置的 `TRACK_LOG_DIR` 中读取以下受控名称：

```text
events.jsonl
events.jsonl-YYYYMMDD
events.jsonl-YYYYMMDD.gz
```

规则：

- 不接受来自 HTTP 参数的目录、文件名或 glob。
- 日期文件名必须严格匹配 `events.jsonl-`、8 位有效日历日期和可选 `.gz`；忽略符号
  链接和其他名称。
- 未压缩日期文件是 logrotate 重命名到 gzip 完成之间的合法瞬时状态。若同一日期的
  未压缩文件和 `.gz` 同时存在，快照只选未压缩文件；下一次查询在源文件消失后再选择
  已完成的 `.gz`，避免重复和读取半成品压缩文件。
- 查询开始时对所有候选普通文件执行 `lstat → open → fstat`，确认它们是普通文件且
  `device/inode` 未在打开窗口内变化；符号链接不跟随。
- 打开全部候选文件后记录各自的字节大小，查询只读取该大小范围内的内容。即使
  logrotate 随后重命名当前文件，已打开的文件描述符仍指向同一 inode；查询也不会把
  开始时刻以后追加的新事件混入本次结果。
- `lstat/open/fstat` 期间若文件消失或 inode 改变，关闭全部已打开描述符并完整重试
  一次；第二次仍竞争则返回可重试的 `503`，不静默返回不完整结果。
- 成功固定快照后按轮转日期从旧到新读取，当前文件最后读取；无论成功或失败均在
  `finally` 中关闭全部描述符。
- 当前快照最后一行若没有换行且 JSON 不完整，视为正在写入，忽略并计入
  `partial_lines`，不将整个请求判为失败。
- gzip 文件使用流式解压，不落临时文件。

### 资源边界

- API 最长查询 90 天。
- 单个 Backend 进程最多同时执行 1 个 Track 聚合查询。已有查询运行时，新请求立即返回
  `503 track_query_busy` 和 `Retry-After: 2`，不排队占用额外内存。
- 单次查询的内部截止时间为 20 秒；超时后销毁打开的读取/解压流、关闭文件描述符并返回
  `503 track_query_timeout`。该截止时间短于 Nginx 的 30 秒代理超时。
- 单次查询最多处理 64 MiB 解压后的埋点数据；超过时返回 `503` 和稳定错误码，提示
  当前 JSONL 方案已超出设计规模。
- 单条 JSONL 最大 32 KiB。实现使用自有的有界分行器逐 chunk 查找换行，不能让
  `readline` 或字符串拼接在遇到损坏文件时无界缓存单行。
- 最多保存 100,000 个唯一设备和每类 10,000 个聚合维度 key；超过任一上限按
  `track_log_too_large` 失败，不能返回被截断的统计。
- 按行流式读取，不能使用 `readFile` 把所有日志一次载入内存。
- 每处理 500 行使用一次 `setImmediate` 主动让出事件循环，使 Cardgame HTTP 与
  WebSocket 在较大扫描期间仍有调度机会。
- 聚合阶段只保存计数器、日期桶和设备 ID Set，不保留全部原始事件数组。
- 第一版不做跨请求缓存。当前约数百条/90 天的数据量不需要缓存，避免文件轮转后的
  失效复杂度。
- Nginx 公开查询入口限流后，并发扫描量可控；查询错误不能终止 Backend 进程。

### 时间语义

- 统计时区固定为 `Asia/Shanghai`。
- `days=N` 表示包含今天在内的 N 个自然日：从北京时间第 `N-1` 天的 00:00:00
  到请求执行时刻。
- `now` 在查询入口只捕获一次；`range.to` 使用该时刻，`generated_at` 使用聚合完成
  时刻，两者允许相差本次扫描耗时。
- 筛选和每日桶使用 `received_at`，不使用可被客户端修改的 `client_time`。
- `days=90` 最多返回 90 个每日桶；没有事件的日期也返回 `events=0`、`devices=0`，
  便于直接绘图或比较。

### 聚合规则

- 总事件数：范围内全部有效事件数。
- 总设备数：范围内跨项目去重后的有效 `device_id` 数量。
- 项目：按 `project` 统计事件数与项目内设备数。
- 事件：按 `project + event` 统计事件数与设备数。
- 页面：`params.page_name` 为非空字符串时，按 `project + page_name` 统计。
- 按钮：`params.button` 为非空字符串时，按 `project + button` 统计。
- 每日：按北京时间日期统计事件数与当天设备数。
- 未知事件、页面或按钮值保留在聚合中；只有未知项目被拒绝。
- 汇总数组稳定排序，保证相同数据产生相同 JSON 顺序：项目、事件、页面和按钮按字符串
  升序，每日按日期升序。

所有 `devices` 都表示去重后的浏览器设备标识数量，不等于注册用户数或自然人数；清理
存储、无痕窗口、不同浏览器或不同设备会产生新的标识，同一设备也可能被多人使用。

## HTTP API 契约

### 路由

```http
GET /api/track/summary
```

该路由在第一阶段是无需鉴权的公开只读接口。Nginx 和 Backend 都不要求账号、密码、
Cookie、Token 或 Session；任何访问者都可以读取下述聚合结果，但不能通过该接口读取
原始日志或设备标识。

### Query 参数

| 参数 | 是否必填 | 默认值 | 允许值 | 说明 |
| --- | --- | --- | --- | --- |
| `days` | 否 | `30` | 整数 `1`～`90` | 自然日数量 |
| `project` | 否 | 无 | `hub`、`cardgame` | 省略表示两个项目 |

`project` 过滤在校验、去重和时间过滤之后应用，并同时影响 totals、所有 breakdown 与
daily；diagnostics 通过 `project_filtered_records` 报告被该过滤器排除的有效记录。

拒绝：

- 重复 query 参数。
- 空字符串。
- 小数、指数、带符号或前后空白的 `days`。
- `all`、未知项目或任意额外 query 参数。

严格拒绝未知参数可以及时发现调用方拼写错误，避免产生“看似成功但过滤未生效”的结果。

### 成功响应

状态码：`200`

响应头：

```text
Content-Type: application/json; charset=utf-8
Cache-Control: no-store
```

Backend 路由在任何参数校验和日志读取之前设置 `Cache-Control`，因此它自己的 `200`、
`400`、`500`、`503` 都禁止缓存；公网侧 Nginx 隐藏上游同名头并统一重加一个，避免
重复响应头。

响应示例：

```json
{
  "generated_at": "2026-08-15T12:30:00.000Z",
  "range": {
    "days": 30,
    "from": "2026-07-17T00:00:00+08:00",
    "to": "2026-08-15T20:30:00+08:00",
    "timezone": "Asia/Shanghai"
  },
  "filter": {
    "project": null
  },
  "totals": {
    "events": 120,
    "devices": 16,
    "earliest_received_at": "2026-07-18T01:12:00.000Z",
    "latest_received_at": "2026-08-15T12:12:00.000Z"
  },
  "projects": [
    {
      "project": "cardgame",
      "events": 12,
      "devices": 2
    },
    {
      "project": "hub",
      "events": 108,
      "devices": 15
    }
  ],
  "event_breakdown": [
    {
      "project": "cardgame",
      "event": "click",
      "events": 12,
      "devices": 2
    },
    {
      "project": "hub",
      "event": "load_page",
      "events": 90,
      "devices": 15
    }
  ],
  "page_breakdown": [
    {
      "project": "hub",
      "page_name": "home",
      "events": 58,
      "devices": 14
    }
  ],
  "button_breakdown": [
    {
      "project": "cardgame",
      "button": "create_room",
      "events": 7,
      "devices": 2
    }
  ],
  "daily": [
    {
      "date": "2026-07-17",
      "events": 0,
      "devices": 0
    },
    {
      "date": "2026-08-15",
      "events": 8,
      "devices": 3
    }
  ],
  "diagnostics": {
    "files_read": 5,
    "compressed_files_read": 4,
    "lines_read": 123,
    "included_records": 120,
    "empty_lines": 0,
    "invalid_json_lines": 0,
    "rejected_records": 1,
    "duplicate_records": 1,
    "out_of_range_records": 0,
    "project_filtered_records": 0,
    "ignored_dimensions": 0,
    "partial_lines": 1
  }
}
```

说明：

- `totals.devices` 不能通过各项目设备数相加得到，因为同一设备可能访问两个项目。
- `earliest_received_at` 与 `latest_received_at` 统一输出 UTC ISO 字符串；无事件时二者
  都是 `null`。
- `diagnostics` 只包含计数，不包含原始行、设备 ID、文件路径或错误内容。
- `included_records` 必须等于 `totals.events`。其余诊断项描述扫描过程中被排除或忽略的
  输入；`project_filtered_records` 只在传入 `project` 时可能非零。
- `ignored_dimensions` 按被忽略的 `page_name` 或 `button` 字段数计数，因此一条事件最多
  可增加 2；其他诊断分类按日志行计数。
- 上述 JSON 为结构示例，breakdown 与 daily 数组仅节选了成员；真实 30 天响应必须返回
  全部 breakdown 和连续 30 个 daily 桶。
- 没有有效事件时仍返回 `200`、空 breakdown 和完整的零值 daily 数组。

### 浏览器查看与 JSON 导出

浏览器可以直接打开以下 HTTPS 地址查看 JSON，无需登录：

```text
https://zhangrh.shop/api/track/summary?days=30
```

命令行可以直接导出：

```sh
curl --fail-with-body --show-error \
  'https://zhangrh.shop/api/track/summary?days=90' \
  --output track-summary.json
```

增加 `&project=hub` 或 `&project=cardgame` 可导出单项目汇总。第一版导出的内容就是接口
JSON，不提供绕过聚合的原始 JSONL 下载。

### 错误响应

Backend 产生的错误使用统一结构：

```json
{
  "error": {
    "code": "invalid_days",
    "message": "days must be an integer between 1 and 90"
  }
}
```

状态码与错误码：

| 状态 | code | 场景 |
| --- | --- | --- |
| `400` | `invalid_days` | `days` 格式错误或越界 |
| `400` | `invalid_project` | 项目不是 `hub` 或 `cardgame` |
| `400` | `duplicate_query_parameter` | 任一 query 参数重复出现 |
| `400` | `unknown_query_parameter` | 出现未定义参数 |
| `429` | 由 Nginx 产生 | 公开查询接口超过限流 |
| `503` | `track_log_unavailable` | 目录缺失、权限错误、持续轮转竞争或读取失败 |
| `503` | `track_log_too_large` | 解压总量、单行长度或聚合基数超过设计上限 |
| `503` | `track_query_busy` | 当前 Backend 已有一个聚合查询运行 |
| `503` | `track_query_timeout` | 聚合超过 20 秒内部截止时间 |
| `500` | `internal_error` | 未预期错误 |

`429` 在 Backend 之前由 Nginx 产生，可以使用 Nginx 默认错误体，不承诺上述 JSON
结构；调用方必须以 HTTP 状态码为准。所有查询路径响应仍带 `Cache-Control: no-store`。

Backend 对服务器日志只记录稳定错误码和必要异常类型，不记录原始 JSONL 行、参数、设备
标识或请求头信息。

## 日志轮转与三个月保留

宿主机新增专用 `logrotate` 规则，目标文件：

```text
/opt/zhangrh-shop/data/track/events.jsonl
```

策略：

- `weekly`
- `rotate 14`
- `maxage 98`
- `maxsize 50M`
- `dateext`
- `compress`
- `missingok`
- 以 `0640 root:root` 创建新文件
- 轮转后向 `zhangrh-nginx` 发送 `USR1`，要求 Nginx 安全关闭旧日志描述符并重新打开
  当前文件

不用 `copytruncate`，避免复制和截断窗口内丢失事件。Backend 同时支持当前 JSONL、
轮转过程中的未压缩日期文件和已经完成的 gzip 文件。

规范性规则如下：

```logrotate
/opt/zhangrh-shop/data/track/events.jsonl {
    su root root
    weekly
    rotate 14
    maxage 98
    maxsize 50M
    missingok
    notifempty
    dateext
    dateformat -%Y%m%d
    compress
    create 0640 root root
    sharedscripts
    postrotate
        /usr/bin/docker kill --signal=USR1 zhangrh-nginx >/dev/null
    endscript
}
```

安装前必须确认 Docker 客户端的绝对路径确实为 `/usr/bin/docker`；如服务器结果不同，
规则使用服务器实际绝对路径。`maxsize 50M` 是磁盘安全阀：正常低流量下按周保留约 98
天；若发生异常灌流而频繁触发按大小轮转，安全阀优先，实际可查询天数可能缩短，必须从
监控和轮转文件数量中发现，而不能宣称仍严格保留三个月。

保留语义是“运维目标约 98 天”，不是审计合规型强制删除 SLA。如果未来需要严格在
第 99 天删除、跨机器备份或一年趋势，应另行设计归档任务。

## 安全与隐私边界

- `/track` 仍是无需认证的公网采集入口，`time`、`project`、`device_id`、`event` 和
  `params` 都可被访问者伪造。聚合结果仅用于低风险产品观察，不能视为可信业务账本。
- 查询接口是无需鉴权的公网只读路径，任何访问者都可以读取聚合结果；这是第一阶段明确
  接受的公开边界，不得在文档、客户端或运维说明中把结果描述为私密管理数据。
- 查询仍只通过 HTTPS 对外，不提供明文 HTTP 数据接口。
- Backend 不返回原始 `device_id`、`params` 或逐条事件。
- 独立埋点日志不保存 IP、User-Agent、Referer、Cookie 或认证头。
- `device_id` 仍属于可关联的持久标识，数据目录不得全局可读。
- 查询响应设置 `no-store`，不应被浏览器、代理或 CDN 缓存。
- Backend 数据挂载只读；任何写入、删除或轮转均不属于 Backend 权限。
- API 不接受路径或文件名参数，防止目录穿越。
- 错误响应不返回宿主机路径、堆栈或原始日志内容。
- 第一阶段不加入管理前端、登录接口、Cookie 或 Session。
- 生产 Compose 和真实运行配置继续保留在服务器私有资产范围。

## 错误隔离

- `TRACK_LOG_DIR` 不存在或不可读时，只有 Track 查询返回 `503`；Backend 仍能启动，
  Cardgame health、HTTP API 和 WebSocket 保持可用。
- 单行损坏不会使整个查询失败；接口跳过并报告计数。
- 整体目录读取失败、解压失败、持续轮转竞争或超过资源上限时，不返回可能误导的部分
  聚合，统一返回 `503`。
- Nginx 无法写埋点日志时，不改变 `/track` 的 `204` 客户端响应；该故障通过 Nginx
  error log 和部署验证发现。埋点不可用不能阻断产品页面。
- 公开查询被恶意或意外高频调用时，Nginx 限流与 Backend 单查询并发闸门应优先拒绝
  新请求，不能拖垮 Cardgame API 或 WebSocket。

## 仓库文件变更范围

### 新增

```text
backend/projects/track.js
backend/projects/track-query.js
backend/tools/track-query.test.mjs
backend/tools/track-route.test.mjs
docs/superpowers/specs/2026-08-15-track-jsonl-query-api-design.md
```

### 修改

```text
backend/server.js
frontend/docs/track.md
docs/deploy/README.md
RUNBOOK.md
```

### 无需修改

```text
frontend/common/track.ts
frontend/common/device_id.ts
backend/Dockerfile
backend/package.json
backend/package-lock.json
backend/tools/publish-lib.mjs
```

原因：生产源码位于既有 `projects` 目录，当前 Dockerfile、发布白名单和测试 glob 已覆盖
本设计文件布局，且实现只依赖 Node 标准库与现有 Express。

### 服务器私有变更，不提交公开仓库

```text
/opt/zhangrh-shop/compose.yml
/opt/zhangrh-shop/nginx/conf.d/zhangrh.shop.conf
/opt/zhangrh-shop/data/track/
/etc/logrotate.d/zhangrh-track
```

私有基础设施文档需要在部署完成后更新当前挂载、日志格式、轮转和公开查询边界，但不得
记录 IP 或真实设备数据。

## 发布与实施顺序

按以下顺序实施第一阶段：

1. 在仓库实现解析器、聚合器、路由和测试。
2. 更新公开文档并完成本地全量验证。
3. 在服务器创建持久目录和空的 `events.jsonl`，设置并检查 owner、group 和 mode。
4. 更新生产 Compose，为 Nginx 增加埋点读写挂载，为 Backend 增加只读埋点挂载与
   `TRACK_LOG_DIR`；此时先不重建 Backend。
5. 更新 Nginx：增加 JSONL 格式、`/track` 独立日志、公开查询前缀和限流。
6. 使用包含新挂载的 Compose 定义执行一次性 Nginx 配置测试；成功后先只重建 Nginx。
   在 Backend 新路由尚未部署时，公开查询暂时返回 `404` 是预期状态。
7. 部署并重建 Backend，确认公开查询、Cardgame health 和既有功能正常。
8. 验证公共页面、GlitchTip、Cardgame API、WebSocket、`/track` 和公开查询接口。
9. 安装并 dry-run 专用 logrotate 规则；确认目标、权限和 postrotate 信号准确后再启用。
10. 更新私有基础设施台账，记录日期、配置 hash、验证结果和回滚点。

部署不是原子操作，但第一阶段本来就将查询接口定义为公开接口，不存在先后顺序造成的
鉴权空窗。仍先部署 Nginx 专用 location，再发布 Backend，以确保新接口从首次可用起就受
独立限流、超时和脱敏访问日志约束。

## 验证设计

### Backend 自动化测试

`track-query.test.mjs` 覆盖：

- 有效 JSONL、URL 编码 params 和多项目聚合。
- 当前文件、轮转过程中的未压缩日期文件与 gzip 文件联合读取；同日期双文件不重复。
- 1、30、90 天边界及 Asia/Shanghai 跨日边界。
- 使用 `received_at` 而不是伪造 `client_time`。
- 项目过滤。
- 跨项目总设备去重和各维度设备去重。
- 历史未知 event/page/button 值仍参与聚合。
- `audit`、`diagnostic`、未知项目、无效设备 ID、未知 schema 被拒绝。
- JSON 损坏、params 损坏、空行和未完成最后一行。
- 重复 `request_id` 去重。
- inode/大小固定快照、轮转竞争重试以及查询期间追加数据不混入本次结果。
- 32 KiB 单行、16 KiB params、唯一设备与维度基数上限。
- 稳定排序和零事件日期补齐。
- 目录缺失、权限/读取错误、gzip 错误、轮转竞争重试和 64 MiB 上限。
- 单查询并发闸门、`Retry-After`、20 秒截止时间、流清理和事件循环主动让出。

`track-route.test.mjs` 覆盖：

- 默认 `days=30`。
- 合法 `days=1/90` 与 `project=hub/cardgame`。
- 重复、未知、空或越界参数返回 `400` 和对应稳定错误码。
- 大小写和尾斜杠变体不命中大小写敏感、严格 Router。
- 空数据返回 `200` 和零值结构。
- 数据源不可用返回 `503`，但测试进程与其他路由继续工作。
- 成功响应包含 `Cache-Control: no-store`。
- 响应中不出现原始 `device_id`、`params_encoded` 或文件路径。

现有验证继续执行：

```text
npm --prefix backend test
npm test
npm run check
```

### Nginx 与 Compose 验证

由用户在服务器执行并核对：

- Compose 能解析，运行容器 config hash 与当前 Compose hash 一致。
- Nginx 配置测试成功。
- Nginx 只有预期挂载；埋点目录对 Nginx 可写、对 Backend 只读。
- `/track` 返回 `204`，并只新增一条 `events.jsonl`。
- 新 `/track` 不再出现在 `docker logs zhangrh-nginx` 的通用 access log 中。
- JSONL 单行可由标准 JSON 解析，字段、编码和权限符合设计。
- 不提供任何凭据访问 `/api/track/summary?days=30` 返回 `200`，且不出现
  `WWW-Authenticate`。
- Backend 响应不包含设备 ID、原始 params 或文件路径。
- `days=91`、未知项目和未知参数返回 `400`。
- 超过公开查询限流时返回 `429`，请求不进入 Backend。
- Hub、Cardgame、GlitchTip 公网入口继续返回成功。
- Cardgame health 与 WebSocket 建连继续正常。
- Docker 通用日志仍为 `50 MB × 3`。
- `logrotate` dry-run 不报错，轮转测试后 Nginx 继续向新文件写入。

### 安全与公开边界验证

- 搜索公开仓库，确认没有真实访问日志、设备标识样本或生产私有配置。
- 检查公开查询的通用日志不包含 query 参数。
- 不提供任何凭据测试大小写、尾斜杠、重复斜杠、点路径和百分号编码变体，确认只有规范
  路径能命中 Backend Track 路由，路径变体不能绕过专用限流触发扫描。
- 检查 HTTP 请求只重定向到 HTTPS。
- 检查数据目录权限没有全局可读。
- 检查查询响应 `Cache-Control` 为 `no-store`。
- 检查查询响应不包含原始 `device_id`、`params`、IP、User-Agent、Referer、Cookie、
  请求头或文件路径。

## 回滚设计

### Backend 回滚

- 回滚 `server.js` 的 Track 注册及 Track 项目文件，重新构建 Backend。
- 回滚后公开查询返回 `404` 或稳定的不可用响应，不影响其他 Backend 路由。

### Nginx 回滚

- 恢复部署前已验证的主站配置和 Compose 备份。
- 恢复后重新执行 Compose hash、Nginx 配置、三个公网入口和 Cardgame health 验证。

### 数据处理

- 回滚应用或 Nginx 不自动删除 `/opt/zhangrh-shop/data/track`。
- 是否删除新产生的 JSONL 属于单独的破坏性操作，必须再次确认。

## 官方实现依据

- [Nginx Log Module](https://nginx.org/en/docs/http/ngx_http_log_module.html)：
  `log_format escape=json`、location 级 `access_log` 以及 `$time_iso8601`。
- [Nginx Limit Request Module](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html)：
  共享限流区、burst、nodelay 和自定义拒绝状态码。
- [Nginx Proxy Module](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)：
  上游代理、超时和响应头隐藏。
- [logrotate upstream manual](https://github.com/logrotate/logrotate/blob/main/logrotate.8.in)：
  weekly、rotate、maxage、maxsize、create、dateext、compress 与 postrotate 语义；
  postrotate 在旧文件压缩前执行。

## 完成标准

- Hub 与 Cardgame 的现有 `/track` 请求继续返回 `204`。
- 每个合法请求在独立 JSONL 中产生一条 schema v1 记录。
- `/track` 不再污染通用 Docker access log。
- JSONL 跨 Nginx 与 Backend 容器重建保留，并按约 98 天轮转。
- Backend 只能读取，不能写入埋点目录。
- `GET /api/track/summary` 支持 1～90 天和可选项目过滤，无需鉴权即可从公网访问。
- 响应包含总量、设备数、项目、事件、页面、按钮和每日聚合。
- 响应不包含原始设备 ID、params、IP、User-Agent、Referer、认证信息或文件路径。
- 埋点目录不可用时只有 Track 查询返回 `503`，Cardgame 与其他入口不受影响。
- 第一阶段没有 Basic Auth、登录接口、Session、管理页面或相关占位实现；第二阶段仅在
  Spec 中保留独立建设方向。
- 自动化测试、根检查和所有线上验证通过。
- 公开仓库不包含任何生产凭据或私有基础设施资产。
