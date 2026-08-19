# CardGame 作品入口、资源本地化与路由设计

日期：2026-07-29

## 背景

当前 Hub 作品数据只包含 ShotMarker，作品状态只支持 `active` 和 `archived`。CardGame 已在线但没有出现在作品列表中。

CardGame 当前还存在两个结构性问题：

1. `app.tsx` 引用 12 个 Figma MCP 临时资源 URL。这些 URL 已返回 404，导致入口、规则和对战页面的图标不可见；CardGame 也没有声明 favicon，浏览器会额外请求不存在的根 `/favicon.ico`。
2. 页面使用组件内部的 `route` 状态切换入口、规则、对战和结果，没有可分享的 URL，也不能正确响应浏览器前进、后退和深路径刷新。

## 目标

1. 在 Hub 作品列表中加入 CardGame，显示 `Paused / 暂停维护`，点击整张卡片进入线上 CardGame。
2. 用仓库内长期可维护的 SVG/React 图标替换所有失效的 Figma MCP 资源，并补充 CardGame favicon。
3. 为 CardGame 的入口、模式选择、规则、等待房间、对战和结果建立明确的 History API 路由。
4. 不引入 React Router，不改变游戏规则，不增加服务端会话持久化或刷新恢复能力。
5. 完成后合并到 `main`，重新发布 Hub 与 CardGame，并执行线上浏览器回归。

## 已确认的产品决策

### 作品状态与顺序

- CardGame 状态使用 `paused`，界面标签为 `Paused`，中文语义为“暂停维护”。
- `WorkStatus` 扩展为 `active | paused | archived`，状态样式和标签使用显式映射，不再使用二选一判断。
- 作品列表继续按数据顺序展示：Active 的 ShotMarker 在前，Paused 的 CardGame 在后。
- CardGame 不加入首页 `featuredWorkIds`。暂停维护的作品保留在完整作品列表中，但不占用首页精选位。
- CardGame 卡片摘要为：`策略卡牌对战 Demo，当前暂停维护，仍可体验。`
- 卡片链接指向 `https://zhangrh.shop/cardgame/`。

### CardGame 封面

- 新增 `frontend/project/hub/assets/works/20260729_cardgame/cover.svg`。
- 采用已确认的“战术牌桌”方向：深色竞技背景，使用 A、D、R 三张卡牌作为主体，并在画面中保留 `CARDGAME` 和 `PAUSED` 识别信息。
- SVG 是仓库原生资源，不引入 AI 生成位图或新的外部图片依赖。

## 路由设计

### 路由表

| URL | 页面 | 恢复要求 |
| --- | --- | --- |
| `/cardgame/` | 入口与模式选择 | 无 |
| `/cardgame/create` | 创建房间 | 无 |
| `/cardgame/join` | 加入房间 | 无 |
| `/cardgame/ai` | 人机对战 | 无 |
| `/cardgame/rules` | 游戏规则 | 无 |
| `/cardgame/room/:roomId` | 等待玩家或准备开始 | 必须有匹配的内存会话 |
| `/cardgame/battle/:roomId` | 对战中 | 必须有匹配的内存会话 |
| `/cardgame/result/:roomId` | 对战结果 | 必须有匹配的内存会话和结果 |

`roomId` 必须是 4 位数字。其他路径进入 CardGame 自己的 404 页面，并提供返回入口的操作。

部署契约已将 `/cardgame/*` 深路径映射到 CardGame HTML，因此本变更不修改网关或后端配置。

### 路由模块

新增 `frontend/project/cardgame/shared/route.ts`，提供：

- `CardgameRoute`：带判别字段的路由联合类型。
- `resolveCardgameRoute(pathname)`：把浏览器路径解析为路由。
- 路由构造函数：统一生成入口、模式、房间、对战和结果 URL。
- `navigateCardgame(route, mode)`：统一调用 `history.pushState` 或 `history.replaceState`，并触发路由更新。
- `useCardgamePathname()`：监听 `popstate`，使 React 与浏览器历史同步。
- 会话路由判断和服务端状态到 URL 的纯函数，供 App 和测试复用。

URL 是页面状态的唯一来源。`App` 不再并行维护独立的 `route` 状态；`create`、`join` 和 `ai` 的入口模式也由当前路由派生。

### 历史记录策略

