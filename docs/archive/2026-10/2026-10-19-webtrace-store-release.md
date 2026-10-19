# WebTrace 商店上架与官网同步记录

- 日期：2026-10-19（Asia/Shanghai）
- 状态：已发布，公网内容核验完成
- 官网公开 revision：`f4e7225`
- 商店版本：`1.1.0`
- [Chrome 应用商店](https://chromewebstore.google.com/detail/webtrace/efpighgeknabppbmfjpkfmebmnmckpgj)

## 内容与发布

商店公开页面显示 WebTrace 1.1.0、更新日期 October 19, 2026 和 Add to Chrome 安装按钮。

官网首页增加已上架说明，并将主要按钮设为商店安装入口；支持页增加商店安装步骤，以及从 TimeTracker 1.0.0 升级不自动迁移旧汇总记录、需要重新配置网站的提示。Hub 作品卡同步已上架文案，仍链接稳定产品入口 `/webtrace/`。支持页日期更新为 2026-10-19，隐私政策内容及日期保持不变。

使用 Node.js 24 分别执行 `npm --prefix frontend run publish -- webtrace` 和 `npm --prefix frontend run publish -- hub`，完成 Git 同步、生产构建、9 个 OSS 静态资源上传及 SSH/rsync HTML 发布。

## 验证

- `npm run check` 通过：Automation 9、Frontend 183、Backend 20，共 212 项测试；lint、类型检查和五个前端构建均通过。
- 公网 GET 核验 `/webtrace/`、`/webtrace/support/`、`/webtrace/privacy/`、`/hub/`、`/hub/products`，响应成功并与本地相应 HTML 逐字节一致。
- WebTrace 4 个、Hub 5 个静态资源的公网内容均与本地生产产物逐字节一致。
- 发布前，Codex 内置浏览器在 390×844 视口检查本地 WebTrace 首页，已上架说明和安装按钮显示正常，并核对商店链接。
- 发布后的内置浏览器连接超时，未完成生产页面视觉复核；公网 HTML 与资源一致性核验不替代浏览器端行为验证。
- 本次未验证扩展安装后的计时行为，未主动执行生产 Track 写入验证，未修改生产基础设施配置。

当前事实见[项目与组件](../../current/project.md)与[部署与生产边界](../../current/deployment.md)。
