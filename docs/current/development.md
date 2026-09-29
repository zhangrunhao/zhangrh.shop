# 开发与质量

本文同时记录开发与验证的有效决定和当前实现。完整检查于 2026-09-29 在 WebTrace 文案、隐私政策和截图对齐后复核。

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

# 测试、前端 lint、TypeScript 检查和五个前端生产构建
npm run check
```

`npm test` 运行根自动化、前端和后端测试。`npm run check` 在测试后继续运行前端 lint、TypeScript 检查和 Hub、Cardgame、ShotMarker、Analytics、WebTrace 五个前端生产构建；Backend 当前没有 lint、类型检查或构建脚本。

## 最近验证

2026-09-29 在 Node.js v24.7.0 下运行 `npm run check`：根自动化 9 项、前端 183 项、后端 20 项，共 212 项通过、0 失败；前端 lint、TypeScript 检查和 Hub、Cardgame、ShotMarker、Analytics、WebTrace 五个生产构建全部通过。

同日使用隔离 Playwright Chromium `151.0.7922.34` 验证本地生产预览：WebTrace 首页、支持页、隐私页以及 Hub 首页、作品列表在 1280px 和 390px 宽度下均显示新的按周回看说明，无横向溢出；WebTrace 图片加载正常，中英政策的用途、保留和更新日期一致，无页面运行错误。Hub 本地预览的 `/track` 请求因未启动接收端返回预期的 404，未向生产 Track 写入事件。

2026-09-29 发布后，使用同版本隔离 Chromium 对上述五个生产页面完成 1280×800 与 390×844 两种视口的 10 组检查：新文案、政策日期、双线图截图、标题与链接正确，无横向溢出、图片加载失败、控制台错误或警告。5 个页面和 9 个静态资源的公网响应均为 HTTP 200，内容与本地发布产物逐字节一致。Hub 的 4 次 Track 请求由浏览器拦截并模拟 `204`，未写入生产事件。这些均为自动化浏览器验证，生产 Track 接收端未在本次重新验收。

详细命令见[运行手册](../../RUNBOOK.md)，组件边界见 [Automation](./automation.md) 和 [Backend](./backend.md)。
