# zhangrh.shop Docker Compose 部署

## 当前线上结构

`zhangrh.shop` 当前部署在 main 机器的 `/opt/zhangrh-shop`：

```txt
/opt/zhangrh-shop
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
├── logs/
│   └── nginx/
└── backend/
    ├── .dockerignore
    ├── Dockerfile
    ├── server.js
    ├── package.json
    ├── package-lock.json
    └── projects/
```

## 容器

```txt
zhangrh-nginx     nginx:alpine
zhangrh-backend   node:20-alpine 构建产物
```

请求流：

```txt
zhangrh.shop
  -> zhangrh-nginx
     -> /hub/       /usr/share/nginx/html/hub
     -> /cardgame/  /usr/share/nginx/html/cardgame
     -> /shotmaker/ /usr/share/nginx/html/shotmaker
     -> /legacy-h5/ /usr/share/nginx/html/legacy-h5
     -> /api/       http://backend:3001
```

## 前端发布

前端静态产物发布到 `/opt/zhangrh-shop/site`：

```bash
cd frontend
npm run lint
npx tsc -p tsconfig.app.json
npm run build -- hub
npm run deploy -- hub
npm run build -- cardgame
npm run deploy -- cardgame
npm run build -- legacy-h5
npm run deploy -- legacy-h5
```

映射：

```txt
dist/hub/       -> /opt/zhangrh-shop/site/hub/
dist/cardgame/  -> /opt/zhangrh-shop/site/cardgame/
dist/shotmaker/ -> /opt/zhangrh-shop/site/shotmaker/
dist/legacy-h5/ -> /opt/zhangrh-shop/site/legacy-h5/
```

前端发布后不需要 reload Nginx。

新增静态项目时，Nginx 需要有对应的 path location。`legacy-h5` 的线上路由应包含：

```nginx
location = /legacy-h5 {
    return 301 /legacy-h5/;
}

location /legacy-h5/ {
    try_files $uri $uri/ /legacy-h5/index.html;
}
```

## 后端发布

后端运行文件发布到 `/opt/zhangrh-shop/backend`，然后由服务器上的 Docker Compose 重建 `backend` 服务：

```bash
cd backend
npm run publish
```

发布脚本会远程执行：

```bash
cd /opt/zhangrh-shop
docker compose up -d --build backend
```

后端不再使用 PM2。

## 验证

本地验证：

```bash
curl -k -I https://zhangrh.shop/hub/
curl -k -I https://zhangrh.shop/cardgame/
curl -k -I https://zhangrh.shop/legacy-h5/
curl -k -I https://zhangrh.shop/legacy-h5/1905_word/
curl -k -I https://zhangrh.shop/legacy-h5/1907_cp/
curl -k -I https://zhangrh.shop/legacy-h5/1908_parade/
curl -k -I https://zhangrh.shop/legacy-h5/2002_spell/
curl -k -I https://zhangrh.shop/legacy-h5/2007_picky/
curl -k https://zhangrh.shop/api/cardgame/health
```

服务器验证：

```bash
cd /opt/zhangrh-shop
docker compose ps
docker logs --tail=100 zhangrh-nginx
docker logs --tail=100 zhangrh-backend
docker exec zhangrh-nginx nginx -t
```
