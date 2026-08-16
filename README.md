# zhangrh.shop

`zhangrh.shop` 是个人主页与独立项目的统一代码仓库，包含四个 Vite 前端和一个 Node/Express 后端。

## 在线入口

- [Hub](https://zhangrh.shop/hub/)：个人主页、作品与文章入口。
- [Cardgame](https://zhangrh.shop/cardgame/)：抽 5 选 3 的回合制卡牌 Demo。
- [ShotMarker](https://zhangrh.shop/shotmarker/)：ShotMarker 产品介绍与帮助页面。
- [Analytics](https://zhangrh.shop/analytics/)：公开的 Track 聚合数据概览。

## 组件职责

| 目录 | 职责 |
| --- | --- |
| `frontend/project/hub` | 主站、作品与文章展示 |
| `frontend/project/cardgame` | Cardgame 浏览器界面与 WebSocket 客户端 |
| `frontend/project/shotmarker` | ShotMarker 产品页面 |
| `frontend/project/analytics` | Track 聚合数据概览 |
| `frontend/common` | 前端项目共用的设备标识与埋点代码 |
| `backend` | Cardgame 健康检查、房间状态和 WebSocket 对局服务 |
| `automation/publish` | 根目录的交互式启动与发布脚本；相关测试由根 `npm test` 和 `npm run check` 调用 |

## 本地准备

项目要求 Node.js 24。前端和后端不是 npm workspace，需要分别安装锁文件依赖：

```bash
npm --prefix frontend ci
npm --prefix backend ci
```

## 常用命令

在仓库根目录执行：

```bash
# 交互式选择并启动前端项目或后端
npm run dev

# 运行根自动化、前端和后端测试
npm test

# 运行测试、lint、类型检查和全部前端构建
npm run check

# 交互式选择并发布前端项目或后端
npm run publish
```

## 文档入口

- [本地运行与发布手册](./RUNBOOK.md)
- [部署结构与只读验证](./docs/deploy/README.md)
- [前端埋点说明](./frontend/docs/track.md)
- [Hub 文章目录规则](./frontend/project/hub/content/articles/README.md)
- [Cardgame 规则与开发说明](./frontend/project/cardgame/README.md)
