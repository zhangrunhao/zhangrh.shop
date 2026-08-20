# 部署与生产边界

本文同时记录公开部署契约和仓库发布实现。脚本于 2026-08-20 复核，并于 2026-08-19、2026-08-20 用于发布和只读验证 ShotMarker；实际服务器、网络、证书和生产配置仍由私有台账维护，本次未重新复核这些配置。

## 公开拓扑（有效决定）

| 路径 | 组件 |
| --- | --- |
| `/hub/` | Hub HTML |
| `/cardgame/` | Cardgame HTML |
| `/shotmarker/` | ShotMarker HTML |
| `/analytics/` | Analytics HTML |
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

仓库脚本发布四个前端和一个 Backend：

- 根 `npm run publish` 通过 [Automation](./automation.md) 选择目标。
- 前端发布先拉取 Git、构建目标项目、上传 OSS 静态资源、改写 HTML 资源地址，再通过 SSH/rsync 发布 HTML。
- Backend 发布只同步受控运行文件，并从部署根目录重建 `backend` 服务；详细边界见 [Backend](./backend.md)。
- 前端发布需要本地 SSH、rsync、`OSS_ACCESS_KEY_ID` 和 `OSS_ACCESS_KEY_SECRET`。
- Backend 重建可能中断请求，并清空 Cardgame 内存状态。
- 发布脚本不执行整栈停服，不修改生产 Compose、Nginx、证书、Track 数据或日志策略，不删除生产数据。

## 变更与验证边界（有效决定）

- 公开入口、Cardgame health 和 Track 查询可以使用 GET/HEAD 做只读验证。
- Track 写入验证会产生真实事件，只有在对应 Change 明确授权时执行。
- 生产配置或存储迁移必须在私有仓库建立 Change，完成预检、授权、实施和验证。

## 外部状态（带日期事实）

- 私有台账记录的 Track 四字段生产切换与验收日期为 2026-08-16。
- 2026-08-19，`/shotmarker/`、`/shotmarker/privacy`、`/shotmarker/support`、`/shotmarker/how-to` 及当次 HTML 引用的 JS、CSS 和已完成任务截图经公网只读验证为 HTTP 200。
- 2026-08-20，`/shotmarker/` 已对齐为与 `/shotmarker/how-to` 相同的使用说明；独立 Support 和 Privacy 路由保持正常，四个路由在 390×844 视口均无横向溢出且浏览器控制台无错误或警告。
- 其余线上入口、生产配置、App Store 和 TestFlight 未在本次发布中重新验证。
- 真实 Release/TestFlight ShotMarker 事件上报仍未确认。

操作命令和错误处置见[运行手册](../../RUNBOOK.md)。历史四字段设计见[归档](../archive/2026-08/2026-08-16-track-four-field-trend-redesign-spec.md)。
