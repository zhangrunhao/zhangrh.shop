# 私有项目台账存储设计

## 目标

以最低复杂度保存当前基础设施台账，使本地 Agent 可以直接读取，同时通过私有 Git 获得版本历史和异地备份。

## 存储边界

- 1Password 继续保存密码、SSH 私钥、AccessKey、API Token 和数据库凭据。
- 私有 Git 保存服务器、域名、证书、端口、部署关系、生产配置和排障记录，但不保存真实凭据。
- Notion 当前不参与，避免出现两个需要同步的事实来源。
- 公开项目仓库不保存完整生产台账。

## 目录结构

在公开项目仓库内保留一个被外层 Git 忽略、但自身独立进行版本管理的目录：

```text
docs/private.local/
├── README.md
└── zhangrh-shop/
    ├── overview.md
    ├── main.md
    ├── glitchtip.md
    └── back.md
```

未来只有在确实产生资料时，才新增 `shotmarker/` 或其他项目目录。

## Git 关系

- `zhangrh.shop` 仍是公开仓库。
- `docs/private.local/` 命中现有的 `*.local` 忽略规则，因此不会被外层仓库提交。
- `docs/private.local/` 自身初始化为独立 Git 仓库，并连接一个 GitHub 私有仓库。
- 私有远端必须确认可见性为 Private 后，才能推送台账。
- 创建远端属于外部状态变更，实施时需要用户提供私有远端 URL，或明确授权创建。

## 日常使用

1. Agent 和用户直接读取、修改 `docs/private.local/` 中的 Markdown。
2. 台账变更在该目录自己的 Git 仓库中提交并推送。
3. 凭据变化只更新 1Password；台账仅记录对应条目的名称或用途，不复制凭据值。
4. 恢复新电脑时，先克隆公开项目，再将私有台账仓库克隆到 `docs/private.local/`。

## 风险控制

- 推送前检查远端确实为私有仓库。
- 提交前扫描常见私钥、Token、密码和 `.env` 内容。
- 若误提交真实凭据，应立即在服务端轮换；仅从 Git 历史删除并不足够。
- 外层仓库的 `git status` 不应出现 `docs/private.local/` 内容。

## 验收标准

- 四份现有台账完整迁移到 `docs/private.local/zhangrh-shop/`。
- 外层公开仓库继续忽略整个 `docs/private.local/`。
- 内层仓库能够独立提交，且远端可见性确认是 Private。
- 私有仓库中不存在真实凭据或私钥。
- 台账可从私有远端重新克隆恢复。
