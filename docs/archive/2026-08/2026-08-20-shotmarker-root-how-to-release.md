# ShotMarker 根入口与 How-to 对齐发布记录

- 日期：2026-08-20（Asia/Shanghai）
- 状态：已完成
- 公开 revisions：`1da28f6`、`0f2b584`

## 原因与决定

ShotMarker 的 Hub 作品入口自 2026-07-29 起以 `/shotmarker/how-to` 作为首要落点，但 SPA 根路径 `/shotmarker/` 仍沿用早期 Support 别名，形成产品入口与裸根路径不一致。用户确认消除该历史不一致：`/shotmarker/` 和开发态 `/` 均渲染 How-to，`/shotmarker/support` 继续独立渲染 Support。路由修复后的最终发布核对还发现初始 HTML 仍硬编码 Support 标题和描述，因此将默认元数据一并对齐。

## 实现与发布

- 先修改真实路由测试，确认根路径期望 How-to 时因实际返回 Support 而失败；再最小调整 `resolveRoute()` 分支，针对性测试由 1 项失败变为 5 项全部通过。
- `1da28f6 fix: 统一 ShotMarker 默认入口` 只修改路由实现和测试，没有改动页面内容、路径常量或隐私政策日期。
- 再以失败测试确认初始 HTML 仍声明 Support，`0f2b584 fix: 对齐 ShotMarker 默认页面元数据` 将默认标题和描述改为 How-to，并保留客户端按路由更新元数据的逻辑。
- 使用 Node.js `24.19.0` 执行最终 `npm run check`：Automation 9、Frontend 165、Backend 20 项测试通过，lint、类型检查和四个前端构建通过。
- 从 `0f2b584` 再次使用 Node.js 24 执行 `npm --prefix frontend run publish -- shotmarker` 成功，上传 8 个 OSS 静态资源和 1 个 HTML 文件；最终 JS 为 `index-CIvFcTDv.js`，CSS 为 `index-Dy4--Zsj.css`。

## 生产验证

- 2026-08-20 10:17～10:26（Asia/Shanghai），`/shotmarker/`、`/shotmarker/support`、`/shotmarker/privacy` 和 `/shotmarker/how-to` 均为 HTTP 200，且引用最终 JS/CSS。
- 原始根路径 HTML 已包含标题 `ShotMarker 使用说明` 和 How-to 描述；真实浏览器确认根路径渲染 `.how-to-page`、三步流程和 Support 链接，390×844 视口横向溢出为 0，控制台为 0 错误、0 警告；`/shotmarker/how-to` 呈现相同内容。
- `/shotmarker/support` 仍显示 `ShotMarker Support` 且不渲染 How-to；Privacy 页面仍显示 2026-08-19 生效日期。
- 首次发布后的四路由浏览器核对均为 390×844 视口横向溢出 0、控制台 0 错误和 0 警告；第二次发布未改变 JS/CSS 哈希。

## 未覆盖范围

本次未发布 Hub 或 Backend，未写入 Track，未修改生产 Compose、Nginx、证书、GlitchTip 配置或生产数据，也未验证 App Store、TestFlight 或真实 App 上报链路。
