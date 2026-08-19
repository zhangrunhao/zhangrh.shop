# CardGame 作品入口、资源本地化与路由实施计划

> 对应设计：[CardGame 作品入口、资源本地化与路由设计](./2026-07-29-cardgame-portfolio-routing-spec.md)

## 目标

在不改变 CardGame 游戏规则和服务端协议的前提下：

1. 把 CardGame 作为 `Paused` 作品加入 Hub 完整作品列表；
2. 移除 CardGame 的失效 Figma MCP 图片依赖，改用本地 React SVG 图标并增加 favicon；
3. 用轻量 History API 路由替换组件内部页面状态；
4. 完成测试、审查、合并，并重新发布 Hub 与 CardGame。

## 约束

- 工作目录：`.worktrees/cardgame-portfolio-routing`
- 分支：`codex/cardgame-portfolio-routing`
- 所有 Node 命令使用 Node 24。
- 每项功能先写会失败的测试，再做最小实现。
- 每个任务独立提交，提交使用中文 Conventional Commit。
- 不引入 React Router、图标库或新的运行依赖。
- 不修改后端协议、卡牌规则、旧规则矩阵、ShotMarker 或发布基础设施。

## Task 1：在 Hub 作品列表加入 Paused CardGame

### 允许修改

- `frontend/project/hub/types.ts`
- `frontend/project/hub/components/work-card.tsx`
- `frontend/project/hub/data/works.json`
- `frontend/project/hub/assets/works/20260729_cardgame/cover.svg`
- 与 Hub works 数据、渲染和资产解析直接相关的现有测试

### 测试先行

1. 更新 works 数据测试，先要求：
   - 数据依次包含 ShotMarker 和 `20260729_cardgame`；
   - CardGame 名称、摘要、生产链接、封面路径和 `paused` 状态准确；
   - `paused` 是合法状态；
   - 首页精选约束仍只有 ShotMarker。
2. 更新作品渲染测试，先要求 `Paused` 标签和独立的暂停样式。
3. 更新真实封面资产解析测试，先要求 CardGame SVG 可由 Vite 解析。
4. 运行相关测试，保存旧实现失败证据。

### 实现

1. 把 `WorkStatus` 扩展为 `active | paused | archived`。
2. 把 badge 文案和 class 改为穷尽映射：
   - Active：绿色；
   - Paused：琥珀色；
   - Archived：中性灰。
3. 新增已确认的“战术牌桌” SVG 封面：
   - 16:9；
   - 深色竞技背景；
   - A、D、R 三张卡牌；
   - `CARDGAME` 与 `PAUSED` 识别信息；
   - 无外部字体、图片或脚本。
4. 在 ShotMarker 后添加 CardGame 数据：
   - `id`: `20260729_cardgame`
   - `name`: `CardGame`
   - `summary`: `策略卡牌对战 Demo，当前暂停维护，仍可体验。`
   - `link`: `https://zhangrh.shop/cardgame/`
   - `coverImage`: `works/20260729_cardgame/cover.svg`
   - `status`: `paused`
5. 不修改 `featuredWorkIds`。

### 验证

- 相关 Hub 测试通过；
- `npm --prefix frontend run lint`
- `npm --prefix frontend run typecheck`
- `npm --prefix frontend run build -- hub`
- `git diff --check`

### 提交

`feat: 在作品集中加入暂停维护的 CardGame`

## Task 2：本地化 CardGame 图标和 favicon

### 允许修改

- `frontend/project/cardgame/components/icons.tsx`
- `frontend/project/cardgame/app.tsx`
- `frontend/project/cardgame/styles.css`
- `frontend/project/cardgame/favicon.svg`
- `frontend/project/cardgame/index.html`
- 新增的 CardGame 资源测试

### 测试先行

1. 新增 CardGame 资源测试，先要求：
   - 12 个语义图标名称均可渲染为 `<svg>`；
   - 图标使用 `currentColor`，无 HTTP/HTTPS 图片引用；
   - `app.tsx` 不包含 `figma.com/api/mcp/asset`；
   - CardGame HTML 显式引用本地 favicon。
2. 运行新测试，确认旧实现失败。

### 实现

1. 新增 `CardgameIcon` 或等价的穷尽图标组件，覆盖：
   - create、join、bot、help、back；
   - sword、shield、heart；
   - hp、alert、deck、discard。
2. 图标使用内联 SVG、`currentColor`、统一 `viewBox`，允许透传现有 className。
3. 把 `CardMeta.iconUrl` 和入口模式图片 URL 改为图标名称或组件。
4. 把所有 `<img src={ICON_*}>` 改为本地图标组件，并最小更新 CSS 选择器，保持当前尺寸和布局。
5. 新增简洁的 CardGame favicon SVG，并在 `index.html` 中声明。
6. 全仓 CardGame 运行代码不再引用 Figma MCP URL。

### 验证

