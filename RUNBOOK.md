# zhangrh.shop 运行手册

当前仓库维护 `hub`、`cardgame`、`shotmarker` 三个前端项目和一个 `backend` 服务。所有命令均以仓库根目录为起点。

## 环境准备

使用 Node.js 24，并分别安装前后端依赖：

```bash
npm --prefix frontend ci
npm --prefix backend ci
```

## 本地启动

交互式选择一个前端项目或后端：

```bash
npm run dev
```

也可以在不同终端直接启动：

```bash
npm --prefix backend run dev
npm --prefix frontend run dev -- hub
npm --prefix frontend run dev -- cardgame
npm --prefix frontend run dev -- shotmarker
```

Cardgame 的 Vite 开发服务器会把 `/api` 和 WebSocket 请求代理到 `http://localhost:3001`，因此联调时需要同时启动后端和 Cardgame 前端。

## 本地验证

```bash
# 根自动化、前端和后端测试
npm test

# 测试、lint、类型检查和全部前端构建
npm run check

# 单独构建一个前端项目
npm --prefix frontend run build -- hub

# 单独测试后端
npm --prefix backend test
```

## 发布前提

- 本机可通过 SSH 访问 `zhangrh.shop`，并已安装 `rsync`。
- 发布前端前设置 `OSS_ACCESS_KEY_ID` 和 `OSS_ACCESS_KEY_SECRET`。
- 前端发布脚本首先执行 `git pull`；运行前确认当前分支和工作区允许拉取远端更新。

## 埋点查询

默认查询最近 30 个上海自然日：

```bash
curl --fail-with-body \
  'https://zhangrh.shop/api/track/summary?days=30'
```

按项目查询最近 90 天并保存 JSON：

```bash
curl --fail-with-body \
  'https://zhangrh.shop/api/track/summary?days=90&project=hub' \
  --output track-summary.json
```

该接口是公开只读汇总；原始客户端事件和设备标识可伪造，不能把结果用于计费、风控或审计。稳定错误的处置方式如下：

- `400`：调用参数错误，修正 `days`/`project`，或删除未知、重复参数。
- `429`：Nginx 公网限流，等待后重试。
- `503 track_query_busy`：已有扫描，至少等待 `Retry-After` 指定的秒数。
- `503 track_log_unavailable`：只检查 Track 挂载、目录权限、gzip 和轮转竞争；不要把重启整个站点作为第一动作。
- `503 track_log_too_large`：JSONL 已超过第一阶段设计规模，停止重复查询并重新设计存储。
- `503 track_query_timeout`：扫描超过 20 秒，检查文件规模、损坏 gzip 和主机 I/O。

## 发布

在根目录交互式选择发布目标：

```bash
npm run publish
```

也可以直接发布指定目标：

```bash
npm --prefix frontend run publish -- hub
npm --prefix frontend run publish -- cardgame
npm --prefix frontend run publish -- shotmarker
npm --prefix backend run publish
```

前端发布流程与仓库脚本一致：

1. 在仓库根目录执行 `git pull`。
2. 构建指定前端项目。
3. 上传 `dist/<project>/static` 下的静态资源到 OSS，并把 HTML 中的资源地址改写为 `https://static.zhangrh.shop/zhangrh-shop/<project>/static/...`。
4. 把 `dist/<project>` 中的 HTML 上传到 `/opt/zhangrh-shop/site/<project>/`。

后端发布会把运行文件同步到 `/opt/zhangrh-shop/backend/`，随后在 `/opt/zhangrh-shop` 执行：

```bash
docker compose up -d --build backend
```

部署结构和发布后的只读检查见 [部署文档](./docs/deploy/README.md)。
