# zhangrh.shop 启动与发布说明

本文档只记录日常最常用的本地启动、验证和发布命令。

## 目录结构

```txt
zhangrh.shop/
├── frontend/    多个 Vite 前端项目：hub、cardgame、shotmarker
├── backend/     Node/Express 后端，目前主要服务 cardgame
└── automation/  根目录交互式启动和发布脚本
```

## 首次准备

前端和后端不是 npm workspace，需要分别安装依赖：

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm install

cd /Users/runhaozhang/Documents/project/zhangrh.shop/backend
npm install
```

## 本地启动

日常只需要在项目根目录执行：

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
npm run dev
```

然后用上下键选择要启动的项目：

- `后端`
- `前端 (hub)`
- `前端 (cardgame)`
- `前端 (shotmarker)`

如果选择前端项目，Vite 会输出本地访问地址，通常是：

```txt
http://127.0.0.1:5173/
```

如果选择后端，会启动 `backend` 的开发服务。

## 本地验证

### 根目录自动化测试

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
npm test
```

### 前端验证

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run lint
npm run build -- hub
```

把 `hub` 换成其他项目名可构建对应前端项目。

### 后端测试

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/backend
npm test
```

## 发布前提

发布需要本机具备：

- 可以访问服务器 `root@101.200.185.29` 的 SSH 权限。
- 已安装 `rsync`。
- 发布前端时需要 OSS 环境变量：

```bash
export OSS_ACCESS_KEY_ID="..."
export OSS_ACCESS_KEY_SECRET="..."
```

前端发布会执行 `git pull`，发布前先确认当前分支和工作区状态符合预期。

## 发布

日常只需要在项目根目录执行：

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
npm run publish
```

运行后选择要发布的目标：

- `后端`
- `前端 (hub)`
- `前端 (cardgame)`
- `前端 (shotmarker)`

选择前端项目时，发布流程是：

1. 在仓库根目录执行 `git pull`。
2. 构建指定前端项目。
3. 上传 `dist/<project>/static` 静态资源到 OSS。
4. 重写 HTML 中的静态资源地址。
5. 上传 HTML 到服务器目录：

```txt
root@101.200.185.29:/opt/zhangrh-shop/site/<project>/
```

默认静态资源地址：

```txt
https://static.zhangrh.shop/zhangrh-shop/<project>/static/<file>
```

选择后端时，发布流程是：

1. 用 `rsync` 上传后端运行文件到服务器：

```txt
root@101.200.185.29:/opt/zhangrh-shop/backend/
```

2. 在服务器执行：

```bash
cd /opt/zhangrh-shop && docker compose up -d --build backend
```

## 常用目标

```bash
# 启动前端或后端：执行后选择项目
cd /Users/runhaozhang/Documents/project/zhangrh.shop
npm run dev

# 发布前端或后端：执行后选择项目
cd /Users/runhaozhang/Documents/project/zhangrh.shop
npm run publish

# 单独构建 hub
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run build -- hub

# 单独测试后端
cd /Users/runhaozhang/Documents/project/zhangrh.shop/backend
npm test
```
