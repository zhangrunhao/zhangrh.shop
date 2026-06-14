# zhangrh.shop 域名与服务台账

## 当前结论

`zhangrh.shop` 作为当前主域名。

`zhangrh.top` 已废弃，不再纳入当前部署、跳转、证书、反代和发布链路。

当前线上服务以 `zhangrh.shop` 为主入口，`glitchtip.zhangrh.shop` 作为独立子域名服务。

## 域名状态

| 域名 | 用途 | 当前状态 |
| --- | --- | --- |
| zhangrh.shop | 主品牌域名 / 主站入口 | 主用 |
| static.zhangrh.shop | OSS 静态资源域名 | 承载前端构建生成的 JS / CSS / 图片 / favicon 等静态资源 |
| glitchtip.zhangrh.shop | GlitchTip 独立服务 | 由 main 机器反代到 glitchtip 机器 |
| zhangrh.top | 旧域名 | 已废弃 |

## 路由规划

| 地址 | 用途 | 状态 |
| --- | --- | --- |
| zhangrh.shop/ | 主页，短期可以继续 301 到 `/hub/` | 保留 |
| zhangrh.shop/hub/ | 主项目 / 主入口 | 主用 |
| zhangrh.shop/cardgame/ | 当前卡牌项目 | 先保留 |
| zhangrh.shop/legacy-h5/ | 旧 H5 活动合集，包含 `1905_word`、`1907_cp`、`1908_parade`、`2002_spell`、`2007_picky` | 静态发布 |
| zhangrh.shop/api/cardgame/ | 当前卡牌项目后端 API / WebSocket | Docker backend |
| static.zhangrh.shop | OSS 静态资源 | 承载前端构建生成的 JS / CSS / 图片 / favicon 等静态资源 |
| glitchtip.zhangrh.shop | GlitchTip 独立服务 | main 机器反代到 glitchtip 机器 |
| zhangrh.top | 旧域名 | 已废弃，不再处理 |

## 设计原则

- `zhangrh.shop` 是当前唯一主品牌域名。
- `/hub/` 是当前主项目入口。
- `/cardgame/` 和 `/api/cardgame/` 暂时服务当前卡牌项目。
- `/legacy-h5/` 是旧 H5 活动合集入口，只发布本地静态源码和素材，不走本次 Vite OSS 发布流程，不接旧 API、OSS/CDN、微信登录、分享签名、敏感词、打点或拼字保存服务。
- `static.zhangrh.shop` 是阿里云 OSS 自定义域名，用于承载前端构建生成的 JS / CSS / 图片 / favicon 等静态资源。HTML 入口仍发布到 main 机器的 `/opt/zhangrh-shop/site/<project>/`。
- `glitchtip.zhangrh.shop` 是独立服务，不混在主站路径下。
- `glitchtip.zhangrh.shop` 的入口在 main 机器上，由 main 机器上的 nginx 反向代理到 glitchtip 机器。
- glitchtip 机器上使用 Docker 启动 GlitchTip 服务。
- `zhangrh.top` 已废弃，不再配置 301、不再维护证书、不再接入 nginx、不再参与部署链路。

## 待确认事项

- `zhangrh.shop/` 当前是否已经正确 301 到 `/hub/`
- `zhangrh.shop` 的 HTTPS 证书是否覆盖完整
- `glitchtip.zhangrh.shop` 的 DNS 是否指向 main 机器
- main 机器上的 `glitchtip.zhangrh.shop` 证书是否正常
- main 机器是否能稳定反代到 glitchtip 机器上的 GlitchTip 服务
- glitchtip 机器上的 Docker GlitchTip 服务是否开机自启、容器状态是否正常
- `static.zhangrh.shop` OSS 自定义域名、证书和回源 / CNAME 配置是否完整

## 当前线上结构

### 机器职责

#### main 机器

main 机器负责当前主站入口和统一 nginx 网关。

主要职责：

- 承载 `zhangrh.shop` 的公网入口
- 承载 `/hub/` HTML 入口
- 承载 `/cardgame/` HTML 入口
- 承载 `/legacy-h5/` 静态目录
- 承载 `/api/cardgame/` 后端 API / WebSocket
- 承载 `glitchtip.zhangrh.shop` 的入口
- 将 `glitchtip.zhangrh.shop` 反向代理到 glitchtip 机器

