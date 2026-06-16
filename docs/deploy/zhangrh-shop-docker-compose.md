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
│   ├── shotmarker/
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
     -> /shotmarker/ /usr/share/nginx/html/shotmarker
     -> /legacy-h5/ /usr/share/nginx/html/legacy-h5
     -> /api/       http://backend:3001
```

## 前端发布

前端发布现在分为两部分：

- Vite 构建生成的 JS / CSS / 图片 / favicon 等静态资源发布到阿里云 OSS。
- HTML 入口文件发布到 main 机器的 `/opt/zhangrh-shop/site`。

当前这条 `npm run publish -- <project>` 流程适用于 `frontend/project` 下的 Vite 项目：`hub`、`cardgame`、`shotmarker`。`legacy-h5` 仍按旧 H5 静态目录策略发布，不走本次 OSS 静态资源发布流程。

OSS 静态资源路径：

```txt
https://static.zhangrh.shop/zhangrh-shop/<project>/static/<file>
```

ECS HTML 路径：

```txt
dist/<project>/**/*.html -> /opt/zhangrh-shop/site/<project>/**/*.html
```

发布前需要在本地配置 OSS 环境变量：

```bash
export OSS_ACCESS_KEY_ID='你的 AccessKeyId'
export OSS_ACCESS_KEY_SECRET='你的 AccessKeySecret'
```

常规发布命令：

```bash
cd frontend
npm run publish -- hub
npm run publish -- cardgame
npm run publish -- shotmarker
```

底层流程：

```txt
git pull
npm run build -- <project>
node scripts/publish-oss-assets.mjs <project>
node scripts/deploy-static.mjs <project>
```

映射：

```txt
dist/hub/**/*.html       -> /opt/zhangrh-shop/site/hub/
dist/cardgame/**/*.html  -> /opt/zhangrh-shop/site/cardgame/
dist/shotmarker/**/*.html -> /opt/zhangrh-shop/site/shotmarker/
dist/<project>/static/**/* -> https://static.zhangrh.shop/zhangrh-shop/<project>/static/
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
