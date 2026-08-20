# Hub ShotMarker 作品卡修复发布记录

- 日期：2026-08-20（Asia/Shanghai）
- 状态：已完成
- 公开 revision：`ecd758c`

## 原因与决定

Hub 的 ShotMarker 作品卡名称和描述自 2026-07-28 起仍以 Support 页面为中心；2026-07-29 只将链接从 `/shotmarker/support` 改到 `/shotmarker/how-to`，没有同步产品名称和用途。用户确认将卡片统一为完整产品：名称使用 `ShotMarker`，描述为“训练时用 Apple Watch 给精彩投篮打点，结束后在 iPhone 上把训练视频整理成集锦。”，链接使用默认入口 `https://zhangrh.shop/shotmarker/`。

## 实现与发布

- 先让 Hub 作品数据测试断言确认后的完整 ShotMarker 卡片，旧数据按预期同时在名称、描述和链接三项失败；最小更新 `works.json` 后针对性测试通过。
- 使用 Node.js `24.19.0` 执行 `npm run check`：Automation 9、Frontend 165、Backend 20 项测试通过，lint、类型检查和四个前端构建通过。
- `ecd758c fix: 更新 Hub ShotMarker 作品信息` 只修改 Hub 作品数据和对应回归测试。
- 使用 Node.js 24 执行 `npm --prefix frontend run publish -- hub` 成功，上传 4 个 OSS 静态资源和 1 个 HTML 文件；最终 JS 为 `index-DFkqPjBH.js`，CSS 为 `index-JMOW12SE.css`。

## 生产验证

- 2026-08-20 10:38～10:40（Asia/Shanghai），`/hub/`、当次 JS/CSS、ShotMarker 封面和 Hub 图标均为 HTTP 200。
- 真实浏览器在 390×844 视口确认首页只有一张名为 `ShotMarker` 的作品卡，显示确认后的描述，目标为 `https://zhangrh.shop/shotmarker/`；页面横向溢出为 0，控制台为 0 错误、0 警告。
- 点击卡片会按现有外链行为打开新标签；新标签落在 ShotMarker 根路径，标题为 `ShotMarker 使用说明`，渲染 How-to 三步流程，横向溢出为 0，控制台为 0 错误、0 警告。

## 未覆盖范围

本次未发布 ShotMarker、Cardgame、Analytics 或 Backend，未写入 Track，未修改生产 Compose、Nginx、证书、GlitchTip 配置或生产数据。
