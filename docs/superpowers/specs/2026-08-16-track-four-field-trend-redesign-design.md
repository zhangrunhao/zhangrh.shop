# 四字段埋点与单事件趋势重构设计

日期：2026-08-16

状态：本地实现完成并通过验证，待生产服务器切换与线上验证

涉及范围：`zhangrh.shop`、`ShotMarker`、生产服务器上的 Nginx、Docker Compose 与旧埋点数据

实现状态更新（2026-08-16）：两个本地仓库的客户端、Backend、Analytics、测试和公开文档已按本设计完成；ShotMarker Release 构建与隐私清单也已验证。第 12 节的生产停服、不可恢复删数、Nginx/Compose 切换和线上验证尚未执行，`docs/private.local` 生产台账因此保持不变。下方复选框保留原始执行清单用途，不代表生产步骤已经完成。

## 1. 结果概述

现有埋点链路整体替换为一套四字段模型：Hub、Cardgame 和 ShotMarker 客户端只上报
`project`、`event`、`device_id`；Nginx 生成服务器 `time` 并直接追加到单一
`events.jsonl`。Backend 不参与写入，只在查询时读取、校验、过滤并计算某一个必选事件在
查询范围内每个上海自然日的 PV/UV；无记录日期返回零值。Analytics 手工维护三个项目可
展示的事件及默认事件。

旧 JSONL、轮转文件和 gzip 在生产服务器停服后永久删除，不迁移、不备份数据内容，也不
保留旧 schema、旧查询响应或旧报表页面的兼容分支。

## 2. 已确认决策

1. 报表项目固定为 `hub`、`cardgame`、`shotmarker`；Backend 不是埋点项目。
2. 客户端只发送 `project`、`event`、`device_id` 三个查询参数。
3. `time` 由 Nginx 在接收请求时生成，客户端时间不再发送和保存。
4. 取消 `params`、`context`、`context_kind`、`context_name`、`schema_version` 和
   `request_id`。
5. 所有业务语义放进 `event`，使用稳定的小写 snake_case 名称。
6. Nginx 收到 `/track` 请求就落盘并返回 `204`，不负责数据有效性校验。
7. Backend 读取 JSONL 时才校验记录；无效行留在原文件中但不参与报表。
8. 报表每次必须选择一个具体事件，不提供“全部事件”，也不发送或保存 `all` 值。
9. Analytics 全局切换 PV/UV；Backend 一次返回所选事件的两套逐日数据。
10. API 不返回 totals、事件 breakdown、事件目录、timezone 或公开 diagnostics。
11. Analytics 手工维护三个项目的事件目录和每个项目的默认事件。
12. 首次打开 Analytics 默认 `Hub + 30 天 + home_page_load + PV`。
13. 只把项目和时间范围保存在浏览器本地；事件与 PV/UV 口径不持久化。
14. 存储继续使用单一 `events.jsonl`，不引入数据库或新的自动轮转策略。
15. 服务器操作直接停止整个 `zhangrh-shop` Compose 项目，不设计局部维护窗口。
16. 旧埋点数据永久删除且不可恢复；发生问题时修复新链路，不恢复旧 schema。
17. `daily` 是按日期升序的连续数组，长度严格等于 `days`；无记录日期返回
    `{date, pv: 0, uv: 0}`。
18. 所选范围内完全没有该事件时仍返回完整日期数组，每一天的 PV/UV 都为 0；Analytics 将其
    显示为空趋势状态。
19. 当前只有项目所有者使用 Analytics；本版接受筛选请求遇到 `track_query_busy` 后手工重试，
    不实现查询排队、旧请求服务端取消、账号登录或 Session 校验；后续单独设计并增加 Auth
    登录策略。
20. `/track` 本版保持公网可写、Nginx 不鉴权且不校验业务参数；明确接受外部请求写入无效行、
    加速文件增长并提前触发容量上限的风险，先完成当前链路，后续单独增加 Nginx 鉴权策略。
21. 文件超过 Backend 读取上限后允许趋势服务保持不可读，由人工设计并上线下一套机制；本版
    不增加自动切换、自动扩容或额外容量防线。
22. 当前没有仍发送旧 Hub/Cardgame 事件名的客户端或需要保留的旧事件；不增加旧事件过渡、
    白名单兼容或迁移逻辑。
23. 这是个人新项目，当前没有实际访问量，本次以快速整体替换为优先，不为旧数据、旧协议、
    旧 API 或旧页面增加兼容和回滚分支。

## 3. 取代范围

本设计取代以下现有行为：

- schema v1 的 `request_id`、`received_at`、`client_time`、`params_encoded` 等字段。
- Backend 对当前文件、轮转文件和 gzip 的兼容读取。
- 按项目可选、事件可选的 `/api/track/summary` 汇总接口。
- `totals`、`projects`、`event_breakdown`、`page_breakdown`、`button_breakdown` 和公开
  `diagnostics`。
- Analytics 的总事件数、总设备数、事件类型表、页面表、按钮表和“全部事件”趋势。
- Hub 的按钮点击埋点和 404 页面埋点。
- 客户端上传时间和通用 `params` 对象。

以下能力保持不变：

