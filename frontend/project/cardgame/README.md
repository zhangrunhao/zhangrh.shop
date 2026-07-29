# Cardgame

Cardgame 是一个浏览器双人或人机回合制卡牌 Demo。前端负责房间入口、选牌排序和结算展示；后端负责房间、牌库、回合推进和最终结算。当前运行规则以 `backend/projects/cardgame.js` 为准。

## 对战模式

- 创建房间：生成四位房间号，等待另一名玩家加入。
- 加入房间：使用四位房间号加入尚未满员的房间。
- 人机对战：立即创建玩家与机器人对局；机器人延迟约 1.2 秒随机选择手牌中的最多三张。

房间和对局状态保存在后端进程内存中，没有跨进程或重启持久化。

## 页面路由

CardGame 使用浏览器 History API 管理页面状态，不依赖 React Router。各页面均有明确 URL：

| URL | 页面 |
| --- | --- |
| `/cardgame/` | 入口与模式选择 |
| `/cardgame/create` | 创建房间 |
| `/cardgame/join` | 加入房间 |
| `/cardgame/ai` | 人机对战 |
| `/cardgame/rules` | 游戏规则 |
| `/cardgame/room/:roomId` | 等待玩家或准备开始 |
| `/cardgame/battle/:roomId` | 对战中 |
| `/cardgame/result/:roomId` | 对战结果 |

其中 `roomId` 是四位数字。用户主动进入创建、加入、人机或规则页面时使用 `pushState`，因此浏览器 Back / Forward 会按访问顺序切换页面；服务端推动等待、对战、结果阶段变化时使用 `replaceState`，避免历史记录保留已经失效的旧对局阶段。主动离开对局也会清理连接和页面内存中的会话状态。

静态页面可以直接打开和刷新。`room`、`battle`、`result` 路由依赖当前页面内存中的 WebSocket 会话，不提供刷新恢复、自动重连或服务端会话恢复。直接打开或刷新这些动态路由时，如果找不到匹配的内存会话，页面会返回 `/cardgame/` 并提示：`对局已结束或无法恢复，请重新开始。`

未知或格式错误的路径进入 CardGame 自己的 404 页面。

## 前端资源

入口、规则和对战界面的 12 个语义图标均为仓库内的 React SVG 组件，使用 `currentColor` 继承界面色彩，不依赖外部图片服务。CardGame favicon 同样是仓库内的 `favicon.svg`，并由项目构建和发布流程一并处理。

## 基础规则

- 每位玩家初始 HP 为 10；服务端只限制 HP 最低为 0，不设置回血上限。
- 每副牌 15 张：进攻 `A`、防守 `D`、休养 `R` 各 5 张。
- 每回合抽 5 张，从中选择 3 张并确定先后顺序。
- 双方都提交后，第一张对第一张、第二张对第二张、第三张对第三张，依次累计 HP 变化。
- 本回合抽出的全部手牌在结算后进入弃牌堆，包括没有选中的牌。牌库耗尽时洗回弃牌堆继续抽取。
- 三次对冲全部结算后，若任一方 HP 为 0，或已经完成第 10 回合，则结束对局并比较双方 HP；相同为平局。
- 未结束时，所有真人玩家确认本回合结果后进入下一回合。对局结束后支持再来一局。

## 服务端结算矩阵

每个单元格为“我方 HP 变化 / 对方 HP 变化”。这是当前后端实际执行的矩阵，不沿用旧文档或界面中的过期数值。

| 我方 \ 对方 | 进攻 A | 防守 D | 休养 R |
| --- | --- | --- | --- |
| 进攻 A | `-2 / -2` | `-1 / 0` | `+1 / -2` |
| 防守 D | `0 / -1` | `-1 / -1` | `0 / +1` |
| 休养 R | `-2 / +1` | `+1 / 0` | `0 / 0` |

## 已知差异 / 技术债

当前前端的规则面板仍有误：`frontend/project/cardgame/app.tsx` 中“游戏规则 → 对冲矩阵”部分展示的是旧矩阵，与后端实际结算不一致。例如该面板仍把 `A-A`、`A-D`、`D-D`、`R-R` 等组合显示为旧效果，会直接误导玩家的出牌策略。

本轮路由和资源调整没有修正规则矩阵。修复并重新发布相关规则页面前，判断实际 HP 变化必须以上方服务端结算矩阵和 `backend/projects/cardgame.js` 的 `DELTA_MATRIX` 为准。

## 接口

- `GET /api/cardgame/health`：健康检查。
- `GET /api/cardgame/rooms`：当前进程内的房间摘要。
- `WS /api/cardgame/ws`：创建/加入房间、出牌、确认回合和再战。

生产环境使用当前站点的 `/api/cardgame/ws`。开发环境优先连接 Vite 的同源代理，必要时回退到当前主机的 `3001` 端口。

## 本地启动

先使用 Node.js 24 安装前后端依赖：

```bash
npm --prefix frontend ci
npm --prefix backend ci
```

在两个终端中分别启动：

```bash
npm --prefix backend run dev
npm --prefix frontend run dev -- cardgame
```

也可以分别运行根目录的 `npm run dev`，在两个终端中选择后端和 `cardgame`。

## 验证

```bash
# 健康检查（后端启动后）
curl http://localhost:3001/api/cardgame/health

# Cardgame 前端构建
npm --prefix frontend run build -- cardgame

# 仓库完整测试
npm test
```

浏览器联调至少覆盖创建房间、四位房间号加入、人机对战、抽 5 选 3 排序、逐对结算、回合确认和再战。
