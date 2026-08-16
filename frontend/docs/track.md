# 前端埋点说明

`frontend/common/track.ts` 是 Hub 和 Cardgame 共用的网页发送入口；ShotMarker iPhone App 使用同一埋点协议和 HTTPS GET 接口。各客户端会生成以下字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `time` | number | 客户端生成的 Unix epoch 毫秒时间戳；网页使用 `Date.now()` |
| `project` | string | 当前调用方为 `hub`、`cardgame` 或 `shotmarker` |
| `device_id` | string | 12 位字母数字标识；网页优先复用 localStorage 或 `.zhangrh.shop` Cookie，ShotMarker 使用保存在 UserDefaults 中的安装随机值 |
| `event` | string | 事件名称 |
| `params` | object | 事件参数 |

## 网页发送方式

浏览器创建 `Image`，把字段编码为当前域名下的 GET 请求：

```text
/track?time=<timestamp>&project=<project>&device_id=<id>&event=<event>&params=<json>
```

`params` 会先序列化为 JSON，再由 `URLSearchParams` 编码。图片对象在加载成功或失败前保存在内存数组中，避免请求因对象被回收而提前中止。

## Hub

Hub 在路由变化时发送：

| event | params |
| --- | --- |
| `load_page` | `{ "page_name": "home" }` |

`page_name` 的当前取值：

- `home`
- `products`
- `articles`
- `article_detail`
- `about`
- `not_found`

Hub 的导航和首页入口发送：

| event | `params.button` |
| --- | --- |
| `click` | `nav_product` |
| `click` | `nav_articles` |
| `click` | `nav_about` |
| `click` | `main_view_products` |
| `click` | `main_view_articles` |

## Cardgame

Cardgame 的以下操作发送 `event: "click"`，参数格式均为 `{ "button": "<value>" }`：

- `create_room`
- `join_room`
- `ai_battle`
- `play_cards`
- `round_confirm`
- `play_again`

事件在相应按钮处理逻辑中触发；它表示用户执行了该操作，不保证后续 WebSocket 请求成功。

## ShotMarker iPhone

ShotMarker 仅在 iPhone App 的 Release 构建中使用临时 `URLSession`，向同一 HTTPS GET 接口发送埋点。Debug 构建、测试、iPad、Apple Watch 和其他非 iPhone 环境不发送。ShotMarker 原生客户端不设置或接受 Cookie，并禁用 URL 响应缓存。

所有 ShotMarker 事件都发送 `project=shotmarker` 和 `params={}`：

| event | 成功语义 |
| --- | --- |
| `app_launch` | iPhone App 进程启动 |
| `training_sync_succeeded` | Watch 训练记录成功导入 iPhone，且事件在向 Watch 发送 ACK 前触发 |
| `highlight_generate_succeeded` | 集锦 runner 最终进入 `completed` 状态，且输出文件已位于正式路径 |
| `highlight_save_succeeded` | 集锦成功写入系统相册，且保存成功状态已持久化 |

发送失败即丢弃；客户端不缓存、不批量发送，也不重试。事件不上传训练记录、打点时间戳、视频、HealthKit 数据、诊断日志或其他业务/诊断字段。

## 持久化与查询边界

生产 Nginx 对 `/track` 返回 `204`，并把每个请求按 schema v1 独立写入宿主机持久目录中的 `events.jsonl`。写入失败不会改变前端响应；读取端负责拒绝伪造或格式错误的记录。

Backend 通过只读挂载流式聚合日志，并公开提供：

```text
GET /api/track/summary?days=<1-90>&project=<hub|cardgame|shotmarker>
```

`days` 默认 30，`project` 可省略。响应仅返回聚合结果、查询元数据与诊断计数，真实顶层字段为 `generated_at`、`range`、`filter`、`totals`、`projects`、`event_breakdown`、`page_breakdown`、`button_breakdown`、`daily` 和 `diagnostics`；其中设备数是近似浏览器/安装数。响应不返回原始标识符（包括 `device_id` 和 `request_id`）、params、IP、User-Agent、Referer、Cookie 或文件路径。

该接口第一阶段无需鉴权，结果属于公开、低风险的产品观察数据。客户端事件和设备标识均可伪造，不能用于计费、风控、审计或强一致业务指标。

当前存储方案有意保持为单一追加文件，不使用 Track 专用 logrotate，也不自动清理数据。部署早期留下的轮转 gzip 不删除，Backend 仍兼容读取；正常运行不会继续生成新的 gzip。`events.jsonl` 达到 `32 MiB` 时再评估轮转、归档或数据库方案，并在 Backend 的 `64 MiB` 总解码上限前完成调整。
