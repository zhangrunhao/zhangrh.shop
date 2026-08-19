# 开发与质量

本文同时记录开发与验证的有效决定和当前实现。代码、清单和测试于 2026-08-19 复核。

## 有效决定

- 项目使用 Node.js 24。
- 改变项目说明或契约的纯文档变更运行 `npm test`；影响代码、构建或发布行为的变更运行 `npm run check`。
- 所有文档变更至少运行 `git diff --check`、本地 Markdown 链接和标题锚点检查。

## 当前实现

前端与后端独立安装依赖并分别维护锁文件，不是 npm workspace：

```bash
npm --prefix frontend ci
npm --prefix backend ci
```

根、前端和后端 `package.json` 均约束 Node.js 为 `>=24 <25`。根脚本统一调用自动化、前端和后端测试，以及前端静态检查与构建：

```bash
# 根自动化、前端和后端测试
npm test

# 测试、前端 lint、TypeScript 检查和四个前端生产构建
npm run check
```

`npm test` 运行根自动化、前端和后端测试。`npm run check` 在测试后继续运行前端 lint、TypeScript 检查和四个前端生产构建；Backend 当前没有 lint、类型检查或构建脚本。

## 最近验证

2026-08-19 在 Node.js v24.19.0 下运行 `npm run check`：根自动化 9 项、前端 163 项、后端 20 项，共 192 项通过、0 失败；前端 lint、TypeScript 检查和 Hub、Cardgame、ShotMarker、Analytics 四个生产构建全部通过。

详细命令见[运行手册](../../RUNBOOK.md)，组件边界见 [Automation](./automation.md) 和 [Backend](./backend.md)。
