# 部署与生产边界

仓库脚本发布四个前端和一个 Backend。脚本维护公开发布契约，不维护实际服务器、网络、证书或生产配置。

## 发布契约

- 前端 HTML 通过 SSH/rsync 发布，静态资源发布到 OSS。
- Backend 运行文件通过 SSH/rsync 发布，并从部署根目录重建 `backend` 服务。
- 生产 Compose、Nginx、Track 数据目录和证书由私有基础设施维护。
- 发布脚本不会执行生产停服、数据删除或基础设施迁移。

## Track 当前契约

- 浏览器发送 `project`、`event` 和 `device_id`；Nginx 生成服务器 `time`。
- Nginx 向单一 `events.jsonl` 追加四字段记录，不自动轮转、压缩或删除。
- Backend 只读当前文件，通过 `/api/track/trend` 返回单事件逐日 PV/UV。
- 文件达到 `32 MiB` 时重新评估存储方案；Backend 的读取上限为 `64 MiB`。

## 外部状态

- 私有台账记录的最近生产切换与验收日期为 2026-08-16。
- 本次文档迁移没有重新验证线上入口、生产配置、App Store 或 TestFlight。
- 真实 Release/TestFlight ShotMarker 事件上报仍标为未确认。

## 参考

- [运行与发布手册](../../RUNBOOK.md)
- [部署结构和只读验证](../deploy/README.md)
- [前端埋点说明](../../frontend/docs/track.md)
- [四字段 Track 历史设计与执行记录](../archive/2026-08-16-track-four-field-trend-redesign-spec.md)