- `/track` 仍是无业务依赖的 GET 请求，失败不影响产品主流程。
- 网页继续使用同一方随机 12 位 `device_id`；ShotMarker 继续使用安装随机 ID。
- ShotMarker 的四个业务事件语义、触发位置、Release-only 策略和无重试策略不变。
- 原始设备标识不通过报表 API 返回。
- 汇总数据仍是公开、可伪造的产品观察数据，不用于计费、风控或审计。

## 4. 总体架构

```text
Hub / Cardgame / ShotMarker
  │
  │ GET /track?project=...&event=...&device_id=...
  ▼
Nginx
  ├── 不校验查询参数
  ├── 生成服务器 time
  ├── 追加 /var/log/nginx/track/events.jsonl
  └── 返回 204
            │
            │ 宿主机持久目录 bind mount
            ▼
/opt/zhangrh-shop/data/track/events.jsonl
            │
            │ Backend 只读挂载
            ▼
GET /api/track/trend?project=...&event=...&days=...
            │
            ├── 读取时校验四字段
            ├── 按项目、事件、上海自然日过滤
            ├── 逐日计算 PV
            └── 逐日按 device_id 去重计算 UV
                         │
                         ▼
                 Analytics 单事件趋势图
```

职责边界：

- 客户端负责选择稳定的项目、事件并提供本地设备标识。
- Nginx 只负责接收、加服务器时间、落盘和返回 `204`。
- Backend 只负责只读解析和聚合，不写入、不修复、不删除原始记录。
- Analytics 负责事件目录、默认值、本地筛选状态和趋势展示。
- 服务器运维负责数据目录、Nginx 格式、停服切换和容量检查。

## 5. 上报协议与原始模型

### 5.1 客户端请求

规范请求：

```text
GET /track
  ?project=<hub|cardgame|shotmarker>
  &event=<event_name>
  &device_id=<12 位字母数字标识>
```

客户端不再发送 `time` 或 `params`。网页和 ShotMarker 都使用 URL 构造 API 编码查询参数，
不手工拼接用户可变值。

### 5.2 Nginx 写入

目标配置形状：

```nginx
log_format track_json escape=json
    '{"project":"$arg_project",'
    '"event":"$arg_event",'
    '"time":"$time_iso8601",'
    '"device_id":"$arg_device_id"}';

location = /track {
    access_log /var/log/nginx/track/events.jsonl track_json;
    add_header Cache-Control "no-store" always;
    return 204;
}
```

生产部署必须合并进现有私有 Nginx 配置，不能覆盖证书、站点、普通访问日志或 `/api/`
代理。`/track` 只写专用 JSONL，不把完整查询字符串复制到普通访问日志。

Nginx 不根据 method、项目、事件或设备标识决定是否落盘。缺失参数会形成空字符串，恶意
或格式错误的值也会被 JSON 转义后保存；这些记录由 Backend 读取时排除。

### 5.3 单行模型

```json
{"project":"hub","event":"home_page_load","time":"2026-08-16T12:00:00+08:00","device_id":"AbCd1234Ef56"}
```

每条可参与报表的记录必须严格包含四个字段：

| 字段 | 来源 | 规则 |
| --- | --- | --- |
| `project` | 客户端 | `hub`、`cardgame`、`shotmarker` 之一 |
| `event` | 客户端 | 匹配 `[a-z][a-z0-9_]{0,63}` |
| `time` | Nginx | 可解析的 ISO 8601 服务器时间 |
| `device_id` | 客户端 | 匹配 `[A-Za-z0-9]{12}` |

不包含 `request_id`，因此不做请求级去重。重复请求会增加 PV；同一天、同一项目、同一事件
下相同 `device_id` 只增加一次 UV。

### 5.4 文件与容量

- 宿主机文件：`/opt/zhangrh-shop/data/track/events.jsonl`。
- Nginx 保持读写挂载，Backend 保持只读挂载。
- 不读取 `events.jsonl-*` 或 gzip，不为旧文件保留解析器。
- 不增加自动删除或固定保留期。
- 当前文件达到 `32 MiB` 时重新评估存储。
- Backend 保持 `64 MiB` 最大解码量和 20 秒查询超时保护。
- 文件超过 `64 MiB` 后 `/api/track/trend` 返回 `503 track_log_too_large`；允许报表保持不可读，
  直到人工完成并上线新的存储或查询机制。
- 本版明确不以当前鉴权或容量保护抵御公网主动灌流；先完成四字段链路，Nginx 鉴权策略作为
  后续独立工作。
- 本版资源保护的验收范围只有流式读取、当前文件快照、未完成尾行、`64 MiB`、20 秒和单查询
  限制。现有实现中的单行长度、唯一设备数、符号链接或 inode 竞态检查可以自然复用，但不
  作为本次重构的必保能力，也不新增专项错误码或测试。

## 6. 事件目录

### 6.1 Hub

Hub 只观察五个核心页面访问，不记录按钮点击或 404：

| event | 触发语义 |
| --- | --- |
| `home_page_load` | Hub 首页路由被展示；默认事件 |
| `products_page_load` | 作品列表页被展示 |
| `articles_page_load` | 文章列表页被展示 |
| `article_detail_page_load` | 有效文章详情内容成功加载并展示 |
| `about_page_load` | 关于页被展示 |

删除原来的 `load_page + page_name` 组合、全部 `click + button` 组合和 `not_found` 统计。路径
即使匹配六位文章 ID，只要找不到对应文章内容，仍按 404 处理且不发送详情事件。

