# Track 埋点与趋势

本文是 Track 客户端协议、事件目录、存储模型和查询接口的当前事实来源。代码与测试于 2026-08-19 复核；生产状态未在本次任务重新验证。

## 客户端协议

网页向同源 `/track`、ShotMarker iPhone Release 向 `https://zhangrh.shop/track` 发送 HTTPS GET 请求，只包含：

| 字段 | 规则 |
| --- | --- |
| `project` | `hub`、`cardgame` 或 `shotmarker` |
| `event` | 小写 snake_case 事件名 |
| `device_id` | 12 位字母数字随机标识 |

浏览器通过 `Image` 非阻塞发送，失败不影响产品流程且不重试。网页在 localStorage 与 `.zhangrh.shop` Cookie 间复用设备标识。ShotMarker 将安装随机值保存在 UserDefaults；仅 iPhone Release 使用无 Cookie、无缓存的临时会话发送，Debug、测试和其他平台不发送。真实 Release/TestFlight 上报仍未验证。

客户端不发送时间、通用参数对象、context、schema version 或 request ID。

## 事件目录

### Hub

| event | 触发语义 |
| --- | --- |
| `home_page_load` | 首页展示；默认事件 |
| `products_page_load` | 作品列表展示 |
| `articles_page_load` | 文章列表展示 |
| `article_detail_page_load` | 有效文章内容加载并展示 |
| `about_page_load` | 关于页展示 |

未知文章和未匹配路由不发送事件。

### Cardgame

| event | 触发语义 |
| --- | --- |
| `cardgame_page_load` | 前端本次装载后的首次展示；默认事件 |
| `create_room_click` | 触发创建房间 |
| `join_room_click` | 触发加入房间 |
| `ai_battle_click` | 触发人机对战 |
| `play_cards_click` | 提交出牌 |
| `round_confirm_click` | 确认回合结果 |
| `play_again_click` | 触发再来一局 |

点击事件只表示用户触发动作，不表示后续业务成功。

### ShotMarker iPhone

| event | 触发语义 |
| --- | --- |
| `app_launch` | App 进程启动；默认事件 |
| `training_sync_succeeded` | Watch 训练记录成功导入 iPhone |
| `highlight_generate_succeeded` | 集锦生成完成并进入正式路径 |
| `highlight_save_succeeded` | 集锦保存到系统相册且状态已持久化 |

事件不包含训练记录、打点时间戳、视频、HealthKit 数据或诊断日志。

## 服务端记录

Nginx 接收 `/track`、生成服务器 `time`、向单一 `events.jsonl` 追加记录并返回 `204`。每行严格包含：

```json
{"project":"hub","event":"home_page_load","time":"2026-08-16T12:00:00+08:00","device_id":"AbCd1234Ef56"}
```

Nginx 不校验业务参数。Backend 查询时校验字段集合、项目、事件、ISO 8601 时间和设备标识；无效行留在文件中但不参与报表。Track 文件不保存 IP、User-Agent、Referer 或 Cookie。

当前只读取 `events.jsonl`，不读取轮转文件、gzip 或旧 schema。文件不自动轮转、压缩、删除或过期；达到 `32 MiB` 时重新评估存储方案。

## 趋势接口

```text
GET /api/track/trend?project=hub&event=home_page_load&days=30
```

- `project`、`event`、`days` 全部必填，不允许未知或重复参数。
- `event` 匹配 `[a-z][a-z0-9_]{0,63}`；Backend 不维护事件白名单。
- `days` 只允许 `1`、`7`、`30`、`90`。
- 响应严格只有长度等于 `days` 的 `daily[{date,pv,uv}]`。
- `date` 为按上海自然日连续升序排列的 `YYYY-MM-DD`；`pv`、`uv` 为满足 `0 <= uv <= pv` 的安全整数。
- PV 是当日匹配记录数；UV 是当日按 `device_id` 去重后的数量。
- 无记录日期返回零值；整个范围无记录仍返回完整的全零数组。

Backend 同时只执行一个 Track 查询，单次读取上限为 `64 MiB`，单行上限为 `32 KiB`，超时为 20 秒。

| HTTP | 错误代码 |
| --- | --- |
| `400` | `missing_query_parameter`、`invalid_project`、`invalid_event`、`invalid_days`、`duplicate_query_parameter`、`unknown_query_parameter` |
| `503` | `track_query_busy`、`track_log_unavailable`、`track_log_too_large`、`track_query_timeout` |
| `500` | `internal_error` |

`track_query_busy` 带 `Retry-After: 2`。公开响应不返回文件路径、原始记录、设备标识或堆栈。

## Analytics

Analytics 手工维护本文件的事件目录，默认状态为 `Hub / 30 天 / home_page_load / PV`。浏览器只保存项目和天数；切换项目时恢复该项目默认事件，切换 PV/UV 只重绘现有数据。

Track 是公开、可伪造的低风险产品观察数据，不得用于计费、风控、审计或强一致业务指标。

## 生产边界

- 私有台账记录的最近四字段切换与验收日期为 2026-08-16。
- 本次任务未验证线上入口、Nginx、Track 文件或真实客户端上报。
- 生产路径、权限、配置和外部验证证据只由私有台账维护。

## 证据

- `frontend/common/track.ts`
- `frontend/project/{hub,cardgame,shotmarker,analytics}`
- `backend/projects/{track,track-query}.js`
- `backend/tools/track-*.test.mjs`
