# zhangrh.shop 服务器台账

## 当前结论

本文档记录 `zhangrh.shop` 相关服务器资产和运行职责。

以 `docs/deploy/zhangrh-shop-service-ledger.md` 为准，当前线上运行结构是：

```txt
main 机器 = 主站网关 + 主站静态资源 + cardgame 后端 + glitchtip 入口反代
glitchtip 机器 = GlitchTip 专用服务机器
back 机器 = 当前空置，不运行 back / backend 服务
```

注意：`back` 是服务器名称，不代表当前后端服务运行在这台机器上。当前 back / backend 服务运行在 `main` 机器上，由 `/opt/zhangrh-shop` 下的 Docker Compose 管理。

## 服务器资产快照

来源：云服务器控制台截图。

截图时间：2026-05-19。

| 服务器名称 | 实例 ID | 公网 IP | 地域 | 规格 | 状态 | 创建时间 | 到期时间 | 截图 CPU 使用率 | 当前职责 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| back | i-2ze0srs5gyvtuxbnj7kd | 59.110.217.51 | 华北2（北京） | 2 核 vCPU / 2 GiB | 运行中 | 2026-04-14 15:03:00 | 2027-04-14 23:59:59 | 2.625% | 当前空置，不运行线上业务 |
| glitchtip | i-2zeh3jd1bc4pi0ru52q3 | 123.56.165.87 | 华北2（北京） | 2 核 vCPU / 2 GiB | 运行中 | 2026-03-06 15:21:00 | 2027-03-06 23:59:59 | 4.933% | 运行 GlitchTip 服务 |
| main | i-2zehg2n0h794kfpgpw4v | 101.200.185.29 | 华北2（北京） | 2 核 vCPU / 2 GiB | 运行中 | 2026-01-15 09:45:00 | 2027-01-22 23:59:59 | 2.063% | 主站入口、nginx 网关、主站静态资源、cardgame 后端、GlitchTip 入口反代 |

截图中三台服务器均未安装云监控插件，因此内存使用率和云盘使用率没有控制台数据。

## 服务器职责

### main 机器

main 机器是当前线上主机。

主要职责：

- 承载 `zhangrh.shop` 的公网入口
- 承载 `/hub/` 静态站点
- 承载 `/cardgame/` 静态站点
- 承载 `/api/cardgame/` 后端 API / WebSocket
- 运行 `zhangrh-nginx` 容器
- 运行 `zhangrh-backend` 容器
- 接收 `glitchtip.zhangrh.shop` 请求
- 将 `glitchtip.zhangrh.shop` 反向代理到 glitchtip 机器

部署根目录：

```txt
/opt/zhangrh-shop
```

main 机器上的服务由 Docker Compose 管理，参考：

- `docs/deploy/zhangrh-shop-docker-compose.md`
- `docs/deploy/zhangrh-shop-service-ledger.md`

### glitchtip 机器

glitchtip 机器只负责 GlitchTip 自身服务。

主要职责：

- 使用 Docker / Docker Compose 运行 GlitchTip
- 对 main 机器暴露 GlitchTip Web 服务端口
- 不承载 `zhangrh.shop` 主站静态资源
- 不承载 `/api/cardgame/`
- 不直接作为 `glitchtip.zhangrh.shop` 的 HTTPS 入口

公网 IP：

```txt
123.56.165.87
```

实际反代 upstream 地址和端口以 main 机器 nginx 配置为准。

### back 机器

back 机器当前空置。

当前规则：

- 不运行 `zhangrh-backend`
- 不运行 cardgame 后端
- 不运行 nginx 网关
- 不运行 GlitchTip
- 不参与当前 `zhangrh.shop` 发布链路

公网 IP：

```txt
59.110.217.51
```

不要因为服务器名称是 `back` 就把后端发布到这台机器。当前后端发布目标仍然是 `main` 机器上的 `/opt/zhangrh-shop/backend`。

## 服务到服务器映射

