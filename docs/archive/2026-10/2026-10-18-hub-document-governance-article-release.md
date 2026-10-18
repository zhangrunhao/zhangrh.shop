# Hub 文档治理博客发布记录

- 日期：2026-10-18（Asia/Shanghai）
- 状态：HTML 与静态资源核验完成
- 文章：`/hub/articles/100004`，标题“用三个目录，整理项目文档”
- 公开 revision：`92bc2e8`

## 发布

使用 Node.js 24 执行 `npm --prefix frontend run deploy -- hub`。rsync 部署 `index.html`（924 字节）。

## 已完成核验

对公网 `/hub/`、`/hub/articles` 和 `/hub/articles/100004` 执行 GET：三个响应均为 HTTP 200，且与本地 `frontend/dist/hub/index.html` 逐字节一致。对 `frontend/dist/hub/static/` 中的 5 个文件执行 GET，全部与本地构建产物逐字节一致：

- `cover-B8w5Arrr.webp`
- `cover-Bev3KgDl.webp`
- `favicon-DyB9pUGh.ico`
- `index-BixogXfL.css`
- `index-ijWcObuS.js`

本地 JS bundle 包含文章标题“用三个目录，整理项目文档”和原文最终原则中的“current 负责清楚地说明现在。”。共完成 9 项只读核验。

另将同一构建产物放在本地预览服务器，将资源地址改为本地并移除第三方统计脚本，仅用于验证排版；应用 JS、CSS 和文章内容未修改。浏览器显示标题、介绍及完整 Markdown，渲染后的原文与附件逐字一致（7,170 个字符），截图排版正常。预览服务器本地处理 `/track`，未写入生产事件；这项是本地渲染验证，不代表生产浏览器端验证。

文档更新后，Node.js 24 下 `npm test` 全部通过（Automation 9、Frontend 183、Backend 20，共 212 项），本地 Markdown 链接与标题锚点、`git diff --check` 检查通过。

当前部署事实见[部署与生产边界](../../current/deployment.md)。