- 用户主动进入创建、加入、人机和规则页面时使用 `pushState`，使浏览器前进、后退符合预期。
- 服务端推动的 `room → battle → result` 阶段变化使用 `replaceState`，避免后退到已经失效的旧对局阶段。
- 结束对局、主动离开或无法恢复会话时，清理本地对局状态并使用 `replaceState` 返回 `/cardgame/`。
- 浏览器前进、后退离开有效会话路由时，关闭当前 WebSocket 并清理内存会话，避免后台残留连接。

### 服务端事件与 URL

- `create_room` 或 `join_room` 成功并收到等待状态时进入 `/room/:roomId`。
- 房间状态变为 `playing` 或收到当前回合手牌时进入 `/battle/:roomId`。
- 收到 `game_over` 并完成现有结算展示后进入 `/result/:roomId`。
- 人机对战如果直接进入 `playing`，可跳过等待路由，直接进入 `/battle/:roomId`。
- 再来一局沿用原房间；收到新的对战状态后用 `replaceState` 返回 `/battle/:roomId`。

### 深路径刷新与错误处理

静态页面路由可以直接打开和刷新。

`room`、`battle`、`result` 依赖当前页面内存中的 WebSocket 会话。直接打开或刷新这些 URL 时，如果没有匹配的会话：

1. 使用 `replaceState` 返回 `/cardgame/`；
2. 显示一次性提示：`对局已结束或无法恢复，请重新开始。`；
3. 不尝试伪造、恢复或重新加入服务端房间。

路径格式错误进入 CardGame 404 页面，不显示会话恢复提示。

## 本地图标设计

新增 `frontend/project/cardgame/components/icons.tsx`，以语义化 React SVG 组件替换以下外部图片：

- 创建房间
- 加入房间
- 人机对战
- 帮助
- 返回
- 进攻
- 防守
- 休养
- HP
- 提示
- 牌库
- 弃牌堆

业务数据不再保存 URL 字符串，而是保存图标名称或直接渲染图标组件。所有图标继承 `currentColor`，继续使用现有 CSS 控制尺寸和色彩。

新增 `frontend/project/cardgame/favicon.svg`，并在 CardGame HTML 中显式声明。构建和 OSS 发布流程会把它作为当前项目静态资源处理。

全仓不再存在 `figma.com/api/mcp/asset` 的 CardGame 运行时引用。

## 组件边界

本轮不全面拆分约 1300 行的 `app.tsx`，避免把路由功能扩大成 UI 重构。只提取两个稳定边界：

1. `shared/route.ts`：纯路由解析、URL 构造、历史操作和状态映射。
2. `components/icons.tsx`：所有本地图标。

WebSocket、对局数据和现有屏幕 JSX 仍由 `App` 管理。路由接入只替换页面选择与导航方式，不改变游戏计算或通信协议。

## 测试设计

### Hub

- `works.json` 包含 ShotMarker 和 CardGame，字段和顺序准确。
- `paused` 是合法状态，标签显示为 `Paused`，使用独立的暂停样式。
- CardGame 封面存在、可由 Vite 解析，整卡链接进入生产 CardGame。
- 首页精选仍只包含 ShotMarker。

### CardGame 路由

- 覆盖所有静态路径和合法的 4 位房间号路径。
- 覆盖尾斜杠、错误房间号、未知路径和 CardGame 基础路径之外的输入。
- 覆盖等待、对战、结果状态到 URL 的映射。
- 覆盖静态导航使用 push、服务端阶段变化使用 replace 的调用边界。
- 覆盖无会话刷新回入口和一次性提示行为。

### CardGame 资源

- 所有语义图标均可渲染为 SVG。
- CardGame 源码和生产构建不包含 Figma MCP URL。
- favicon 构建后存在并可访问。

### 完整验证

在 Node 24 下运行：

- 根测试、lint、typecheck 和三个前端构建；
- 前后端完整依赖及 production audit；
- Hub 和 CardGame 真实浏览器检查；
- CardGame 静态深路径、浏览器前进后退、无会话刷新、WebSocket 对战入口；
- 浏览器控制台和网络请求检查。

## 发布

完成规格、代码和质量复核并合并到 `main` 后：

1. 发布 Hub；
2. 发布 CardGame；
3. 验证作品卡片、CardGame 路由、图标、favicon、健康接口和 WebSocket；
4. 不重复发布没有改动的 backend 与 ShotMarker。

## 非目标

- 不新增服务端房间持久化、断线重连或刷新恢复。
- 不改变卡牌克制关系、数值、回合流程或服务端协议。
- 不修正文档中已记录的前端旧规则矩阵问题。
- 不引入 React Router 或新的图标依赖。
- 不全面拆分 CardGame `app.tsx`。
