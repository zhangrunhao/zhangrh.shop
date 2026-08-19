# 项目与组件

`zhangrh.shop` 是个人主页与独立项目的公开代码仓库，包含四个 Vite 前端和一个 Node/Express 后端。本文于 2026-08-19 根据当前代码、构建配置和测试复核；线上可用性未在本次任务验证。

## 当前范围

- Hub：个人主页、作品列表和 Markdown 文章。
- Cardgame：回合制卡牌 Demo；在 Hub 中标记为暂停维护，独立页面仍保留。
- ShotMarker：产品介绍、帮助和隐私说明。
- Analytics：按项目、事件、时间范围和 PV/UV 口径查看逐日趋势。
- Backend：Cardgame HTTP/WebSocket 服务和 Track 只读趋势查询。

## 组件边界

| 路径 | 职责 |
| --- | --- |
| `frontend/project/hub` | 主页、作品和文章 |
| `frontend/project/cardgame` | Cardgame 页面和 WebSocket 客户端 |
| `frontend/project/shotmarker` | ShotMarker 产品页面 |
| `frontend/project/analytics` | Track 趋势页面 |
| `frontend/common` | 共用设备标识和埋点发送 |
| `backend` | Cardgame 服务和 Track 趋势查询 |
| `automation/publish` | 交互式启动与发布入口 |

前端与后端分别维护依赖和锁文件，不是 npm workspace。Hub 文章属于产品内容，不进入项目文档的 Change 生命周期。

## 事实边界

- 公开代码、接口、测试和部署契约由本仓库维护。
- 服务器、网络、证书和实际生产配置由独立私有台账维护。
- 密码、私钥、Token 和 `.env` 实际值不进入文档仓库。

详细入口见[根 README](../../README.md)。
