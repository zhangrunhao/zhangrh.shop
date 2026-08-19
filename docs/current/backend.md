# Backend

本文只记录可由本仓库代码和测试核对的实现事实。Backend 是 Node.js 24、Express 5 和 `ws` 组成的单进程服务，提供 Cardgame HTTP/WebSocket 与 Track 只读查询，并于 2026-08-19 完成复核。

## 运行时

| 项目 | 当前值 |
| --- | --- |
| 启动入口 | `backend/server.js` |
| 默认端口 | `3001`，可由 `PORT` 覆盖 |
| Track 目录 | `TRACK_LOG_DIR`，默认 `/var/log/nginx/track` |
| CORS | Express 全局启用 |
| 启动命令 | `npm --prefix backend start` |
| 开发命令 | `npm --prefix backend run dev` |

## HTTP 与 WebSocket

| 路径 | 职责 |
| --- | --- |
| `GET /health` | Backend 进程健康响应 |
| `GET /api/cardgame/health` | Cardgame 健康响应 |
| `GET /api/cardgame/rooms` | 当前内存房间摘要 |
| `/api/cardgame/ws` | Cardgame WebSocket upgrade |
| `GET /api/track/trend` | 单事件逐日 PV/UV 查询 |

Cardgame 房间、玩家、牌组和回合状态只保存在当前进程内存中，进程重启后丢失。服务没有数据库、账号登录或请求鉴权；Cardgame 规则与消息流程见[组件说明](../../frontend/project/cardgame/README.md)。

Track 路由使用区分大小写和尾斜杠的严格路径，先验证全部查询参数，再申请单查询并发槽。协议、存储、限制和错误契约以 [Track 当前文档](./track.md)为唯一来源。

## 测试与质量边界

```bash
npm --prefix backend test
```

Backend 测试覆盖发布参数、Track 文件读取与资源限制、路由校验、并发和错误映射。Backend 当前没有独立 lint、类型检查或构建脚本；根 `npm run check` 对 Backend 执行测试，对 lint、TypeScript 和生产构建只覆盖前端。

## 发布

`npm --prefix backend run publish`：

1. 通过 SSH 创建目标目录；
2. 使用 rsync `--delete`，仅同步 `.dockerignore`、`Dockerfile`、`server.js`、两个 package 文件和 `projects/`；
3. 在部署根目录执行 `docker compose up -d --build backend`。

默认目标遵循公开部署契约，可用 `--user`、`--host`、`--dest` 和 `--compose-root` 覆盖。脚本不运行测试，不修改 Compose、Nginx、证书或 Track 数据。

## 证据

- `backend/server.js`
- `backend/projects/cardgame.js`
- `backend/projects/{track,track-query}.js`
- `backend/tools/*.test.mjs`
- `backend/tools/{publish,publish-lib}.mjs`
