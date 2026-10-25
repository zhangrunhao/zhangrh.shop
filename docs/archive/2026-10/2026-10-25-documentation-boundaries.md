# 文档边界调整

- 日期：2026-10-25
- 状态：已完成

## 决定与范围

用户确认按内容敏感性决定存放位置：普通产品发布、线上验证和验收结论由正常项目仓库维护；服务器资产、网络、证书、具体生产配置和备份细节保留私有。每项事实只保留一个权威来源。

本次从私有台账迁入三份历史记录：

- [CardGame 路由前置验证](../2026-07/2026-07-29-cardgame-portfolio-routing.md)
- [项目整理生产盘点](../2026-07/2026-07-29-project-cleanup.md)
- [Analytics 数值验收输入](../2026-08/2026-08-17-analytics-native-svg-values.md)

以下三份已有更完整的公开记录，删除私有重复副本，并将私有入口改为公开链接：

- [ShotMarker 公开页面发布](../2026-08/2026-08-19-shotmarker-public-content-release.md)
- [ShotMarker 根入口对齐发布](../2026-08/2026-08-20-shotmarker-root-how-to-release.md)
- [Hub ShotMarker 作品卡发布](../2026-08/2026-08-20-hub-shotmarker-card-release.md)

私有服务器台账中的重复产品验收细节改为必要链接；生产实例的配置与运维记录继续保留私有。同步更新仓库规则、文档入口和[部署边界](../../current/deployment.md)。

## 验证与边界

- Node.js v24.7.0 下 `npm test` 通过：Automation 9 项、Frontend 183 项、Backend 20 项，共 212 项、0 失败。
- 链接检查覆盖 9 份变更文档、61 个本地链接及对应公开仓库目标和标题锚点；全部通过。
- 正常仓库与私有台账的相关差异通过 `git diff --check`；公开 current 文档均低于 300 行。
- 保留所有历史记录的原验证日期。本次仅调整文档归属，没有重新发布产品、复验线上状态或执行基础设施操作。
