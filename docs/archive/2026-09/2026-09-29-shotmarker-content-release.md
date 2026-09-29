# ShotMarker 1.3 公开文案发布

日期：2026-09-29。结果：已完成文案同步、检查、发布与公网验证。

## 范围

根据 ShotMarker 1.3 当前实现更新官网首页、使用说明、支持 FAQ 和中英隐私页：

- 可保存并继续编辑的集锦任务，视频与默认时长、序数样式、片段预览和范围调整，以及保留或排除。
- 生成需保持前台；后台停止后手动重新生成。停止或失败保留任务和旧成片，新生成成功后才替换。
- 首次升级的旧 App 本地数据清理及不自动迁移，升级前保存成片到照片库；清理不影响系统照片库、HealthKit 或 App 外导出文件。
- 版本可用性以 App Store 为准；旧配图明确标为基础操作示意，未制作或替换 1.3 截图。
- 隐私政策最后更新改为 2026-09-29，保留 2026-08-19 原生效日期、既有 Analytics/GlitchTip/本地诊断的披露和数据边界。

未修改 Hub、其他产品、后端或生产基础设施；没有生产 Track 写入。

## 验证

Node.js v24.19.0 下运行根 `npm run check`，根自动化 9 项、前端 183 项、后端 20 项全部通过；lint、TypeScript 检查及五个前端生产构建通过。

通过 Chrome 人工核对本地生产预览：桌面首页、新说明和相关页面，以及 390×844 视口的首页、版本提示、旧图说明和升级卡片。修正了版本提示被原段落规则覆盖的 CSS 优先级问题，之后重新运行完整检查通过。

## 发布与公网结果

使用 `npm --prefix frontend run publish -- shotmarker`。首次同步在 GitHub SSH 连接阶段停滞且未进入上传；重试时仅对该进程将 GitHub 仓库连接改用 HTTPS，没有修改仓库远端配置或主机安全设置。Git 同步返回 Already up to date，之后构建、OSS 上传与 SSH/rsync HTML 发布成功，退出码 0。

发布产物：

- `index-CXw1nitx.js`
- `index-BHIvXorZ.css`
- 6 个既有图片与图标资源

对 `/shotmarker/`、`/shotmarker/how-to`、`/shotmarker/support`、`/shotmarker/privacy` 及全部 8 个静态资源做公网 GET：12 个响应均为 HTTP 200，响应正文与本地发布产物逐字节一致。

Chrome 确认线上首页、支持页与中英隐私页的新文案。已缓存首页首次打开仍显示旧文案，强制刷新后显示 1.3 内容；没有更改生产缓存配置。本次没有重新验收 App 实机、App Store、TestFlight 或生产 Analytics/GlitchTip 链路。

当前事实见[项目与组件](../../current/project.md)、[开发与质量](../../current/development.md)和[部署与生产边界](../../current/deployment.md)。