- 新资源测试通过；
- CardGame 相关测试通过；
- `npm --prefix frontend run lint`
- `npm --prefix frontend run typecheck`
- `npm --prefix frontend run build -- cardgame`
- 构建产物包含 favicon，且不包含 `figma.com/api/mcp/asset`
- `git diff --check`

### 提交

`fix: 本地化 CardGame 图标资源`

## Task 3：为 CardGame 接入 History API 路由

### 允许修改

- `frontend/project/cardgame/shared/route.ts`
- `frontend/project/cardgame/shared/route.test.ts`
- `frontend/project/cardgame/app.tsx`
- 必要的 CardGame 路由集成测试

### 测试先行

1. 新增纯路由测试，覆盖：
   - `/cardgame` 和 `/cardgame/`；
   - `/create`、`/join`、`/ai`、`/rules`；
   - 合法的 `/room/1234`、`/battle/1234`、`/result/1234`；
   - 尾斜杠；
   - 非 4 位房间号、额外路径片段和未知路径；
   - 入口、模式和会话路由构造函数。
2. 新增状态映射测试，覆盖：
   - waiting → room；
   - playing → battle；
   - finished/game_over → result；
   - 用户导航为 push、服务端阶段迁移为 replace。
3. 新增会话保护测试，要求无匹配内存会话的动态路径返回入口和恢复提示动作。
4. 运行新测试，确认旧实现缺少模块而失败。

### 实现

1. 新增判别联合类型 `CardgameRoute` 和纯解析/构造函数。
2. 路由基础路径固定为 `/cardgame`，输出统一使用尾斜杠规范。
3. 提供 `useCardgamePathname`，监听 `popstate`。
4. 提供统一导航函数：
   - 用户主动页面切换：`pushState`；
   - 服务端阶段变化和恢复失败：`replaceState`。
5. `App` 使用解析后的 URL 作为唯一页面来源：
   - 删除内部 `route` state；
   - create/join/ai 由 URL 派生；
   - 规则页、入口和 404 由路由渲染；
   - 服务端 `room_state`、`round_hand`、`game_over` 驱动动态 URL。
6. 动态路由必须匹配当前 4 位房间号和内存会话，否则：
   - 清理连接与会话；
   - replace 到 `/cardgame/`；
   - 显示一次性提示 `对局已结束或无法恢复，请重新开始。`
7. 通过浏览器后退离开会话路由时关闭 WebSocket 和清理会话。
8. 未知路径显示 CardGame 404 页面和返回入口按钮。
9. 不增加刷新恢复、自动重连或服务端改动。

### 验证

- 新路由测试通过；
- CardGame 相关测试通过；
- `npm --prefix frontend run lint`
- `npm --prefix frontend run typecheck`
- `npm --prefix frontend run build -- cardgame`
- 本地 preview 下所有深路径返回并渲染正确页面；
- `git diff --check`

### 提交

`feat: 为 CardGame 页面接入浏览器路由`

## Task 4：更新文档与执行集成验收

### 允许修改

- `frontend/project/cardgame/README.md`
- 若事实发生变化，允许最小更新根 README 或部署文档；无变化则不改

### 文档

1. 记录全部 CardGame 路由。
2. 说明动态会话路由刷新无法恢复，会返回入口并提示。
3. 说明图标和 favicon 已改为仓库本地资源。
4. 保留“前端旧规则矩阵可能与服务端不一致”的现有事实边界。

### 完整验证

在 Node 24 下执行：

1. `npm ci`（frontend、backend）；
2. `npm run check`；
3. frontend/backend 完整和 production audit；
4. `npm ls --all`；
5. 全仓扫描 CardGame Figma MCP URL 为零；
6. 检查 dist 仅有 Hub、CardGame、ShotMarker；
7. Playwright 本地 preview：
   - Hub 作品列表出现 CardGame Paused 卡片；
   - 卡片链接进入 `/cardgame/`；
   - create、join、ai、rules 和 404 深路径正确；
   - 无会话 battle 路由回入口并提示；
   - 浏览器前进、后退正常；
   - CardGame 控制台无图片和 favicon 错误；
   - WebSocket 可以连接。
8. `git diff --check`、工作树 clean。

### 提交

`docs: 更新 CardGame 路由与资源说明`

## 最终审查与交付

1. 对每个 Task 依次执行：
   - 独立实现者自检；
   - 独立规格审查；
   - 独立质量审查；
   - 问题修复后重新审查。
2. 对 `main...HEAD` 做整分支最终审查。
3. 使用完成前验证流程重新运行新鲜的完整验证。
4. 快进合并到本地 `main`，合并后再次运行必要验证。
5. 发布 Hub 与 CardGame：
   - Hub 作品卡片和 SVG 封面；
   - CardGame HTML、JS、CSS、favicon；
   - 不发布 backend 和 ShotMarker。
6. 线上真实浏览器回归：
   - Hub → CardGame 跳转；
   - CardGame 静态和动态路由；
   - 本地图标、favicon、控制台和 OSS 请求；
   - CardGame 健康接口与 WebSocket。
7. 不执行 Git push，除非用户另行明确要求。
