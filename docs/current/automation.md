# Automation

本文只记录可由本仓库脚本和测试核对的实现事实。`automation/publish` 提供仓库根目录的交互式开发与发布入口，并于 2026-09-03 完成复核。

## 入口

| 根命令 | 行为 |
| --- | --- |
| `npm run dev` | 选择 Backend 或一个前端项目并启动开发进程 |
| `npm run publish` | 选择 Backend 或一个前端项目并调用其发布脚本 |
| `npm run test:automation` | 运行菜单渲染、目标列表构造、默认项和状态格式兼容测试 |

脚本扫描 `frontend/project` 的直接子目录并按名称排序，Backend 始终作为独立目标加入。WebTrace 已通过新增目录自动进入开发和发布菜单；新增前端目录后不需要维护固定菜单清单。

## 交互与状态

- TTY 中使用上下方向键选择，Enter 确认，Ctrl-C 返回 130。
- 最近一次开发和发布目标保存在被 Git 忽略的 `.cache/workspace-runner-state.json`。
- 状态文件缺失、损坏或包含无效目标时回退到 Backend；旧 `lastDevFrontend` 字段会迁移。
- 非 TTY 环境不显示菜单，直接使用已记忆目标或 Backend 回退值。
- 开发子进程接收父进程转发的 SIGINT 和 SIGTERM。

## 委托边界

- Backend 开发调用 `npm --prefix backend run dev`。
- 前端开发调用 `npm --prefix frontend run dev -- <project>`。
- Backend 发布调用 `npm --prefix backend run publish`。
- 前端发布调用 `npm --prefix frontend run publish -- <project>`。
- WebTrace 的直接开发与发布命令分别使用项目参数 `webtrace`。
- 根入口不实现构建、上传或远端重建，也不在发布前自动运行测试。

发布的环境、参数和远端副作用见[部署与生产边界](./deployment.md)；操作步骤见[运行手册](../../RUNBOOK.md)。

## 证据

- `automation/publish/workspace-runner.mjs`
- `automation/publish/workspace-runner-lib.mjs`
- `automation/publish/terminal-menu-lib.mjs`
- `automation/publish/*.test.mjs`