### 6.2 Cardgame

| event | 触发语义 |
| --- | --- |
| `cardgame_page_load` | Cardgame 应用首次加载；默认事件 |
| `create_room_click` | 用户触发创建房间 |
| `join_room_click` | 用户触发加入房间 |
| `ai_battle_click` | 用户触发人机对战 |
| `play_cards_click` | 用户提交出牌 |
| `round_confirm_click` | 用户确认当前回合结果 |
| `play_again_click` | 用户触发再来一局 |

点击事件表示用户触发动作，不承诺后续 WebSocket 或业务操作成功。`cardgame_page_load` 每次
前端应用装载只发送一次，不随内部路由或状态变化重复发送。

### 6.3 ShotMarker

| event | 触发语义 |
| --- | --- |
| `app_launch` | Release iPhone App 进程启动；默认事件 |
| `training_sync_succeeded` | Watch 训练成功导入 iPhone |
| `highlight_generate_succeeded` | 集锦最终生成成功 |
| `highlight_save_succeeded` | 集锦成功保存到系统相册 |

事件枚举和业务触发点不变，只简化请求参数。

当前没有仍发送 `load_page`、`click` 等旧 Hub/Cardgame 事件名的客户端，也不保留旧事件数据；
本设计不增加旧事件名的过渡处理。

已经安装的旧版 ShotMarker 会暂时继续发送额外的客户端 `time` 和 `params={}`，但最终
Nginx `log_format` 只读取 `project`、`event`、`device_id` 并自行生成 `time`，因此这些
额外查询参数不会进入新 JSONL。Backend 仍只面对严格四字段新记录，不需要旧 schema
解析分支。ShotMarker 源码仍按本设计删除额外参数，使后续版本与规范完全一致。

## 7. 趋势查询 API

### 7.1 请求

```text
GET /api/track/trend?project=hub&event=home_page_load&days=7
```

三个参数全部必填：

- `project`：只允许三个固定项目。
- `event`：只校验格式，不在 Backend 维护白名单。
- `days`：只允许 `1`、`7`、`30`、`90`。
- 参数不得重复，不接受未知参数。
- 路径大小写和尾斜杠继续严格匹配。

### 7.2 计算

Backend 以当前服务器时刻为查询终点，按 `Asia/Shanghai` 自然日计算查询起止边界，先生成
长度等于 `days` 的连续日期列表，再对 `events.jsonl` 建立只读快照并流式读取：

1. 空行、非法 JSON、非对象和非严格四字段记录直接忽略。
2. 校验 `project`、`event`、`time`、`device_id`。
3. 按服务器 `time` 排除范围外记录。
4. 精确匹配查询的项目和事件。
5. 每个自然日预置 `pv=0`、`uv=0`；有效记录使当日 PV 增加。
6. 每个自然日按 `device_id` 去重计算 UV。
7. 当前文件末尾未完成的行本次忽略，下次查询重新读取。
8. 没有记录的日期保留零值。
9. `daily` 按日期严格升序输出，日期连续且不重复，长度严格等于请求的 `days`；整个范围没有
   所选事件时返回全部日期的零值项。

UV 是逐日去重值；不同日期的同一设备会分别计入各日 UV。本方案不提供整个范围的总 UV，
也不计算跨日 cohort、留存或漏斗。

### 7.3 响应

成功响应严格只有 `daily`：

```json
{
  "daily": [
    { "date": "2026-08-10", "pv": 4, "uv": 3 },
    { "date": "2026-08-11", "pv": 0, "uv": 0 },
    { "date": "2026-08-12", "pv": 1, "uv": 1 },
    { "date": "2026-08-13", "pv": 0, "uv": 0 },
    { "date": "2026-08-14", "pv": 0, "uv": 0 },
    { "date": "2026-08-15", "pv": 2, "uv": 2 },
    { "date": "2026-08-16", "pv": 12, "uv": 7 }
  ]
}
```

`daily` 是连续数组：包含所选范围内每一个上海自然日，长度严格等于请求的 `days`，日期严格
升序、连续且不重复；每个返回项的 `pv`、`uv` 都是非负安全整数，并满足 `0 <= uv <= pv`。
范围内完全没有该事件时，数组仍保持完整，只是所有日期的 `pv`、`uv` 都为 0。API 不增加
totals，Analytics 根据完整数组全部为零渲染空趋势状态。

不返回以下字段：

- `generated_at`
- `range`
- `filter`
- `timezone`
- `totals`
- 项目、事件、页面或按钮 breakdown
- 事件目录
- diagnostics
- 任何原始 `device_id`

### 7.4 错误

| 情况 | HTTP | 稳定错误码 |
| --- | --- | --- |
| 必填参数缺失 | 400 | `missing_query_parameter` |
| days 非法 | 400 | `invalid_days` |
| project 非法 | 400 | `invalid_project` |
| event 格式非法 | 400 | `invalid_event` |
| 重复参数 | 400 | `duplicate_query_parameter` |
| 未知参数 | 400 | `unknown_query_parameter` |
| 文件不存在或不可读 | 503 | `track_log_unavailable` |
| 文件超过读取上限 | 503 | `track_log_too_large` |
| 已有查询执行中 | 503 | `track_query_busy` |
| 查询超时 | 503 | `track_query_timeout` |
| 未预期错误 | 500 | `internal_error` |

