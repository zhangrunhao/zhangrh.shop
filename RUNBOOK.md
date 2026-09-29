# zhangrh.shop 运行手册

当前仓库维护 `hub`、`cardgame`、`shotmarker`、`analytics`、`webtrace` 五个前端项目和一个 `backend` 服务。所有命令均以仓库根目录为起点。

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
npm --prefix frontend run dev -- analytics
npm --prefix frontend run dev -- webtrace
```

前端 Vite 开发服务器会把 `/api` 请求代理到 `http://localhost:3001`，Cardgame 的 WebSocket 也使用该代理。因此联调 Cardgame 或 Analytics 时需要同时启动后端和对应前端。

## 本地验证

```bash
# 根自动化、前端和后端测试
npm test

# 测试、lint、类型检查和全部前端构建
npm run check

# 单独构建一个前端项目
npm --prefix frontend run build -- hub
npm --prefix frontend run build -- webtrace

# 单独测试后端
npm --prefix backend test
```

## 发布前提

- 本机可通过 SSH 访问 `zhangrh.shop`，并已安装 `rsync`。
- 更换公司、家庭、热点或 VPN 网络后，先按下方 SSH 排查步骤核对当前公网出口 IP 的访问授权。
- 发布前端前设置 `OSS_ACCESS_KEY_ID` 和 `OSS_ACCESS_KEY_SECRET`。
- 前端发布脚本首先执行 `git pull`；运行前确认当前分支和工作区允许拉取远端更新。

### SSH 连接超时

发布时，如果 Git 拉取、构建或 OSS 上传正常，但连接 `zhangrh.shop:22` 超时，**优先检查阿里云安全组是否允许当前网络的公网出口 IP 访问 TCP 22 端口**。这是此类故障的首要排查项，原因仍需按当次连接结果确认。

1. 确认当前 SSH 连接实际使用的公网出口 IP；公司内网 IP 不能作为公网来源，切换网络、VPN 或代理后需重新核对出口。
2. 检查发布服务器实例绑定的阿里云安全组，其入方向 TCP 22 规则的授权来源应包含该公网出口 IP，按实际需要放行对应来源。
3. 授权更新后先执行下面的 SSH 连通检查；成功后再运行原有发布命令。

```bash
ssh -o BatchMode=yes -o ConnectTimeout=10 root@zhangrh.shop true
```

如果当前出口已获授权仍超时，再检查连接路径、代理和服务器 SSH 服务。若返回 `Permission denied`，则已进入身份认证阶段，应检查 SSH 用户、密钥或 Agent。具体生产规则和来源地址由私有台账维护，不写入本手册。

## 埋点趋势查询

协议、事件目录、存储模型和接口限制以 [Track 当前文档](./docs/current/track.md)为准。

趋势接口的 `project`、`event`、`days` 全部必填。查询 Hub 默认事件最近 30 个上海自然日：

```bash
curl --fail-with-body \
  'https://zhangrh.shop/api/track/trend?project=hub&event=home_page_load&days=30'
```

查询 ShotMarker 默认事件并保存 JSON：

```bash
curl --fail-with-body \
  'https://zhangrh.shop/api/track/trend?project=shotmarker&event=app_launch&days=30' \
  --output track-trend.json
```

按 Track 当前文档核对响应。错误按以下方式处置：

- `400`：修正缺失、非法、未知或重复的查询参数。
- `503 track_query_busy`：已有扫描，至少等待 `Retry-After` 指定的秒数再手工重试。
- `503 track_log_unavailable`：检查 Backend 的 Track 只读挂载、目录权限和当前日志文件。
- `503 track_log_too_large` 或 `track_query_timeout`：停止重复查询，检查文件规模、单行异常和主机 I/O，建立存储改造 Change。
- `500 internal_error`：检查 Backend 日志。

需要核对生产文件时，在已获访问授权的目标 Linux 主机按 Track 当前文档的阈值检查文件规模：

```bash
stat -c '%s bytes %n' /opt/zhangrh-shop/data/track/events.jsonl
```

## Track 生产变更

Track 写入验证会产生真实事件。只有对应 Change 明确授权时才执行。配置或存储迁移必须在私有仓库建立 Change，先完成只读预检，再取得外部变更和破坏性操作授权。

Track schema 或接收配置变更后，获准的写入验收应通过正常访问 Hub 产生事件，确认 `/track` 返回 `204`，并在目标主机只检查最新记录的字段、类型和格式。不得输出、截图或记录真实 `device_id`。

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
npm --prefix frontend run publish -- analytics
npm --prefix frontend run publish -- webtrace
npm --prefix backend run publish
```

目标发现和命令委托见 [Automation](./docs/current/automation.md)；部署流程、副作用和验证边界见[部署与生产边界](./docs/current/deployment.md)。

## 发布后只读检查

```bash
curl --fail --head https://zhangrh.shop/hub/
curl --fail --head https://zhangrh.shop/cardgame/
curl --fail --head https://zhangrh.shop/shotmarker/
curl --fail --head https://zhangrh.shop/analytics/
curl --fail --head https://zhangrh.shop/webtrace/
curl --fail --head https://zhangrh.shop/webtrace/support
curl --fail --head https://zhangrh.shop/webtrace/privacy
curl --fail-with-body https://zhangrh.shop/api/cardgame/health
```

五个前端项目及 WebTrace 的支持、隐私路由应返回可访问的 HTML；Cardgame health 应包含 `ok: true` 和 `project: "cardgame"`。按“埋点趋势查询”执行一次只读 Track 查询，并按 Track 当前文档核对响应。页面可访问但资源加载失败时，检查浏览器中 `static.zhangrh.shop` 的资源请求。
