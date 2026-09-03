# 项目与组件

`zhangrh.shop` 是个人主页与独立项目的公开代码仓库，包含五个 Vite 前端和一个 Node/Express 后端。代码、构建配置和测试于 2026-09-03 复核；同日已发布并验证 WebTrace 的三个公开页面。

## 当前范围（实现事实）

- Hub：个人主页、作品列表和 Markdown 文章；ShotMarker 与 WebTrace 作品卡以产品名和产品用途介绍产品，并链接各自默认产品入口。
- Cardgame：回合制卡牌 Demo；在 Hub 中标记为暂停维护，独立页面仍保留。
- ShotMarker：产品介绍、帮助和隐私说明。
- Analytics：按项目、事件、时间范围和 PV/UV 口径查看逐日趋势。
- WebTrace：网站时间追踪器的产品介绍、使用支持和中英双语隐私政策。
- Backend：Cardgame HTTP/WebSocket 服务和 Track 只读趋势查询。

## WebTrace 公开内容（实现事实）

- 从公开仓库 revision `0c83897` 起，`/webtrace/`、`/webtrace/support/` 和 `/webtrace/privacy/` 分别提供产品与使用说明、问题排查和中英双语隐私政策；未知产品内路径在 SPA 内显示 WebTrace 自己的 404。无尾斜杠的支持和隐私地址由生产服务器规范化到对应目录地址。
- 首页明确说明 WebTrace 只记录用户主动配置的网站名称和可注册主域名、打开与结束时间、有效观看区间和时长，并且数据只保存在当前 Chrome 配置文件中，不上传、不出售、不用于广告或与第三方共享。
- 隐私政策说明用途、`chrome.storage.local`、`chrome.storage.session`、IndexedDB、默认长期保留、按网站永久删除历史、卸载删除、权限理由和 Chrome Web Store Limited Use 规则；完整 URL 只在内存中用于解析主机名，不持久化路径、查询或页面内容。
- WebTrace 官网不调用 Backend 或 Track，不提供账号、表单提交、远程字体、远程脚本或第三方嵌入。
- 首页图标来自 WebTrace 扩展已确认的 128×128 品牌图标；产品图使用隔离 Chromium 中的扩展界面和纯合成数据。
- Hub 首页精选与作品列表均展示 WebTrace `Active` 卡片，排在 ShotMarker 之后、暂停维护的 CardGame 之前，链接稳定产品入口 `/webtrace/`；封面复用 WebTrace 已确认的高清品牌宣传图，不含真实用户数据。
- 2026-09-03 本地生产预览在 1280×800 与 390×844 视口完成首页、支持页、隐私页、404、浅色和深色检查；公网随后验证三个页面及其 JS、CSS、图标和合成截图均为 HTTP 200，生产 DOM 无横向溢出，控制台无错误或警告。

## ShotMarker 公开内容（实现事实）

- `/shotmarker/support`、`/shotmarker/privacy` 和 `/shotmarker/how-to` 于 2026-08-19 按 ShotMarker main / `41bfda2`（产品代码基线 `42c249a`）重新核对。
- 从公开仓库 revision `1da28f6` 起，`/shotmarker/` 与 `/shotmarker/how-to` 都渲染产品介绍和使用说明；`/shotmarker/support` 继续独立渲染支持页。
- 从 revision `0f2b584` 起，ShotMarker 初始 HTML 的默认标题和描述也与 How-to 一致；客户端挂载后仍按具体路由更新元数据。
- 从 revision `ecd758c` 起，Hub 的作品卡使用名称 `ShotMarker`、描述“训练时用 Apple Watch 给精彩投篮打点，结束后在 iPhone 上把训练视频整理成集锦。”，并链接 `https://zhangrh.shop/shotmarker/`。
- 隐私页分别说明第一方产品 Analytics、Sentry SDK 到开发者自管 GlitchTip 的错误与崩溃上报，以及完整本地诊断日志；其中按 Sentry Cocoa 9.26.0 的发送前处理披露 SDK 技术上下文、独立安装范围标识和源 IP 保留未核验边界。支持页记录标题长按诊断导出和 App 内 iCloud 视频准备；使用说明记录持久化集锦任务和启动后中断恢复。
- 使用说明中的已完成任务截图来自仅含合成预览数据的临时模拟器，不含真实用户数据。
- 上述内容于 2026-08-19 从 revision `42d21e7` 发布，根入口路由在 2026-08-20 从 revision `1da28f6` 起对齐，默认 HTML 元数据随后从 revision `0f2b584` 起对齐并重新发布；最近一次公网只读验证确认四个 ShotMarker 路由及页面引用资源均为 HTTP 200，根路径原始 HTML 和生产 DOM 均指向使用说明，独立 Support 与 Privacy 页面正常，浏览器控制台没有错误或警告。该验证不覆盖 App Store、TestFlight、真实 App Analytics 或 GlitchTip 上报链路。

## 组件边界（实现事实）

| 路径 | 职责 |
| --- | --- |
| `frontend/project/hub` | 主页、作品和文章 |
| `frontend/project/cardgame` | Cardgame 页面和 WebSocket 客户端 |
| `frontend/project/shotmarker` | ShotMarker 产品页面 |
| `frontend/project/analytics` | Track 趋势页面 |
| `frontend/project/webtrace` | WebTrace 产品、支持与隐私页面 |
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
- Hub 的 ShotMarker 作品卡表示完整产品，不以 Support 命名或只描述支持与隐私页面，并链接默认产品入口。
- Hub 的 WebTrace 作品卡表示完整产品，文案聚焦本机统计与最近 14 天趋势，并链接默认产品入口 `/webtrace/`。
- WebTrace 的稳定公开入口为 `/webtrace/`，支持和隐私政策固定保留在 `/webtrace/support` 与 `/webtrace/privacy`；官网不新增 Track 数据采集。

详细入口见[根 README](../../README.md)。

## 当前主题

- [开发与质量](./development.md)
- [部署与生产边界](./deployment.md)
- [Track 埋点与趋势](./track.md)
- [Automation](./automation.md)
- [Backend](./backend.md)