错误响应不包含文件路径、原始行、设备标识或异常堆栈。接口继续设置 `Cache-Control: no-store`。
同一请求同时违反多项查询规则时，不承诺错误码判定优先级；返回任一适用的 `400` 稳定错误码
即可。Analytics 对所有请求错误显示统一的安全错误和重试入口，不依赖错误优先级。

## 8. Analytics 页面

### 8.1 静态事件配置

Analytics 在本项目内手工维护：

```ts
const PROJECT_EVENTS = {
  hub: {
    defaultEvent: "home_page_load",
    events: [
      "home_page_load",
      "products_page_load",
      "articles_page_load",
      "article_detail_page_load",
      "about_page_load",
    ],
  },
  cardgame: {
    defaultEvent: "cardgame_page_load",
    events: [
      "cardgame_page_load",
      "create_room_click",
      "join_room_click",
      "ai_battle_click",
      "play_cards_click",
      "round_confirm_click",
      "play_again_click",
    ],
  },
  shotmarker: {
    defaultEvent: "app_launch",
    events: [
      "app_launch",
      "training_sync_succeeded",
      "highlight_generate_succeeded",
      "highlight_save_succeeded",
    ],
  },
} as const;
```

Backend 不返回或发现事件目录。新增、改名或删除事件时，客户端事件定义、客户端测试、公开
埋点文档和该配置必须在同一批工作中更新。

### 8.2 控件与状态

页面只保留四个控件和一张趋势图：

1. 项目：Hub、Cardgame、ShotMarker。
2. 范围：1、7、30、90 天。
3. 事件：当前项目配置中的一个必选事件。
4. 口径：全局 PV/UV 切换。

行为：

- 第一次访问使用 `hub / 30 / home_page_load / PV`。
- 项目和天数保存到 `track.analytics.filters.v2`；非法或过期值回退到默认值。
- 页面重开时使用已保存的项目和天数，再选择该项目默认事件；事件本身不保存。
- 切换项目时选择新项目默认事件并请求数据。
- 切换范围时保留当前事件并请求数据。
- 切换事件时请求数据。
- 切换 PV/UV 只更换图表读取字段，不发新请求。
- 同一时间只接受最新筛选请求的结果；筛选变化后忽略旧响应，不主动取消服务端查询。当前仅
  项目所有者使用，本版接受新请求偶尔收到 `track_query_busy` 并进入普通错误/重试流程，不
  实现服务端取消传播或 latest-only 查询排队；账号登录、Session 校验和排队 loading 留给
  后续独立设计。
- 初次加载或切换项目、范围、事件时清空旧图并显示加载状态；同一筛选条件下手动刷新时可
  保留旧图，直到新响应成功。
- 请求失败显示安全错误和重试入口，不渲染部分或未经校验的数据。
- `daily` 全部日期的 PV/UV 都为 0 时显示空趋势状态，不视为错误。
- 图表直接使用 Backend 返回的完整连续日期数组，不在客户端推导、补零或插入日期。

页面删除总事件卡、总设备卡、事件排行、页面表、按钮表和“全部事件”选项。

## 9. 代码修改清单

执行总表：

| 范围 | 要做的修改 | 目的 | 主要验证 |
| --- | --- | --- | --- |
| 通用网页发送层 | 删除客户端 time/params，只发三个查询参数 | 建立唯一最小协议 | 请求参数精确测试 |
| Hub | 收敛为五个页面事件，删除点击与 404 埋点 | 只观察核心页面访问 | 四个路由映射与有效文章内容测试 |
| Cardgame | 增加页面加载事件，六个动作改为完整 event | 消除 click + button 组合 | 首次加载与动作测试 |
| ShotMarker | 删除客户端 time/params，保留四个事件 | 与网页使用同一协议 | URLQueryItem 精确测试和 Release build |
| Nginx | 生成服务器 time，直接写四字段 JSONL | 保持写入链路最简单 | `nginx -t`、最新行 key/类型检查 |
| Backend | 只读四字段、必选单事件、返回逐日 PV/UV | 删除旧聚合与兼容复杂度 | parser、route、边界与资源保护测试 |
| Analytics | 静态事件目录、必选事件、单趋势、全局 PV/UV | 页面只回答一个明确趋势问题 | 状态、请求、持久化和渲染测试 |
| 文档与隐私 | 同步实际字段、接口、存储和删数边界 | 防止实现与披露漂移 | 文档契约测试和人工复核 |
| 生产服务器 | 停止 Compose、永久删旧数据、部署后整体启动 | 确保新旧数据不混写 | 容器、文件、接口、页面和 WebSocket 验证 |

### 9.1 `zhangrh.shop`：通用发送层

- [ ] 修改 `frontend/common/track.ts`：输入和返回值只包含 `project`、`event`、
  `device_id`；删除客户端 `time`、`params`、JSON stringify 和对应查询参数。
- [ ] 保持 `frontend/common/device_id.ts` 的生成、localStorage 和 Cookie 复用逻辑不变。
- [ ] 新增或补充发送层测试：精确断言请求只有三个查询参数，仍使用 `/track`、GET 语义和
  当前的非阻塞发送方式。
- [ ] 验证目的：三个网页项目不能再意外发送时间、params 或其他维度。

