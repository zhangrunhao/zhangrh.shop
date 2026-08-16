# Track 单一 JSONL 存储设计

## 状态与范围

本设计于 2026-08-16 确认并生效，仅取代 2026-08-15 Track 设计中的专用 logrotate、自动轮转和约三个月保留策略。`/track` 的 schema v1 写入、Backend 只读聚合、公开查询接口及其资源保护保持不变。

## 决策

- Nginx 持续追加 `/var/log/nginx/track/events.jsonl`。
- 不配置 Track 专用 logrotate，不自动轮转、压缩或删除 Track 数据。
- 已存在的历史 `.gz` 文件不删除；Backend 保持兼容读取，以免丢失已有数据。
- Nginx 对 Track 目录保持读写挂载，Backend 对同一目录保持只读挂载。
- 不修改前端协议、Nginx Track 格式、Compose 挂载或 Backend 代码。
- `events.jsonl` 达到 `32 MiB` 时重新评估轮转、归档或数据库方案，并在 Backend 的 `64 MiB` 总解码上限前完成调整。

## 权限说明

宿主机 Track 目录当前为 `0751 root:root`，当前文件为 `0640 uid=101 gid=0`。`101` 是 Nginx 容器 worker 的数字 UID；bind mount 在宿主机只显示同一个数字，不表示同名宿主机服务负责写入。移除 logrotate 不改变这套权限，也不需要为 UID/GID 增加额外处理。

## 接受的取舍

当前日志量很小，主动引入轮转、压缩、重开文件和权限协作的维护成本高于收益。因此本阶段明确接受：

- 数据没有自动过期时间；
- 单文件会持续增长；
- 容量检查依赖低频人工运维；
- 达到阈值前不承诺长期保留窗口。

这些是有意识的简化，不是遗漏。若增长速度、查询延迟或保留要求发生变化，应重新设计，而不是直接恢复旧规则。

## 部署与回滚

服务器上的 `/etc/logrotate.d/zhangrh-track` 已移出活动目录，备份为：

```text
/root/zhangrh-track-backup-20260815-213510/zhangrh-track.disabled-20260816
```

备份文件 SHA-256 为：

```text
40c4bba76930be2c04ce91c7a810022c4a2abaf8baa2b48e02f9286bef7acac8
```

该操作不需要重建或重启 Nginx、Backend，也不影响系统全局 `logrotate.timer`。若未来经过重新设计决定恢复，先复核权限、信号和保留需求，再把备份恢复到精确活动路径；不能顺带删除当前 JSONL 或历史 gzip。

## 验收标准

- `/etc/logrotate.d/zhangrh-track` 不存在，系统 logrotate debug 检查不再包含 Track 路径。
- 全局 `logrotate.timer` 仍为 enabled/active。
- 当前 `events.jsonl` 与历史 gzip 的 inode、大小和内容不因停用规则而改变。
- Nginx 配置检查通过，`/track` 继续返回 `204` 并能追加 JSONL。
- `/api/track/summary` 继续读取当前文件和已有历史 gzip。
- Cardgame 健康检查及既有站点入口保持正常。
