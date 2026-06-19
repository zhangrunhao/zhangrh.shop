# 关于我页面设计

## 背景

Hub 站点已有 `/about` 路由和 `AboutPage` 组件，但当前页面内容较薄，只展示了一段简短介绍和联系方式。用户提供了新的“关于我”正文和联系方式，要求完成该页面，并明确要求严格使用提供的文字和联系方式。

## 内容边界

页面只使用以下用户提供的内容，不新增事实、不扩写履历、不调整核心措辞。

标题：

- 关于我

正文：

- 我是一个前端开发者。
- 这个网站用来放我做过的作品和写过的文章。
- 我正在尝试用 AI 编程做一些真实项目，也会记录项目过程中的思考、问题和复盘。
- 你可以在这里看到我的作品、文章，以及我对 AI 编程和独立开发的一些实践。

联系方式：

- GitHub: https://github.com/zhangrunhao
- Email: runhaozhang.dev@gmail.com

## 页面方案

采用正文型关于页：

- 顶部为页面标题“关于我”。
- 正文按用户原文顺序排成段落，保持阅读节奏。
- 下方展示“联系方式”，包含 GitHub 和 Email 两项。
- 保留现有站点的 Hub 风格：浅灰背景、白底细边框、绿色主操作、紧凑圆角。

## 组件和数据

主要修改 `frontend/project/hub/pages/about-page.tsx`。

- 继续使用现有 `EMAIL_LINK` 和 `GITHUB_LINK` 常量。
- 继续使用现有 `Link`、`MailIcon`、`GitHubIcon`、`ExternalIcon` 组件。
- 不新增页面路由，不新增数据文件，不调整导航。

## 测试和验证

需要验证：

- 页面包含用户提供的全部正文。
- GitHub 链接指向 `https://github.com/zhangrunhao`。
- Email 链接使用 `mailto:runhaozhang.dev@gmail.com`。
- 页面没有出现旧的介绍文案。
- 前端构建或相关测试通过。