### 9.2 `zhangrh.shop`：Hub

- [ ] 修改 `frontend/project/hub/shared/tracking.ts`：定义五个 Hub event，直接发送完整事件
  名称；删除 `HubButton`、`trackHubClick` 和 page_name 参数。
- [ ] 修改 `frontend/project/hub/app.tsx`：首页、作品列表、文章列表和关于页按路由发送事件；
  404 和文章详情路由不在这里发送。
- [ ] 修改 `frontend/project/hub/pages/article-detail-page.tsx`：只有找到对应文章并展示内容后才
  发送 `article_detail_page_load`；找不到文章时渲染 404 且不发送。
- [ ] 修改 `frontend/project/hub/shared/constants.ts`：删除导航项中的 tracking button 字段
  和对 `HubButton` 的依赖。
- [ ] 修改 `frontend/project/hub/components/app-header.tsx`：删除导航点击埋点回调。
- [ ] 修改 `frontend/project/hub/pages/home-page.tsx`：删除首页两个入口按钮的点击埋点。
- [ ] 添加 Hub tracking 测试，覆盖四个普通页面映射、有效文章内容上报、未知六位文章 ID、
  其他 404 和点击不上报。
- [ ] 验证目的：Hub 只产生五个明确页面访问事件。

### 9.3 `zhangrh.shop`：Cardgame

- [ ] 新建 `frontend/project/cardgame/shared/tracking.ts`，定义 Cardgame event 联合类型和发送
  函数，避免继续在大型 `app.tsx` 中维护字符串拼接。
- [ ] 修改 `frontend/project/cardgame/app.tsx`：应用首次装载发送一次
  `cardgame_page_load`。
- [ ] 把六个现有按钮值改为完整事件名：`create_room_click`、`join_room_click`、
  `ai_battle_click`、`play_cards_click`、`round_confirm_click`、`play_again_click`。
- [ ] 保持各事件当前触发时机不变，不把点击改成业务成功埋点。
- [ ] 添加测试，覆盖页面加载只发一次、六个动作映射正确、业务失败不改变既有点击语义。
- [ ] 验证目的：Cardgame 不再依赖 `event=click + params.button`。

### 9.4 `zhangrh.shop`：Backend

- [ ] 重写 `backend/projects/track-query.js` 的记录模型，只识别严格四字段新记录。
- [ ] 删除 schema version、request ID、客户端时间、params 解码、页面/按钮维度、gzip 与轮转
  文件发现和 request ID 去重代码。
- [ ] 保留流式读取、当前文件快照、部分尾行保护、超时、`64 MiB` 字节上限、事件循环让步和
  错误隔离；不要求为单行、唯一设备数、符号链接或 inode 竞态增加专项保护。
- [ ] 聚合器参数改为必填 `project`、`event`、`days`，预创建长度等于 `days` 的连续日期和
  零值，再把有效记录聚合到对应日期。
- [ ] 每天维护一个 `device_id` Set 计算 UV；不维护全范围 totals。
- [ ] 修改 `backend/projects/track.js`：删除 `/api/track/summary`，注册严格的
  `/api/track/trend`。
- [ ] 要求 `project`、`event`、`days` 全部存在，拒绝重复和未知查询参数。
- [ ] 保持单查询并发限制、安全错误映射和 `Cache-Control: no-store`。
- [ ] 更新 `backend/tools/track-query.test.mjs`，覆盖四字段解析、PV、逐日 UV、项目/事件/日期
  过滤、连续日期、零值填充、全零趋势、无效行、尾行、文件不可用、大小上限和超时。
- [ ] 更新 `backend/tools/track-route.test.mjs`，覆盖新路径、三个必填参数、稳定错误、并发保护
  和不泄露原始数据。
- [ ] 验证目的：Backend 成为单一事件的只读趋势计算器，不保留旧聚合能力。

### 9.5 `zhangrh.shop`：Analytics

- [ ] 把 `frontend/project/analytics/track-summary.ts` 重命名为 `track-trend.ts`，并用明确的
  trend 命名替换旧 summary 类型、解析器和 URL 构造。
- [ ] 在 Analytics 项目内新增三个项目的静态事件目录和默认事件。
- [ ] 修改 `frontend/project/analytics/app.tsx`：增加必选事件和全局 PV/UV 状态；实现项目、
  天数 localStorage 恢复与校验。
- [ ] 把 `summary-view.tsx` 重命名为 `trend-view.tsx`，并用单趋势组件替换旧汇总视图。
- [ ] 更新 `index.html` 的标题和描述，从聚合概览改为单事件趋势。
- [ ] 修改 `styles.css`：删除指标卡和 breakdown 表样式，保留响应式筛选区、状态提示和趋势图。
- [ ] 把对应测试重命名为 `track-trend.test.ts`、`trend-view.test.tsx`，并更新 `app.test.tsx`。
- [ ] 测试默认值、本地恢复、项目切换默认事件、范围切换保留事件、事件请求、PV/UV 无请求
  切换、连续日期和长度校验、全零趋势、统一错误、网络错误、503 和重试。
- [ ] 验证目的：页面只回答“某项目、某事件、某段时间内每日 PV/UV 如何变化”。

### 9.6 `zhangrh.shop`：文档与隐私说明