| 服务 / 路由 | 实际运行机器 | 运行方式 | 说明 |
| --- | --- | --- | --- |
| `zhangrh.shop` | main | nginx 容器 | 主域名入口 |
| `zhangrh.shop/hub/` | main | nginx 静态文件 | 静态产物位于 `/opt/zhangrh-shop/site/hub` |
| `zhangrh.shop/cardgame/` | main | nginx 静态文件 | 静态产物位于 `/opt/zhangrh-shop/site/cardgame` |
| `zhangrh.shop/api/cardgame/` | main | `zhangrh-backend` 容器 | 后端服务运行在 main，不运行在 back |
| `glitchtip.zhangrh.shop` 入口 | main | nginx 反向代理 | HTTPS 和公网入口在 main |
| GlitchTip 应用服务 | glitchtip | Docker / Docker Compose | 真正的 GlitchTip 服务运行在 glitchtip |
| `static.zhangrh.shop` | 非 ECS | OSS 静态资源 | 承载前端构建生成的 JS / CSS / 图片 / favicon 等静态资源 |
| back 服务器 | back | 无 | 当前空置 |

## 请求流

主站请求：

```txt
用户
↓
zhangrh.shop
↓
main 机器 / zhangrh-nginx
├── /hub/ -> /opt/zhangrh-shop/site/hub
├── /cardgame/ -> /opt/zhangrh-shop/site/cardgame
└── /api/cardgame/ -> zhangrh-backend:3001
```

GlitchTip 请求：

```txt
用户
↓
glitchtip.zhangrh.shop
↓
main 机器 / zhangrh-nginx
↓
反向代理到 glitchtip 机器
↓
glitchtip 机器 / GlitchTip Docker 服务
```

back 服务器：

```txt
当前无线上请求进入 back 机器
当前无服务部署在 back 机器
```

## 运维规则

1. 当前主站和后端发布只面向 main 机器。
2. backend / back 服务不发布到 back 服务器。
3. main 机器上的运行目录统一使用 `/opt/zhangrh-shop`。
4. main 机器上的 nginx 和 backend 由 Docker Compose 管理。
5. GlitchTip 服务只部署在 glitchtip 机器。
6. `glitchtip.zhangrh.shop` 的公网入口和 HTTPS 证书在 main 机器处理。
7. back 机器如果未来要复用，必须先更新本文档和 `zhangrh-shop-service-ledger.md`，再调整发布脚本或 DNS。
8. 不要根据服务器名称推断运行职责，以本文档和线上配置为准。

## 常用检查命令

### main 机器

```bash
cd /opt/zhangrh-shop
docker compose ps
docker logs --tail=100 zhangrh-nginx
docker logs --tail=100 zhangrh-backend
docker exec zhangrh-nginx nginx -t
```

公网验证：

```bash
curl -k -I https://zhangrh.shop/hub/
curl -k -I https://zhangrh.shop/cardgame/
curl -k https://zhangrh.shop/api/cardgame/health
curl -k -I https://glitchtip.zhangrh.shop/
```

### glitchtip 机器

```bash
docker ps
docker compose ps
```

如需进一步排查 GlitchTip，进入实际 GlitchTip 部署目录后再查看 compose 状态和容器日志。

### back 机器

用于确认当前空置状态：

```bash
docker ps
ss -tulpn
systemctl --type=service --state=running
```

如果发现 back 机器上出现线上业务进程，需要先确认是否为临时调试或误部署，再决定是否清理或补充台账。

## 待补充信息

- 三台服务器的内网 IP
- 三台服务器的安全组规则
- main 机器反代到 glitchtip 机器的实际 upstream 地址和端口
- `zhangrh.shop`、`glitchtip.zhangrh.shop` 的 DNS 解析记录截图
- 是否需要安装云监控插件以观察内存和云盘使用率
- back 机器未来是否释放、保留备用，还是迁移为新的独立后端机器

## 当前推荐理解

当前不要把 `back` 服务器理解为后端机器。

更准确的理解是：

```txt
main = 当前生产入口和业务运行机器
glitchtip = 错误监控服务机器
back = 已购买但当前空置的备用机器
```