#### glitchtip 机器

glitchtip 机器专门负责运行 GlitchTip 服务。

主要职责：

- 使用 Docker 启动 GlitchTip
- 对 main 机器暴露 GlitchTip 服务端口
- 不直接承载主站业务
- 不参与 `/hub/`、`/cardgame/`、`/api/cardgame/` 的发布链路

## main 机器目录结构

```txt
/opt/zhangrh-shop/
├── compose.yml
├── nginx/
│   └── conf.d/
│       └── zhangrh.shop.conf
├── certs/
│   ├── zhangrh.shop.pem
│   └── zhangrh.shop.key
├── site/
│   ├── hub/
│   ├── cardgame/
│   ├── shotmaker/
│   └── legacy-h5/
└── backend/
    ├── Dockerfile
    ├── server.js
    ├── package.json
    ├── package-lock.json
    └── projects/
```

## main 机器转发逻辑

```txt
用户
↓
zhangrh.shop
↓
main 机器 nginx 容器
├── /hub/ -> /opt/zhangrh-shop/site/hub
├── /cardgame/ -> /opt/zhangrh-shop/site/cardgame
├── /legacy-h5/ -> /opt/zhangrh-shop/site/legacy-h5
└── /api/cardgame/ -> backend 容器:3001
```

```txt
用户
↓
glitchtip.zhangrh.shop
↓
main 机器 nginx 容器
↓
反向代理到 glitchtip 机器
↓
glitchtip 机器 Docker GlitchTip 服务
```

## glitchtip 机器结构

glitchtip 机器上单独运行 GlitchTip 服务。

```txt
glitchtip 机器
↓
Docker / Docker Compose
↓
GlitchTip 服务
```

GlitchTip 不部署在 main 机器上。

main 机器只负责：

- 接收 `glitchtip.zhangrh.shop` 请求
- 处理 HTTPS / nginx 入口
- 反向代理到 glitchtip 机器

glitchtip 机器负责：

- 运行 GlitchTip 容器
- 提供 GlitchTip Web 服务
- 维护 GlitchTip 自身依赖服务

## 当前规则

1. 服务器部署根目录统一用 `/opt/zhangrh-shop`
2. main 机器上的 nginx 和 backend 都归 Docker Compose 管理
3. 前端 HTML 入口发布到 `/opt/zhangrh-shop/site`，JS / CSS / 图片 / favicon 等静态资源发布到 `static.zhangrh.shop` 对应 OSS
4. 后端发布源码到 `/opt/zhangrh-shop/backend`
5. 后端更新后执行 `docker compose up -d --build backend`
6. 不再使用 PM2
7. 不再兼容 `/var/www/zhangrh.shop`
8. 不再维护 `zhangrh.top` 配置
9. `zhangrh.top` 已废弃，不再做 301 跳转
10. `legacy-h5` 发布到 `/opt/zhangrh-shop/site/legacy-h5`，线上 nginx 必须配置 `/legacy-h5/` 到对应静态目录的 `try_files` 路由
11. `glitchtip.zhangrh.shop` 不部署在 main 机器本地，只由 main 机器反代到 glitchtip 机器
12. glitchtip 机器上的 GlitchTip 使用 Docker 启动和管理

## 已废弃内容

以下内容不再参与当前部署：

- `zhangrh.top`
- `zhangrh.top -> zhangrh.shop` 的 301 跳转
- `zhangrh.top` HTTPS 证书维护
- `zhangrh.top` nginx 配置
- `/var/www/zhangrh.shop`
- PM2 管理方式

## 当前推荐理解

当前线上结构可以理解为：

```txt
main 机器 = 主站网关 + 前端 HTML 入口 + legacy-h5 静态目录 + cardgame 后端 + glitchtip 入口反代

glitchtip 机器 = GlitchTip 专用服务机器
```

也就是说：

- `zhangrh.shop` 相关服务主要在 main 机器上
- `glitchtip.zhangrh.shop` 的域名入口在 main 机器上
- 真正的 GlitchTip 服务运行在 glitchtip 机器上
- `zhangrh.top` 已经废弃，不再维护