- [ ] 更新现行公开或运维文档：
  - `frontend/docs/track.md`：四字段模型、三个项目事件目录和新趋势接口。
  - `RUNBOOK.md`：新 curl 示例、错误处置、连续日期响应、单文件容量检查和停服切换说明。
  - `docs/deploy/README.md`：新 API、Nginx 四字段写入、旧数据已删除和无旧格式兼容。
  - `README.md`：把 Analytics 描述改为必选单事件的逐日 PV/UV 趋势。
  - `frontend/project/shotmarker/content.ts` 及测试：ShotMarker 只发送项目、事件和随机安装 ID，
    服务器添加时间；删除“客户端时间”和“空 params 对象”披露。
- [ ] 给以下历史 Track 规格和计划增加“已被本设计取代，仅保留为历史记录”的顶部状态提示，
  不重写其历史实施内容：
  - `docs/superpowers/specs/2026-08-15-track-jsonl-query-api-design.md`
  - `docs/superpowers/specs/2026-08-16-track-single-jsonl-storage-design.md`
  - `docs/superpowers/specs/2026-08-16-track-analytics-page-design.md`
  - `docs/superpowers/plans/2026-08-15-track-jsonl-query-api.md`
  - `docs/superpowers/plans/2026-08-16-track-analytics-page.md`
- [ ] 生产部署和线上验证完成后更新私有服务器台账：
  - `docs/private.local/zhangrh-shop/main.md`
  - `docs/private.local/zhangrh-shop/overview.md`
  只记录当次实际验证过的生产事实，不提前把设计状态写成已部署。
- [ ] 验证目的：代码、公开隐私政策和运维手册描述同一套实际字段。

### 9.7 `ShotMarker` 仓库

- [ ] 修改 `ShotMarker/Services/Analytics/AnalyticsClient.swift`：删除注入时钟和客户端毫秒
  时间；请求只包含 `project`、`event`、`device_id`。
- [ ] 保持 endpoint、GET、5 秒超时、ephemeral session、无 Cookie、无缓存、无重试和失败
  静默行为不变。
- [ ] 保持 `AnalyticsEvent.swift` 的四个事件名不变。
- [ ] 保持 `InstallationIDStore.swift` 的 12 位安装 ID 规则不变。
- [ ] 更新 `ShotMarkerTests/AnalyticsClientTests.swift`：精确断言只有三个查询参数，并删除
  时钟相关测试依赖。
- [ ] 继续运行事件枚举、安装 ID、运行策略、同步、生成和保存调用点测试。
- [ ] 更新 `docs/current-codebase-status.md`：记录客户端三参数协议、实际验证范围和仍未完成的
  TestFlight/生产外部状态；它继续作为 ShotMarker 当前进度唯一事实来源。
- [ ] 更新 `docs/superpowers/specs/2026-08-16-shotmarker-analytics-design.md`：事件语义和运行策略
  继续有效，传输字段、服务端四字段模型和趋势查询改为引用本设计。
- [ ] 给以下已完成的历史实施计划增加顶部状态提示，说明其中 client time、params、schema v1
  和旧 summary API 已被本设计取代，不重新执行旧步骤：
  - `docs/superpowers/plans/2026-08-16-shotmarker-analytics-client.md`
  - `docs/superpowers/plans/2026-08-16-shotmarker-analytics-server.md`
- [ ] `PrivacyInfo.xcprivacy` 的 Device ID 与 Product Interaction 声明不需要改变，但必须
  继续通过 plist 和产物包含检查。
- [ ] 验证目的：原生客户端与网页使用同一最小协议，隐私披露不再多报字段。

## 10. 自动化验证清单

### 10.1 Backend

- [ ] 有效四字段记录进入正确日期。
- [ ] 同日相同设备重复事件：PV 增加，UV 不增加。
- [ ] 同一设备跨日出现：分别计入各日 UV。
- [ ] 不同 event 和不同 project 不进入当前趋势。
- [ ] 查询期首日 `00:00:00+08:00` 边界正确。
- [ ] 未来时间和范围外记录被排除。
- [ ] 非法 JSON、空字段、额外字段、旧 schema、非法项目、非法事件、非法设备 ID 和非法时间
  被忽略。
- [ ] 未完成尾行不导致整个查询失败。
- [ ] 1、7、30、90 天分别返回 1、7、30、90 个连续日期项，日期严格升序且不重复。
- [ ] 合法但无记录的事件仍返回完整日期数组，每个 `pv`、`uv` 都为 0。
- [ ] 响应严格只有 `daily`，不含设备原值或旧字段。
- [ ] 文件缺失、过大、超时和并发查询返回稳定安全错误。

### 10.2 Web 前端

- [ ] 通用请求只包含三个查询参数。
- [ ] Hub 四个普通页面按路由产生事件；文章详情仅在内容存在并展示后产生事件，未知文章、
  其他 404 和点击不产生事件。
- [ ] Cardgame 首次装载事件只发送一次，六个点击事件名称正确。
- [ ] Analytics 事件目录与确认清单完全一致。
- [ ] 默认状态是 Hub、30 天、`home_page_load`、PV。
- [ ] localStorage 只保存合法项目和合法天数；损坏值自动回退。
- [ ] 切项目选择默认事件，切范围保留事件。
- [ ] 切 PV/UV 不调用 fetch，切项目/范围/event 会调用一次 fetch。
- [ ] API 响应的 `daily` 不是数组、长度不等于当前查询 `days`、日期无效或不连续，或者计数
  不是满足 `0 <= uv <= pv` 的安全整数时整份拒绝并显示统一错误；全零数组合法。
