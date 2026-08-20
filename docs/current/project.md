# 项目与组件

`zhangrh.shop` 是个人主页与独立项目的公开代码仓库，包含四个 Vite 前端和一个 Node/Express 后端。代码、构建配置和测试于 2026-08-20 复核；同日已验证 ShotMarker 公开页面，其余线上入口未在本次复核。

## 当前范围（实现事实）

- Hub：个人主页、作品列表和 Markdown 文章。
- Cardgame：回合制卡牌 Demo；在 Hub 中标记为暂停维护，独立页面仍保留。
- ShotMarker：产品介绍、帮助和隐私说明。
- Analytics：按项目、事件、时间范围和 PV/UV 口径查看逐日趋势。
- Backend：Cardgame HTTP/WebSocket 服务和 Track 只读趋势查询。

## ShotMarker 公开内容（实现事实）

- `/shotmarker/support`、`/shotmarker/privacy` 和 `/shotmarker/how-to` 于 2026-08-19 按 ShotMarker main / `41bfda2`（产品代码基线 `42c249a`）重新核对。
- 从公开仓库 revision `1da28f6` 起，`/shotmarker/` 与 `/shotmarker/how-to` 都渲染产品介绍和使用说明；`/shotmarker/support` 继续独立渲染支持页。
- 隐私页分别说明第一方产品 Analytics、Sentry SDK 到开发者自管 GlitchTip 的错误与崩溃上报，以及完整本地诊断日志；其中按 Sentry Cocoa 9.26.0 的发送前处理披露 SDK 技术上下文、独立安装范围标识和源 IP 保留未核验边界。支持页记录标题长按诊断导出和 App 内 iCloud 视频准备；使用说明记录持久化集锦任务和启动后中断恢复。
- 使用说明中的已完成任务截图来自仅含合成预览数据的临时模拟器，不含真实用户数据。
- 上述内容于 2026-08-19 从 revision `42d21e7` 发布，根入口于 2026-08-20 从 revision `1da28f6` 对齐；最近一次公网只读验证确认四个 ShotMarker 路由及页面引用资源均为 HTTP 200，根路径和 How-to 的生产 DOM 均为使用说明，独立 Support 与 Privacy 页面正常，浏览器控制台没有错误或警告。该验证不覆盖 App Store、TestFlight、真实 App Analytics 或 GlitchTip 上报链路。

## 组件边界（实现事实）

| 路径 | 职责 |
| --- | --- |
| `frontend/project/hub` | 主页、作品和文章 |
| `frontend/project/cardgame` | Cardgame 页面和 WebSocket 客户端 |
| `frontend/project/shotmarker` | ShotMarker 产品页面 |
| `frontend/project/analytics` | Track 趋势页面 |
| `frontend/common` | 共用设备标识和埋点发送 |
| `backend` | Cardgame 服务和 Track 趋势查询 |
| `automation/publish` | 交互式启动与发布入口 |

前端与后端分别维护依赖和锁文件，不是 npm workspace。

## 有效决定

- 公开代码、接口、测试和部署契约由本仓库维护。
- 服务器、网络、证书和实际生产配置由独立私有台账维护；公开仓库只保留理解公开契约所需的摘要。
- 跨仓库的同一项当前事实只保留一个权威来源，其他仓库只保留必要摘要或链接。
- 密码、私钥、Token 和 `.env` 实际值不进入文档仓库。
- Hub 文章属于产品内容，不进入项目文档的 Change 生命周期。
- ShotMarker 的默认产品入口是 `/shotmarker/`，并与 `/shotmarker/how-to` 渲染相同的产品介绍和使用说明；支持页固定保留在 `/shotmarker/support`。

详细入口见[根 README](../../README.md)。

## 当前主题

- [开发与质量](./development.md)
- [部署与生产边界](./deployment.md)
- [Track 埋点与趋势](./track.md)
- [Automation](./automation.md)
- [Backend](./backend.md)
