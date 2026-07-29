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

## 数据边界

仓库中没有可确认的 `/track` 后端路由，也没有实际执行数据库写入的入库任务。当前代码只能证明浏览器会发起 image GET 请求，不能据此声称请求会被接收、记录或持久化。若部署环境另有网关日志或仓库外处理流程，应在对应基础设施文档中单独说明。