- [ ] 全零趋势、加载、刷新、失败和重试状态可访问且不泄露响应正文。

### 10.3 ShotMarker

- [ ] 请求 URL 只有 project、event、device_id。
- [ ] 四个 enum raw value 不变。
- [ ] 每次 track 仍只安排一个请求且不重试。
- [ ] Debug、测试和非 iPhone 平台仍使用 no-op。
- [ ] Release iPhone build 通过。
- [ ] `PrivacyInfo.xcprivacy` lint 通过且包含在 App 产物中。

### 10.4 仓库级命令

`zhangrh.shop`：

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run check
```

ShotMarker：

- 运行 Analytics、Installation ID、PhoneWatchSyncService、HighlightJobManager 和隐私清单
  相关 XCTest。
- 运行完整可行测试集。
- 构建 Release iPhone simulator 或签名条件允许的 Release 产物。
- 对 `PrivacyInfo.xcprivacy` 执行 `plutil -lint` 并检查构建产物包含该文件。

## 11. Git 与提交清单

`zhangrh.shop` 与 `ShotMarker` 是两个独立仓库，分别保持小步、可审查提交。所有提交信息
使用中文说明并带约定前缀。建议提交边界：

1. `refactor: 简化网页埋点上报模型`
2. `refactor: 统一Hub与Cardgame事件名称`
3. `refactor: 重写埋点趋势查询`
4. `refactor: 简化Analytics单事件趋势`
5. `docs: 更新四字段埋点与部署说明`
6. ShotMarker 仓库：`refactor: 简化ShotMarker埋点请求`
7. ShotMarker 仓库：`docs: 更新ShotMarker埋点字段说明`

每个提交前运行与该范围直接相关的测试；两个仓库全部完成后再运行各自完整验证。不得把服务
器私有 Nginx、Compose、IP、凭据或真实设备 ID 提交到公开仓库。

## 12. 生产服务器执行清单

### 12.1 本地发布前

- [ ] 两个仓库工作区无未说明的改动。
- [ ] 所有实现提交已审查并推送。
- [ ] `zhangrh.shop` 的 `npm run check` 通过。
- [ ] ShotMarker 相关测试、Release build 和隐私清单检查通过。
- [ ] 准备好前端 OSS 发布所需环境变量，但不把值写入命令历史或文档。
- [ ] 确认可以 SSH 到目标服务器，且发布脚本目标仍是 `/opt/zhangrh-shop`。

### 12.2 服务器只读预检

- [ ] 进入 `/opt/zhangrh-shop`，运行 `docker compose config --services` 和
  `docker compose ps`，确认只会停止本 Compose 项目。
- [ ] 用 `nginx -T` 或容器内等价命令定位实际生效配置，不能猜测配置文件路径。
- [ ] 确认 `readlink -f /opt/zhangrh-shop/data/track` 精确返回同一路径，且它不是符号链接。
- [ ] 列出数据目录第一层条目、类型和大小；若出现预期外目录、设备文件或链接则停止操作。
- [ ] 确认旧内容只包括 `events.jsonl`、`events.jsonl-*` 和历史 gzip。
- [ ] 查询 Nginx worker 实际数字 UID/GID，并记录新文件所需 mode。
- [ ] 检查当前 Nginx 配置和 Compose 文件备份方式；配置可备份，旧埋点数据不备份。

### 12.3 停止服务

- [ ] 在 `/opt/zhangrh-shop` 执行 `docker compose stop`。
- [ ] 再次运行 `docker compose ps`，确认该项目所有容器均已停止。
- [ ] 确认 Nginx 不再追加 `events.jsonl`，Backend 不再读取它。

停服期间 Hub、Cardgame、ShotMarker 网站、Analytics 和 Backend 均不可用。当前低访问量下
接受这一点，不增加临时维护路由。

### 12.4 永久删除旧数据

- [ ] 停服后再次校验数据目录真实路径和第一层内容。
- [ ] 永久删除 `/opt/zhangrh-shop/data/track` 第一层内全部预期旧埋点文件。
- [ ] 不复制、不压缩、不移动旧数据到备份目录。
- [ ] 确认旧 `events.jsonl`、轮转文件和 gzip 均已不存在。
- [ ] 创建新的空 `events.jsonl`。
- [ ] 使用预检得到的 Nginx UID/GID 和既有安全 mode 设置所有权与权限。
- [ ] 确认 Backend 容器通过现有只读挂载能够读取，Nginx 通过读写挂载能够追加。

该删除不可恢复。路径、文件类型或容器状态任一项不符合预期时不得执行删除。

### 12.5 部署

- [ ] 把最终四字段 `log_format` 合并到服务器私有 Nginx 配置。
- [ ] 确认 `/track` 只写专用 `events.jsonl`，不写普通完整 URI 日志。
- [ ] 发布 Hub、Cardgame 和 Analytics 静态资源与 HTML。
- [ ] 发布 Backend；发布脚本可能先启动 Backend，但 Nginx 尚未启动时不会暴露外部流量。
- [ ] 在服务器执行最终 `docker compose up -d --build`，启动整个项目。
- [ ] 运行 `docker compose ps`，确认所有目标服务 healthy/running。
- [ ] ShotMarker 代码更新完成后按正常 TestFlight/App Store 流程发布；它不阻塞服务器切换。

### 12.6 线上验证

- [ ] Nginx 配置测试通过，无 reload/start 错误。
- [ ] `GET /track?...` 返回 `204`。
- [ ] 用正常 Hub 页面访问产生一条真实 `home_page_load`，不创建专用 smoke event。
- [ ] 只检查最新 JSON 行的 key、类型和格式，避免在终端或文档中输出真实 `device_id`。
- [ ] 确认最新行严格只有 `project`、`event`、`time`、`device_id`。
- [ ] 确认 `time` 是服务器 ISO 8601 时间，原始行没有 `params`、客户端 time、context、schema
  或 request ID。
- [ ] 查询三个默认事件：

```text
/api/track/trend?project=hub&event=home_page_load&days=30
/api/track/trend?project=cardgame&event=cardgame_page_load&days=30
/api/track/trend?project=shotmarker&event=app_launch&days=30
```

- [ ] 每个响应只有 `daily`，长度为 30，日期位于查询范围内、严格连续升序且不重复；`pv`、
  `uv` 是满足 `0 <= uv <= pv` 的安全整数，允许全部为 0。
- [ ] 打开 Analytics，确认默认值、三个项目事件列表、事件切换和 PV/UV 切换。
- [ ] 在浏览器网络面板确认 PV/UV 切换没有新请求。
- [ ] 检查 Hub 五个页面事件和 Cardgame 页面/点击事件会产生正确行。
- [ ] 检查 Cardgame health 和 WebSocket 能重新连接并完成一次基本操作。
- [ ] 检查 Backend 与 Nginx 日志，没有持续解析、权限、文件或查询错误。
- [ ] 确认旧数据文件和 gzip 仍不存在。
- [ ] 更新 `docs/private.local` 中服务器台账并在其独立私有仓库提交、推送。

## 13. 故障处理

- 删除前发现异常：不删除，保持或恢复原服务后重新检查。
- 删除后 Nginx 无法写入：保持项目停止，修复目录所有权、mode 或挂载后再启动。
- 删除后 Backend 无法读取：保持或重新停止项目，修复只读挂载和目录穿越权限。
- 新 API 或前端异常：直接修复新代码并重新部署；不回滚旧 reader、旧 API 或旧页面。
- Nginx 配置异常：保持项目停止，直接修复新的四字段配置后再启动；旧配置备份只用于参考
  证书、站点和代理内容，不恢复旧 Track `log_format`。
- 容量或查询保护触发：停止重复查询，检查文件大小和 I/O，再重新设计存储；不临时移除
  64 MiB/20 秒保护。

服务器上的代码和配置可以替换为已验证的四字段新版本，旧埋点数据不能恢复，也不回滚到
旧 Track 实现。删除后的唯一恢复目标是让四字段新链路正常运行。

## 14. 验收标准

- 三个客户端的规范请求都只有 `project`、`event`、`device_id`。
- Nginx 生成 `time` 并把每个请求写成四字段 JSONL 行。
- Backend 不含旧 schema、params、context、gzip 或 request ID 兼容代码。
- `/api/track/summary` 不再提供；新 `/api/track/trend` 三个参数全部必填。
- 趋势响应严格只有按日期连续升序、无重复且长度等于 `days` 的
  `daily[{date,pv,uv}]`；没有所选事件时每天返回零值。
- Analytics 没有全部事件、totals、breakdown 或动态事件发现。
- Analytics 为每个项目使用已确认事件目录和默认事件。
- Hub 只产生五个核心页面事件，其中文章详情事件只在有效文章内容展示后产生。
- Cardgame 产生一个页面加载事件和六个现有动作事件。
- ShotMarker 保持四个事件语义，只移除客户端 time 和 params。
- 项目和天数能够合法持久化，PV/UV 切换不发请求。
- 旧 JSONL、轮转文件和 gzip 已从生产服务器永久删除。
- 两个仓库的相关测试、完整可行验证和生产只读检查全部通过。
- 公开隐私说明、埋点文档、运行手册和实际请求字段一致。

## 15. 明确不做

- 不增加 context、params 或任意事件属性。
- 不提供“全部事件”或跨事件 totals。
- 不自动发现并展示 JSONL 中的新事件。
- 不提供跨日总 UV、漏斗、留存、cohort、会话或实时刷新。
- 不由 Analytics 客户端推导或补齐日期；Backend 负责返回长度等于 `days` 的连续零填充数组。
- 不引入 SQLite、PostgreSQL、ClickHouse 或第三方分析 SDK。
- 不在本版增加账号、鉴权、角色或私有管理后台；Auth 登录和 Nginx 鉴权分别留给后续设计。
- 不在本版增加 Session 校验、查询排队、latest-only loading 或服务端取消传播。
- 不增加旧数据迁移、旧 API 兼容、旧 schema 解析或历史补录。
- 不在本次工作中设计自动轮转、自动删除或固定保留期。
- 不为超过 `64 MiB` 后的报表不可用增加自动切换或降级；达到阈值后人工上线新机制。
