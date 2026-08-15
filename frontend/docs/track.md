# 前端埋点说明

`frontend/common/track.ts` 是 Hub 和 Cardgame 共用的发送入口。调用 `track()` 会生成以下字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `time` | number | `Date.now()` 产生的毫秒时间戳 |
| `project` | string | 当前调用方为 `hub` 或 `cardgame` |
| `device_id` | string | 12 位字母数字标识，优先复用 localStorage 或 `.zhangrh.shop` Cookie |
| `event` | string | 事件名称 |
| `params` | object | 事件参数 |

## 发送方式

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

## 持久化与查询边界

生产 Nginx 对 `/track` 返回 `204`，并把每个请求按 schema v1 独立写入宿主机持久目录中的 JSONL。写入失败不会改变前端响应；读取端负责拒绝伪造或格式错误的记录。

Backend 通过只读挂载流式聚合日志，并公开提供：

```text
GET /api/track/summary?days=<1-90>&project=<hub|cardgame>
```

`days` 默认 30，`project` 可省略。响应只包含事件、浏览器设备数、项目、事件、页面、按钮和每日汇总，不返回原始 `device_id`、params、IP、User-Agent、Referer、Cookie 或文件路径。

该接口第一阶段无需鉴权，结果属于公开、低风险的产品观察数据。客户端事件和设备标识均可伪造，不能用于计费、风控、审计或强一致业务指标。
