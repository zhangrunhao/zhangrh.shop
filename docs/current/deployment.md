# 部署与生产边界

本文同时记录公开部署契约和仓库发布实现。前端发布脚本于 2026-09-29 复核；实际服务器、网络、证书和生产配置仍由私有台账维护，本次未重新复核这些配置。

## 公开拓扑（有效决定）

| 路径 | 组件 |
| --- | --- |
| `/hub/` | Hub HTML |
| `/cardgame/` | Cardgame HTML |
| `/shotmarker/` | ShotMarker HTML |
| `/analytics/` | Analytics HTML |
| `/webtrace/` | WebTrace HTML；同一 SPA 提供 `/support` 与 `/privacy` 子路由 |
| `/track` | Nginx 接收 Track 并返回 `204` |
| `/api/track/trend` | Backend Track 查询 |
| `/api/cardgame/*` | Backend Cardgame HTTP/WebSocket |

JS、CSS、图片等 `static` 构建产物的公开地址为 `https://static.zhangrh.shop/zhangrh-shop/<project>/static/`。

## 目录契约（有效决定）

| 目录 | 用途 |
| --- | --- |
| `/opt/zhangrh-shop/site/<project>/` | 前端 HTML |
| `/opt/zhangrh-shop/backend/` | Backend 运行文件 |
| `/opt/zhangrh-shop/` | Compose 项目根目录 |

Track 的容器内读取路径见 [Backend](./backend.md)，文件模型和查询契约见 [Track 当前文档](./track.md)。Track 宿主机持久目录、具体宿主机权限、Compose、Nginx 和证书配置不在公开仓库维护。

## 当前发布实现

仓库脚本发布五个前端和一个 Backend：

- 根 `npm run publish` 通过 [Automation](./automation.md) 选择目标。
- 前端发布先拉取 Git、构建目标项目、上传 OSS 静态资源、改写 HTML 资源地址，再通过 SSH/rsync 发布 HTML。
- Backend 发布只同步受控运行文件，并从部署根目录重建 `backend` 服务；详细边界见 [Backend](./backend.md)。
- 前端发布需要本地 SSH、rsync、`OSS_ACCESS_KEY_ID` 和 `OSS_ACCESS_KEY_SECRET`。
- Backend 重建可能中断请求，并清空 Cardgame 内存状态。
- 发布脚本不执行整栈停服，不修改生产 Compose、Nginx、证书、Track 数据或日志策略，不删除生产数据。

## 变更与验证边界（有效决定）

- 不含敏感信息的发布过程、公开页面和接口验证、产品验收结果由本仓库记录；具体服务器、网络、证书、生产配置和备份细节由私有台账记录。线上验证本身不是私有分类依据。
- 公开入口、Cardgame health 和 Track 查询可以使用 GET/HEAD 做只读验证。
- Track 写入验证会产生真实事件，只有在对应 Change 明确授权时执行。
- 生产配置或存储迁移必须在私有仓库建立 Change，完成预检、授权、实施和验证。

## 外部状态（带日期事实）

- 2026-10-19，WebTrace 1.1.0 已在 Chrome 应用商店公开上架；官网与 Hub 的公开 revision `f4e7225` 经各自正常发布流程上线。三个 WebTrace 入口、Hub 首页与作品列表，以及 9 个静态资源均通过公网读取并与本地生产产物逐字节一致。首页商店安装按钮、支持页安装步骤与升级提示、Hub 已上架文案已发布；隐私政策内容与更新日期未改。详情及浏览器验证边界见[发布记录](../archive/2026-10/2026-10-19-webtrace-store-release.md)。
- 2026-10-18，Hub 文档治理文章 100004（公开 revision `92bc2e8`）已发布。首页、文章列表和文章详情的公网 HTML，以及 5 个静态资源，均返回 HTTP 200 并与本地构建产物逐字节一致。详情见[发布记录](../archive/2026-10/2026-10-18-hub-document-governance-article-release.md)。
- 2026-09-29，WebTrace 与 Hub 均通过各自的 `npm --prefix frontend run publish -- <project>` 完成 Git 同步、生产构建、OSS 静态资源上传和 SSH/rsync HTML 发布。公网读取三个 WebTrace 页面、Hub 首页与作品列表及 9 个静态资源，均为 HTTP 200，内容与本地发布产物逐字节一致；新版趋势文案、中英隐私政策、截图和 Hub 介绍已生效。
- 同日使用隔离 Playwright Chromium `151.0.7922.34` 在 1280×800 和 390×844 视口验证上述五个页面，新文案、政策更新日期、截图、标题与链接正确，无横向溢出、图片加载失败、控制台错误或警告。Hub Track 请求被浏览器拦截并模拟 `204`，未写入生产事件，本次未验证生产 Track 接收端。网络超时与身份认证错误的排查顺序见[运行手册](../../RUNBOOK.md#ssh-连接超时)。
- 私有台账记录的 Track 四字段生产切换与验收日期为 2026-08-16。
- 2026-09-29，ShotMarker 通过 `npm --prefix frontend run publish -- shotmarker` 完成 Git 同步、构建、8 个 OSS 静态资源上传和 HTML 发布；只发布该前端，没有修改生产基础设施或写入 Track 数据。四个页面和全部 8 个静态资源经公网 GET 确认为 HTTP 200，且与本地产物逐字节一致；Chrome 中确认首页、支持和隐私页显示 1.3 文案。使用旧 HTML 缓存的首页在强制刷新后更新。官网配图仍是已标注的旧版示意，未替换为 1.3 截图。详情见[发布记录](../archive/2026-09/2026-09-29-shotmarker-content-release.md)。
- 2026-08-20，Hub 的 ShotMarker 作品卡已改为产品名称与产品用途描述，并链接 `/shotmarker/`；`/hub/`、当次 JS/CSS、封面和图标均为 HTTP 200，390×844 视口无横向溢出且浏览器控制台无错误或警告。详情见[发布记录](../archive/2026-08/2026-08-20-hub-shotmarker-card-release.md)。
- 其余线上入口、生产配置、App Store 和 TestFlight 未在本次发布中重新验证。
- 真实 Release/TestFlight ShotMarker 事件上报仍未确认。

操作命令和错误处置见[运行手册](../../RUNBOOK.md)。历史四字段设计见[归档](../archive/2026-08/2026-08-16-track-four-field-trend-redesign-spec.md)。
