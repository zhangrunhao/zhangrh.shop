# 文档入口

`current` 说明当前事实和有效决定，`changes` 保存未结束的变更，`archive` 保存已结束的过程和材料。

`changes` 和 `archive` 使用扁平的 `YYYY-MM-DD-topic[-spec|-plan].md` 命名。

## 当前事实

- [项目与组件](./current/project.md)：产品范围、公开能力和组件边界。
- [开发与质量](./current/development.md)：运行环境、依赖、测试和完整检查。
- [部署与生产边界](./current/deployment.md)：发布契约、Track 运行边界和外部状态。

## 当前 Change

无。

## 参考文档

- [运行手册](../RUNBOOK.md)
- [部署说明](./deploy/README.md)
- [前端埋点说明](../frontend/docs/track.md)
- [Cardgame 规则与开发说明](../frontend/project/cardgame/README.md)
- [Hub 文章目录规则](../frontend/project/hub/content/articles/README.md)
- [发布自动化说明](../automation/README.md)

## 维护流程

1. 开始任务前阅读相关 current，并检查同主题 Change。
2. 从代码、测试、构建或当次外部验证确认事实。
3. 完成变更后先更新 current，再将 spec 和 plan 移入 archive。
4. 公开仓库与 `docs/private.local/` 分别检查、提交和推送。
