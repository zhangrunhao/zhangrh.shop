# ShotMarker 公开页面内容发布记录

- 日期：2026-08-19（Asia/Shanghai）
- 状态：已完成
- 最终公开 revision：`42d21e7`

## 范围与授权

用户明确要求提交并发布 [ShotMarker 公开页面内容同步设计](./2026-08-19-shotmarker-public-content-spec.md) 和[实施计划](./2026-08-19-shotmarker-public-content-plan.md)。本次只发布 ShotMarker 前端 HTML 与静态资源，不发布 Backend，不写入 Track，不修改生产 Compose、Nginx、证书、GlitchTip 配置或生产数据。

## 提交与发布

- `3e5bd05 feat: 同步 ShotMarker 公开页面内容`：同步隐私、支持和使用说明，增加合成数据的已完成任务截图，并归档 Change。
- 首次发布后实际公开日期已经确定，因此不再保留 `Upon publication` 占位符。
- `42d21e7 fix: 填写 ShotMarker 隐私政策生效日期`：将生效日期固定为 `August 19, 2026`，并用页面消费端断言锁定。
- 两次发布均使用 Node.js 24；最终执行 `npm --prefix frontend run publish -- shotmarker` 成功，上传 8 个 OSS 静态资源和 1 个 HTML 文件。
- 最终 HTML 引用 `index-CmkL9J7b.js` 和 `index-Dy4--Zsj.css`；新增的已完成任务截图为 `iphone-highlight-job-completed-ioDZaHTM.png`。

## 验证结果

- 最终发布前 `npm run check` 在 Node.js `24.19.0` 下通过：Automation 9、Frontend 163、Backend 20 项测试均通过，lint、类型检查和四个前端构建通过。
- 2026-08-19 17:18～17:21（Asia/Shanghai）公网只读验证确认 `/shotmarker/`、`/shotmarker/privacy`、`/shotmarker/support` 和 `/shotmarker/how-to` 均为 HTTP 200。
- 当前 JS、CSS 和新增 PNG 均为 HTTP 200；PNG 响应类型为 `image/png`，长度为 195464 字节。
- 生产隐私页显示 `Effective date: August 19, 2026`，不再包含 `Upon publication`；页面同时包含 Sentry Cocoa 9.26.0 自动技术上下文、安装范围 Sentry user ID 和源 IP 边界披露。
- 390×844 浏览器验证确认三个页面横向溢出为 0，how-to 第三步包含三张已加载截图；三个页面的浏览器控制台均为 0 错误、0 警告。

## 未覆盖范围

本次未写入 Track，未验证 App Store、TestFlight、真实 Release Analytics、真实 GlitchTip 事件接收或托管保留状态，也未执行 Git push。
