# zhangrh.shop 域名与服务台账

## 当前结论

zhangrh.shop 作为主域名。
zhangrh.top 暂不纳入本次部署链路。

两个域名目前都已经完成备案：

- zhangrh.shop：备案完成
- zhangrh.top：备案完成

## 路由规划

| 地址                       | 用途                            | 状态                   |
| -------------------------- | ------------------------------- | ---------------------- |
| zhangrh.shop/              | 主页，短期可以继续 301 到 /hub/ | 保留                   |
| zhangrh.shop/hub/          | 主项目 / 主入口                 | 主用                   |
| zhangrh.shop/cardgame/     | 当前卡牌项目                    | 先保留                 |
| zhangrh.shop/api/cardgame/ | 当前后端 API / WebSocket        | Docker backend         |
| static.zhangrh.shop        | OSS 静态资源                    | 不参与当前应用发布     |
| glitchtip.zhangrh.shop     | GlitchTip 独立服务              | 独立子域名             |
| zhangrh.top                | 301 到 zhangrh.shop             | 需要单独处理证书和接入 |

## 设计原则

- `zhangrh.shop` 是主品牌域名。
- `/hub/` 是当前主项目入口。
- `/cardgame/` 和 `/api/cardgame/` 暂时服务当前卡牌项目。
- `static.zhangrh.shop` 当前作为 OSS 静态资源域名，不参与当前应用发布。
- `glitchtip.zhangrh.shop` 是独立服务，不混在主站路径下。
- `zhangrh.top` 不纳入本次部署计划。

## 待确认事项

- zhangrh.shop/ 当前是否已经正确 301 到 /hub/
- zhangrh.top 是否已经正确 301 到 zhangrh.shop
- zhangrh.shop 和 zhangrh.top 的 HTTPS 证书是否都覆盖完整
- glitchtip.zhangrh.shop 的 DNS、证书、反代是否都正常
- static.zhangrh.shop 是否现在就绑定 OSS，还是先预留

## 当前线上结构

### 目录结构

```txt
/opt/zhangrh-shop/
├── compose.yml
├── nginx/
│ └── conf.d/
│ └── zhangrh.shop.conf
├── certs/
│ ├── zhangrh.shop.pem
│ └── zhangrh.shop.key
├── site/
│ ├── hub/
│ └── cardgame/
└── backend/
├── Dockerfile
├── server.js
├── package.json
├── package-lock.json
└── projects/
```

### 转发逻辑

```txt
用户
↓
zhangrh.shop
↓
nginx 容器
├── /hub/ -> /opt/zhangrh-shop/site/hub
├── /cardgame/ -> /opt/zhangrh-shop/site/cardgame
└── /api/ -> backend 容器:3001
```

### 当前规则

1. 服务器部署根目录统一用 /opt/zhangrh-shop
2. nginx 和 backend 都归 docker compose 管
3. 前端只发布 dist 静态产物到 /opt/zhangrh-shop/site
4. 后端发布源码到 /opt/zhangrh-shop/backend，然后 docker compose up -d --build backend
5. 不再使用 PM2
6. 不再兼容 /var/www/zhangrh.shop
7. 不再保留 zhangrh.top 配置
