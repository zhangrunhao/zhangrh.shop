# Track 单一 JSONL 存储设计

> **状态更新（2026-08-16）：** 本文已被[四字段埋点与单事件趋势重构设计](./2026-08-16-track-four-field-trend-redesign-spec.md)取代，仅保留历史记录。历史 gzip 保留和旧 reader 兼容等内容不再代表当前实现。

## 状态与范围

本设计于 2026-08-16 确认并生效，仅取代 2026-08-15 Track 设计中的专用 logrotate、自动轮转和约三个月保留策略。`/track` 的 schema v1 写入、Backend 只读聚合、公开查询接口及其资源保护保持不变。

## 决策

- Nginx 持续追加 `/var/log/nginx/track/events.jsonl`。
- 不配置 Track 专用 logrotate，不自动轮转、压缩或删除 Track 数据。
- 已存在的历史 `.gz` 文件不删除；Backend 保持兼容读取，以免丢失已有数据。
- Nginx 对 Track 目录保持读写挂载，Backend 对同一目录保持只读挂载。
- 不修改前端协议、Nginx Track 格式、Compose 挂载或 Backend 代码。
- `events.jsonl` 达到 `32 MiB` 时重新评估轮转、归档或数据库方案，并在 Backend 的 `64 MiB` 总解码上限前完成调整。

## 权限边界

Nginx 必须能够追加 Track 文件，Backend 只读。宿主机所有权、权限实值和验证记录由私有台账维护。

## 接受的取舍

当前日志量很小，主动引入轮转、压缩、重开文件和权限协作的维护成本高于收益。因此本阶段明确接受：

- 数据没有自动过期时间；
- 单文件会持续增长；
- 容量检查依赖低频人工运维；
- 达到阈值前不承诺长期保留窗口。

这些是有意识的简化，不是遗漏。若增长速度、查询延迟或保留要求发生变化，应重新设计，而不是直接恢复旧规则。

## 部署与回滚

生产启用结果、备份位置和校验值由私有台账维护。该变更不要求重建或重启 Nginx、Backend，也不影响系统全局 `logrotate.timer`。若未来决定恢复专用轮转，必须先复核权限、信号和保留需求，且不得删除当前 JSONL 或历史 gzip。

## 验收标准

- Track 专用 logrotate 规则未启用，系统 logrotate debug 检查不再包含 Track 路径。
- 全局 `logrotate.timer` 仍为 enabled/active。
- 当前 `events.jsonl` 与历史 gzip 的 inode、大小和内容不因停用规则而改变。
- Nginx 配置检查通过，`/track` 继续返回 `204` 并能追加 JSONL。
- `/api/track/summary` 继续读取当前文件和已有历史 gzip。
- Cardgame 健康检查及既有站点入口保持正常。
