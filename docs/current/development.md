# 开发与质量

项目要求 Node.js 24。前端与后端独立安装依赖，根脚本统一调用自动化、测试、静态检查和构建。

## 环境

```bash
npm --prefix frontend ci
npm --prefix backend ci
```

根、前端和后端 `package.json` 均约束 Node.js 为 `>=24 <25`。

## 验证

```bash
# 根自动化、前端和后端测试
npm test

# 测试、前端 lint、TypeScript 检查和四个前端生产构建
npm run check
```

2026-08-19 的迁移前基线：根自动化 9 项、前端 114 项、后端 20 项测试通过，0 失败。本次基线没有验证 lint、类型检查或完整生产构建。

文档变更至少运行 `git diff --check` 和本地 Markdown 链接检查。影响代码、构建或发布行为时运行 `npm run check`。

详细命令见[运行手册](../../RUNBOOK.md)。
