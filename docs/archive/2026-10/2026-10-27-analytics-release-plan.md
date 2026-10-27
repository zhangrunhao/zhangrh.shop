# ShotMarker 埋点网站发布

## 已确认范围

用户于 2026-10-27 明确授权将 App 和网站改动提交、合并 main 并发布。本记录负责网站 Backend、Nginx 接收格式、Analytics 与 ShotMarker 隐私页面；不发布其他前端，不修改业务数据或安全组。App 发布由 ShotMarker 仓库记录。

## 步骤

- [x] 核对工作区与远端，保留所有用户改动；完成 Node 24 检查。
- [x] 提交功能变更、合并 main、推送远端。
- [x] 同步私有台账，读取当前生产配置，确认 Cardgame 无活动房间，建立针对性回滚备份。
- [x] 部署兼容新旧记录的 Backend，只扩展现有 Nginx Track 日志字段，配置检查成功后平滑重载。
- [x] 按现有脚本发布 Analytics 和 ShotMarker 前端。
- [x] 只读验证公开页面/资产与构建一致、健康与新旧查询接口。接收格式使用隔离临时日志验收，不向生产 Track 写入虚构用户事件。
- [x] 更新 current 与脱敏结果，归档本记录，公开与私有仓库分别提交、推送。

## 边界

保留单一 JSONL、历史四字段、当前权限和挂载。新增字段没有历史回填。生产配置备份及具体操作位置由私有台账维护。服务器可用与查询通过不代表真实 App Store/TestFlight 手机已经完成端到端验收。


## 发布结果（2026-10-27）

- 功能提交 `05e178b` 已 fast-forward 合并并推送 main。原 main 干净，没有覆盖用户未提交内容。
- 本轮 Node.js v24.19.0 的 `npm run check` 完整通过：根 9、前端 188、后端 25，共 222 项；前端 lint、TypeScript、五站生产构建通过。此次仅发布 Backend、Analytics、ShotMarker，没有发布其他前端。
- 发布前 Cardgame 房间列表为空；按既有脚本重建 Backend。其三个 Track 模块与 `05e178b` 本地文件 SHA-256 一致；生产 Node.js 为 v24.22.1，健康接口为 200/ok。
- 接收端只扩展现有 log_format，其余路由、Compose、证书、挂载和权限未改；配置检查通过后平滑重载。Backend 保持只读 Track 挂载，Nginx 保持写入挂载，目录及文件权限保持原值。针对性回滚配置、HTML 与 Backend 镜像备份由私有台账记录。
- 在生产容器内部启动仅监听回环地址的隔离 Nginx，复制实际部署的 log_format 并写临时日志；旧网页与新 ShotMarker 样例均为 11 个字符串字段，旧扩展为空、新字段符合预期。隔离进程已停止，没有向生产 events.jsonl 写入虚构用户事件。
- `/analytics/`、ShotMarker 首页、how-to、support、privacy 共 5 个页面均 HTTP 200，响应与本地发布 HTML 逐字节一致；Analytics 3 与 ShotMarker 8 个静态资源均 HTTP 200 且逐字节一致。
- `/api/track/shotmarker?days=30&audience=production` 为 200，三流程全零；旧趋势 90 天 app_launch 共 83 条，unknown 筛选同为 83。历史无来源记录没有被回填为正式使用。
- 本轮浏览器初始化超时，未将该尝试计为生产浏览器验收；HTTP、API 和资产一致性均独立完成。此前本地浏览器验证不替代真实分发端到端。
- 真实 App Store/TestFlight 来源分类、手机到生产接收完整链路、App 上传/审核状态由 ShotMarker 仓库另行记录。新步骤零值不证明无人使用或没有错误，也不扩大为发布后的持续观测结论。
