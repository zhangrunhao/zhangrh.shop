# Track Analytics 页面设计

## 目标

在 `frontend/project/analytics` 新建一个独立的 Vite + React 前端项目，并发布到 `/analytics/`。页面直接请求公开的 Track 汇总接口，把当前需要手动阅读的 JSON 转换成简单、清楚、适合桌面和手机查看的统计页面。

页面不需要登录、权限控制或新的 Backend 接口。

## 范围

页面支持以下项目筛选：

- Hub，默认选中
- Cardgame
- ShotMarker

页面支持以下时间范围：

- 1 天
- 7 天
- 30 天，默认选中
- 90 天

页面不提供“全部项目”筛选，也不提供任意天数输入。

## 页面结构

页面采用单页、纵向滚动的“概览优先”布局：

1. 页头显示 `Track 概览`、项目筛选、天数筛选和刷新按钮。
2. 两张核心指标卡显示事件数和近似设备数。
3. 每日趋势区同时展示 `daily` 中的事件数和设备数。
4. 事件类型表展示 `event_breakdown`。
5. 页面表展示 `page_breakdown`。
6. 按钮表展示 `button_breakdown`。

不展示项目统计区块，因为每次查询只选择一个项目。空的明细区块保留标题并显示“暂无数据”，避免用户误以为页面漏载。

视觉样式使用克制的黑白灰配色、清楚的字号层级和轻量边框。桌面端以有限宽度居中展示，窄屏下指标卡和表格自然换行或横向滚动。不引入图表库或新的运行时依赖；每日趋势使用项目内的轻量 SVG 或 CSS 实现。

## 数据流

页面首次加载时请求：

```text
/api/track/summary?days=30&project=hub
```

项目或天数改变后立即使用新的筛选值重新请求。刷新按钮使用当前筛选值重新请求。请求成功后，页面替换全部统计内容并显示本次更新时间。

同一时间只允许一个请求。加载期间禁用项目筛选、天数筛选和刷新按钮，避免 Backend 的单查询并发限制产生不必要的 `track_query_busy` 错误。

前端只读取以下响应字段：

- `range`
- `filter`
- `totals`
- `event_breakdown`
- `page_breakdown`
- `button_breakdown`
- `daily`

`diagnostics` 不在页面展示。页面不持久化筛选状态、不缓存响应，也不自动轮询。

## 状态与错误处理

- 首次加载：指标和内容区显示轻量加载状态。
- 后续加载：保留当前数据并显示加载状态，控件暂时禁用。
- 空数据：事件数和设备数显示 `0`；趋势与明细区显示“暂无数据”。
- 一般错误：页面顶部显示接口返回的安全错误信息和“重试”按钮。
- ShotMarker 兼容错误：当 ShotMarker 查询返回 `invalid_project` 时，显示“线上 Backend 尚未支持 ShotMarker”。
- 响应格式异常：显示统一的“数据格式异常，请重试”提示，不渲染部分或猜测的数据。

错误状态不跳转页面，也不输出原始响应或堆栈信息。

## 文件与职责

预计新增以下文件，具体拆分可在实施计划中保持精简：

- `frontend/project/analytics/index.html`：Vite 入口文档。
- `frontend/project/analytics/main.tsx`：React 挂载入口。
- `frontend/project/analytics/app.tsx`：页面状态、请求和布局组合。
- `frontend/project/analytics/track-summary.ts`：接口类型、响应校验和请求参数构造。
- `frontend/project/analytics/styles.css`：响应式页面样式。
- `frontend/project/analytics/vite.config.ts`：复用仓库统一 Vite 配置，生成 `/analytics/` base path。
- `frontend/package.json`：把 Analytics 加入 `build:all`，确保根目录完整构建包含新项目。
- `README.md`：把 Analytics 补充到仓库项目与在线入口说明。

若实现后 `app.tsx` 仍足够短，可不额外拆分展示组件。项目目录会被现有开发和发布脚本自动发现；显式维护的 `build:all` 列表同步加入 Analytics。

## 测试与验证

自动化测试至少覆盖：

- 默认请求使用 `project=hub` 和 `days=30`。
- 三个项目与四个天数能生成正确的查询参数。
- 有数据、零数据和空明细能生成正确的页面状态。
- `invalid_project` 在 ShotMarker 下显示专用提示。
- 一般接口错误和响应格式异常显示可重试错误状态。

完成实现后运行 Analytics 相关测试和单项目构建，再运行仓库根目录的 `npm run check`，确认自动化测试、lint、类型检查和全部前端构建通过。

## 非目标

- 不新增或修改 Backend 汇总接口。
- 不展示原始事件、`device_id`、`params` 或 `diagnostics`。
- 不增加登录、权限、分享、导出、分页或自动刷新。
- 不为 Analytics 页面自身增加新的埋点。
- 不修改 Hub、Cardgame 或 ShotMarker 的现有页面。

## 验收标准

访问 `/analytics/` 后，页面默认展示 Hub 最近 30 天的事件数、设备数、每日趋势、事件类型、页面和按钮统计。用户可以在 Hub、Cardgame、ShotMarker 以及 1、7、30、90 天之间切换，并能手动刷新。所有加载、空数据和接口错误都有清楚且不暴露内部信息的页面反馈，桌面和手机均可正常阅读。
