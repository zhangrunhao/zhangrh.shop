# 前端埋点说明

`frontend/common/track.ts` 是 Hub 和 Cardgame 共用的网页发送入口；ShotMarker iPhone App 使用同一 HTTPS GET 协议。当前仓库实现只由客户端发送三个查询参数：

| 字段 | 说明 |
| --- | --- |
| `project` | 固定为 `hub`、`cardgame` 或 `shotmarker` |
| `event` | 稳定的小写 snake_case 业务事件名 |
| `device_id` | 12 位字母数字随机标识；网页复用 localStorage 或 `.zhangrh.shop` Cookie，ShotMarker 使用保存在 UserDefaults 中的安装随机值 |

客户端查询参数不包含时间、通用参数对象、context、schema version 或 request ID。Nginx 的专用四字段 JSONL 也不保存 IP、User-Agent、Referer 或 Cookie 值。

## 发送方式

浏览器用 `URLSearchParams` 构造同源 GET 请求，并通过 `Image` 非阻塞发送：

```text
/track?project=<project>&event=<event>&device_id=<device_id>
```

图片对象在请求成功或失败前保存在内存数组中，避免因对象被回收而提前中止。上报失败不影响产品流程，也不会重试。

ShotMarker 仅在 iPhone App 的 Release 构建中使用临时 `URLSession` 发送同样的三个参数。Debug、测试、iPad、Apple Watch 和其他非 iPhone 环境不发送；原生客户端不设置或接受 Cookie，禁用响应缓存，发送失败即丢弃。

## 事件目录

### Hub

Hub 只记录五个核心页面展示事件，不记录按钮点击或 404：

| event | 触发语义 |
| --- | --- |
| `home_page_load` | Hub 首页展示；默认事件 |
| `products_page_load` | 作品列表页展示 |
| `articles_page_load` | 文章列表页展示 |
| `article_detail_page_load` | 有效文章详情内容成功加载并展示 |
| `about_page_load` | 关于页展示 |

未知文章 ID 和其他未匹配路由按 404 展示，不发送事件。

### Cardgame

| event | 触发语义 |
| --- | --- |
| `cardgame_page_load` | Cardgame 前端应用本次装载后的首次展示；默认事件 |
| `create_room_click` | 用户触发创建房间 |
| `join_room_click` | 用户触发加入房间 |
| `ai_battle_click` | 用户触发人机对战 |
| `play_cards_click` | 用户提交出牌 |
| `round_confirm_click` | 用户确认当前回合结果 |
| `play_again_click` | 用户触发再来一局 |

六个点击事件表示用户触发动作，不保证后续 WebSocket 或业务操作成功。

### ShotMarker iPhone

| event | 触发语义 |
| --- | --- |
| `app_launch` | iPhone App 进程启动；默认事件 |
| `training_sync_succeeded` | Watch 训练记录成功导入 iPhone |
| `highlight_generate_succeeded` | 集锦 runner 最终完成且输出文件已位于正式路径 |
| `highlight_save_succeeded` | 集锦成功保存到系统相册且成功状态已持久化 |

这些事件不包含训练记录、打点时间戳、视频、HealthKit 数据、诊断日志或其他业务维度。

## 服务端四字段记录

四字段版本的生产部署由 Nginx 接收 `/track`、生成服务器时间、追加专用 JSONL 并返回 `204`。单行格式为：

```json
{"project":"hub","event":"home_page_load","time":"2026-08-16T12:00:00+08:00","device_id":"AbCd1234Ef56"}
```

Nginx 不校验查询参数；缺失、伪造或格式错误的请求也可能落盘。Backend 查询时只接受严格包含 `project`、`event`、`time`、`device_id` 四个字段的对象，并校验项目、事件格式、ISO 8601 时间和 12 位设备标识。无效行留在原文件中，但不参与报表。

宿主机只保留当前 `events.jsonl`。Backend 不读取轮转文件或 gzip，也不兼容旧 schema。文件没有固定自动过期时间；达到 `32 MiB` 时人工重新评估存储方案，超过 Backend 的 `64 MiB` 读取上限后趋势接口保持不可用，直到新机制完成。

## 单事件趋势查询

公开只读接口一次必须指定一个项目和一个事件：

```text
GET /api/track/trend?project=hub&event=home_page_load&days=30
```

- `project` 只允许三个固定项目。
- `event` 必填并匹配 `[a-z][a-z0-9_]{0,63}`；Backend 不维护事件白名单。
- `days` 只允许 `1`、`7`、`30`、`90`。
- 未知、重复或缺失查询参数均被拒绝。

成功响应严格只有按上海自然日连续升序排列的 `daily`：

```json
{
  "daily": [
    { "date": "2026-08-15", "pv": 2, "uv": 2 },
    { "date": "2026-08-16", "pv": 12, "uv": 7 }
  ]
}
```

数组长度严格等于 `days`。PV 是当天匹配项目和事件的有效记录数；UV 是当天按 `device_id` 去重后的数量。同一设备跨日分别计入各日 UV。没有记录的日期返回零值；整个范围没有该事件时仍返回完整的全零数组。接口不返回 totals、breakdown、timezone、diagnostics 或原始设备标识。

Analytics 手工维护上述事件目录，默认打开 `Hub / 30 天 / home_page_load / PV`。浏览器只保存项目和天数；事件在重开时恢复为该项目默认值，PV/UV 口径不保存。切换 PV/UV 只重绘现有数据，不发新请求。

这些数据是公开、可伪造的低风险产品观察数据，不能用于计费、风控、审计或强一致业务指标。当前仓库实现与生产实际部署状态必须分开确认；只有完成服务器停服切换和线上验证后，才能把四字段链路记为已部署。
