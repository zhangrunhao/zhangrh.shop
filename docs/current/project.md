# 项目与组件

`zhangrh.shop` 是个人主页与独立项目的公开代码仓库，包含五个 Vite 前端和一个 Node/Express 后端。WebTrace 1.1.0 于 2026-10-19 核验已在 Chrome 应用商店公开上架，官网内容已补充商店安装入口；官网实际部署验证见[部署与生产边界](./deployment.md)。ShotMarker 1.3 的公开文案最近发布于 2026-09-29。

## 当前范围（实现事实）

- Hub：个人主页、作品列表和 Markdown 文章；ShotMarker 与 WebTrace 作品卡以产品名和产品用途介绍产品，并链接各自默认产品入口。
- Cardgame：回合制卡牌 Demo；在 Hub 中标记为暂停维护，独立页面仍保留。
- ShotMarker：产品介绍、帮助和隐私说明。
- Analytics：按项目、事件、时间范围和 PV/UV 口径查看逐日趋势。
- WebTrace：网站时间追踪器的产品介绍、使用支持和中英双语隐私政策。
- Backend：Cardgame HTTP/WebSocket 服务和 Track 只读趋势、ShotMarker 步骤查询。

## WebTrace 公开内容（实现事实）

- 2026-10-19，通过商店公开页面核验 WebTrace 1.1.0 已上架并可添加至 Chrome。首页主要按钮和支持页链接[Chrome 应用商店](https://chromewebstore.google.com/detail/webtrace/efpighgeknabppbmfjpkfmebmnmckpgj)，Hub 作品卡同步显示已上架；支持页说明从 TimeTracker 1.0.0 升级不自动迁移旧汇总记录，需重新配置统计网站。支持页更新日期为 2026-10-19，隐私政策日期和内容保持不变。
- 从公开仓库 revision `0c83897` 起，`/webtrace/`、`/webtrace/support/` 和 `/webtrace/privacy/` 分别提供产品与使用说明、问题排查和中英双语隐私政策；未知产品内路径在 SPA 内显示 WebTrace 自己的 404。无尾斜杠的支持和隐私地址由生产服务器规范化到对应目录地址。
- 首页明确说明 WebTrace 只记录用户主动配置的网站名称和可注册主域名、打开与结束时间、有效观看区间和时长，并且数据只保存在当前 Chrome 配置文件中，不上传、不出售、不用于广告或与第三方共享。
- 隐私政策说明用途、`chrome.storage.local`、`chrome.storage.session`、IndexedDB、默认长期保留、按网站永久删除历史、卸载删除、权限理由和 Chrome Web Store Limited Use 规则；完整 URL 只在内存中用于解析主机名，不持久化路径、查询或页面内容。
- 首页、支持页、隐私政策和 Hub 作品卡说明次数与时长同图展示、默认最近 14 天、可按周回看更早记录；支持页补充前后周按钮、回到最新、悬停整条指标与每日数值高亮，以及完整日期浮层。
- 中英隐私政策的用途和保留章节均明确历史查询与展示窗口不会删除记录；原生效日期保持 2026-09-03，最后更新为 2026-09-29。此次只同步展示说明，采集、权限、存储、保留、删除和不共享范围未改变。
- WebTrace 官网不调用 Backend 或 Track，不提供账号、表单提交、远程字体、远程脚本或第三方嵌入。
- 首页图标来自 WebTrace 扩展已确认的 128×128 品牌图标；产品图于 2026-09-29 使用扩展当前双线图和周切换界面更新，来自隔离 Chromium 和纯合成数据。
- 2026-09-29 发布后，三个 WebTrace 页面、Hub 首页与作品列表及 9 个静态资源均返回 HTTP 200，内容与本地发布产物逐字节一致。隔离 Chromium `151.0.7922.34` 在 1280×800 与 390×844 视口验证新文案、政策更新日期、截图、标题与链接，无横向溢出、图片加载失败或控制台错误、警告；Hub 的 Track 请求在浏览器中拦截并模拟响应，未写入生产事件。发布范围见[部署与生产边界](./deployment.md)。
- 从公开仓库 revision `83187cb` 起，Hub 首页精选与作品列表均展示 WebTrace `Active` 卡片，排在 ShotMarker 之后、暂停维护的 CardGame 之前，链接稳定产品入口 `/webtrace/`；封面复用 WebTrace 已确认的高清品牌宣传图，不含真实用户数据。

## ShotMarker 公开内容（实现事实）

- `/shotmarker/` 与 `/shotmarker/how-to` 都渲染产品介绍和使用说明；`/shotmarker/support` 与 `/shotmarker/privacy` 分别提供独立支持和中英隐私页面。初始 HTML 的默认标题和描述与使用说明一致，客户端按具体路由更新元数据。
- 2026-09-29 按 ShotMarker 1.3 当前代码同步公开文案：从训练选择视频与默认时长、调整序数样式，到保存可编辑任务、逐片段预览和调整范围、确认保留或排除、生成和保存成片。
- 使用说明与支持 FAQ 明确生成需保持前台；进入后台会停止排队及运行中的生成，之后需手动重新生成。停止、失败或编辑保留任务及已有成片，重新生成成功后才替换；“当前成片不包含最新修改”说明旧成片尚未包含编辑结果。
- 首页显著提示 1.3 首次升级会清理旧的 App 本地数据且不自动迁移，建议提前将需要保留的成片保存到系统相册。支持和中英隐私页同步清理范围，并区分不受影响的系统照片库、HealthKit 和 App 外导出文件，以及之后正常保留的新数据。页面说明具体可用版本以 App Store 为准。
- 隐私页继续区分第一方产品 Analytics、Sentry Cocoa 9.26.0 到开发者自管 GlitchTip 的精简错误与崩溃上报，以及主动分享的完整本地诊断日志；保留 SDK 技术上下文、独立安装范围标识和源 IP 保留未核验边界。本地政策新增来源、自用、版本及步骤字段披露，最后更新为 2026-10-27，原生效日期保持 2026-08-19；本次扩展尚未部署，2026-09-29 仍是下述既有发布验证基线。
- 官网配图仍是旧版基础操作示意，页面已显著标注；尚未替换为 1.3 截图。已完成任务截图来自仅含合成预览数据的临时模拟器。
- Hub 的作品卡使用名称 `ShotMarker`、描述“训练时用 Apple Watch 给精彩投篮打点，结束后在 iPhone 上把训练视频整理成集锦。”，并链接默认产品入口。
- 2026-09-29 发布后，四个 ShotMarker 路由和全部 8 个静态资源均返回 HTTP 200，内容与本地发布产物逐字节一致；Chrome 确认首页、支持和隐私页的新文案。桌面及 390×844 本地预览核对了排版；本次不包含 App 实机功能或生产上报链路验证。详情见[发布记录](../archive/2026-09/2026-09-29-shotmarker-content-release.md)。

## 组件边界（实现事实）

| 路径 | 职责 |
| --- | --- |
| `frontend/project/hub` | 主页、作品和文章 |
| `frontend/project/cardgame` | Cardgame 页面和 WebSocket 客户端 |
| `frontend/project/shotmarker` | ShotMarker 产品页面 |
| `frontend/project/analytics` | Track 趋势与 ShotMarker 来源/步骤页面 |
| `frontend/project/webtrace` | WebTrace 产品、支持与隐私页面 |
| `frontend/common` | 共用设备标识和埋点发送 |
| `backend` | Cardgame 服务和 Track 只读聚合查询 |
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
- Hub 的 WebTrace 作品卡表示完整产品，文案聚焦本机统计、按周回看的 14 天双线趋势与访问明细，并链接默认产品入口 `/webtrace/`。
- WebTrace 的稳定公开入口为 `/webtrace/`，支持和隐私政策固定保留在 `/webtrace/support` 与 `/webtrace/privacy`；官网不新增 Track 数据采集。

详细入口见[根 README](../../README.md)。

## 当前主题

- [开发与质量](./development.md)
- [部署与生产边界](./deployment.md)
- [Track 埋点与趋势](./track.md)
- [Automation](./automation.md)
- [Backend](./backend.md)
