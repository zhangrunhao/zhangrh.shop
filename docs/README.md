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

无。

## 参考文档

- [运行手册](../RUNBOOK.md)
- [Cardgame 规则与开发说明](../frontend/project/cardgame/README.md)
- [Hub 文章目录规则](../frontend/project/hub/content/articles/README.md)

## 维护流程

1. 开始任务前阅读相关 current，并检查同主题 Change。
2. 从代码、测试、构建或当次外部验证确认实现事实；从 current 确认仍然有效的决定、契约和政策。
3. 实现与有效决定冲突时，在 current 同时记录决定与实现差距，并将差距作为缺陷处理。
4. 完成变更后先更新 current，再将已有 spec 和 plan 移入对应的 `archive/YYYY-MM/`。
5. 公开仓库与 `docs/private.local/` 分别检查、提交和推送。
