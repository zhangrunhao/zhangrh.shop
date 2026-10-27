# 文档入口

`current` 说明当前事实和有效决定，`changes` 保存已生成且尚未结束的变更材料，`archive` 保存已结束的过程和材料。

`changes` 使用扁平的 `YYYY-MM-DD-topic[-spec|-plan].md`；`archive` 使用 `YYYY-MM/YYYY-MM-DD-topic[-spec|-plan].md`，月份必须与文件日期一致。

## 当前事实与决定

- [项目与组件](./current/project.md)：产品范围、公开能力和组件边界。
- [开发与质量](./current/development.md)：运行环境、依赖、测试和完整检查。
- [部署与生产边界](./current/deployment.md)：公开拓扑、目标目录、发布副作用和外部状态。
- [Track 埋点与趋势](./current/track.md)：客户端协议、事件目录、存储和查询契约。
- [Automation](./current/automation.md)：根开发与发布入口、目标发现和委托边界。
- [Backend](./current/backend.md)：运行时、路由、状态、测试和发布边界。

## 当前 Change

- [ShotMarker 埋点发布](./changes/2026-10-27-analytics-release-plan.md)：用户已授权提交、合并及发布，正在执行。

## 参考文档

- [运行手册](../RUNBOOK.md)
- [Cardgame 规则与开发说明](../frontend/project/cardgame/README.md)
- [Hub 文章目录规则](../frontend/project/hub/content/articles/README.md)

## 资料边界

产品、代码、测试，以及不含敏感信息的发布记录、线上验证和验收结果由本仓库维护。服务器资产、网络、证书、具体生产配置和备份细节保留在私有基础设施台账。是否私有由内容决定，不因验证发生在线上或生产环境而一律私有。

历史验证只对应记录中的日期；迁移文档不表示重新验收。以下记录由本仓库作为唯一权威来源：

- [ShotMarker 埋点增强与验证](./archive/2026-10/2026-10-27-analytics-steps-plan.md)
- [CardGame 路由前置验证](./archive/2026-07/2026-07-29-cardgame-portfolio-routing.md)
- [项目整理生产盘点](./archive/2026-07/2026-07-29-project-cleanup.md)
- [Analytics 数值验收输入](./archive/2026-08/2026-08-17-analytics-native-svg-values.md)
- [ShotMarker 公开页面发布](./archive/2026-08/2026-08-19-shotmarker-public-content-release.md)
- [ShotMarker 根入口对齐发布](./archive/2026-08/2026-08-20-shotmarker-root-how-to-release.md)
- [Hub ShotMarker 作品卡发布](./archive/2026-08/2026-08-20-hub-shotmarker-card-release.md)

本次迁移范围与检查结果见 [2026-10-25 文档边界调整](./archive/2026-10/2026-10-25-documentation-boundaries.md)。

## 维护流程

1. 开始任务前阅读相关 current，并检查同主题 Change。
2. 从代码、测试、构建或当次外部验证确认实现事实；从 current 确认仍然有效的决定、契约和政策。
3. 实现与有效决定冲突时，在 current 同时记录决定与实现差距，并将差距作为缺陷处理。
4. 完成变更后先更新 current，再将已有 spec 和 plan 移入对应的 `archive/YYYY-MM/`。
5. 公开仓库与 `docs/private.local/` 分别检查、提交和推送。
