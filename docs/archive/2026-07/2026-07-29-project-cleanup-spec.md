# 项目平衡整理设计

## 背景

当前仓库包含 Hub、Cardgame、ShotMarker 三个前端项目，一个服务 Cardgame 的
Node/Express 后端，以及根目录的启动和发布自动化。现有业务代码可以构建和通过
静态检查，但工程入口、运行时、依赖安全、文档事实和本地生成物已经出现漂移。

本次审计确认：

- 根目录自动化测试 9 项通过，后端发布测试 5 项通过。
- 三个前端项目均可构建，ESLint 与 TypeScript 检查通过。
- 前端没有正式的 `npm test` 脚本；使用 `tsx --test` 时 107 项测试全部通过。
- 后端生产依赖有 2 个高危、1 个中危和 1 个低危漏洞，兼容范围内存在修复版本。
- 本机与后端 Docker 镜像仍使用已经结束维护的 Node 20。
- 部署文档仍将已经退役的 `/legacy-h5/` 列为当前服务。
- 仓库没有顶层 `README.md`，日常说明、部署台账和项目内临时文档之间存在重复。
- `docs/superpowers` 中已有 30 份历史设计和计划，共 10,499 行。
- 本地 `frontend/dist` 仍保存已经删除源码的旧项目产物，前端依赖目录也有额外包。
- Hub 的 ShotMarker 封面源文件约 1.6 MB，远高于卡片展示所需体积。

## 目标

- 建立一个准确、简洁、可从仓库根目录执行的开发和验证入口。
- 将开发与生产运行时统一到 Node 24 LTS。
- 修复当前已知依赖漏洞，只进行兼容范围内的依赖更新。
- 删除确认没有运行时调用方的骨架、旧工具、草稿和历史过程文档。
- 让公开仓库中的部署文档只描述当前架构，不暴露实例清单和裸 IP。
- 清理可重建的本地产物和多余依赖，缩小日常工作区占用。
- 压缩 Hub 封面，同时保持现有页面结构、比例和可接受的视觉质量。
- 保持 Hub、Cardgame、ShotMarker、埋点客户端和发布流程的现有产品行为。

## 非目标

- 不拆分 Cardgame、ShotMarker 或后端的现有大文件。
- 不重写 Git 历史，不强制推送，不从远端历史移除旧 H5 媒体。
- 不发布前端或后端，不修改服务器、OSS、DNS 或其他线上状态。
- 不升级 React、Vite、Tailwind、Marked 等依赖的大版本。
- 不重新设计或扩展埋点数据管道。
- 不增加新的产品功能或改变页面文案、路由、游戏规则。

## 工程基线

### Node 与包管理

- 在仓库根目录新增 `.nvmrc`，固定 Node 24。
- 根目录、`frontend` 和 `backend` 的 `package.json` 声明 `>=24 <25` 引擎范围。
- 后端 Docker 基础镜像从 `node:20-alpine` 更新为 `node:24-alpine`。
- 保持 npm 与现有三个独立 package 根目录，不改造成 npm workspace。

### 统一命令

前端新增：

- `npm test`：用 `tsx --test` 自动发现并执行 MJS 与 TypeScript 测试。
- `npm run typecheck`：检查应用与 Node/Vite 配置。
- `npm run build:all`：依次构建 Hub、Cardgame、ShotMarker。

根目录调整为：

- `npm test`：依次执行根自动化、前端和后端测试。
- `npm run lint`：执行前端 ESLint。
- `npm run typecheck`：执行前端 TypeScript 检查。
- `npm run build`：构建三个当前前端项目。
- `npm run check`：串联测试、Lint、类型检查和全部构建。

根自动化原有测试命令保留为独立内部脚本，避免递归调用根 `npm test`。

### 依赖策略

- 前端新增 `tsx` 开发依赖。
- 前后端只更新当前版本范围允许的依赖和 lockfile。
- 后端更新 `ws` 及 Express 传递依赖，最终生产与完整依赖审计均为零漏洞。
- 更新 Browserslist 数据，消除构建时的过期提示。
- 不使用 `npm audit fix --force`，不引入未经验证的大版本。

## 文档整理

### 新入口

新增顶层 `README.md`，只包含：

- 项目用途和当前在线入口。
- Hub、Cardgame、ShotMarker、Backend、Automation 的职责。
- Node 版本与首次安装命令。
- 根目录常用开发、验证和发布命令。
- 指向详细运行手册、部署说明、文章规则和项目说明的链接。

`RUNBOOK.md` 保留为日常操作手册，但删除用户机器绝对路径、过期项目和重复背景说明。

### 部署文档

用 `docs/deploy/README.md` 替换以下三份重复文档：

- `docs/deploy/zhangrh-shop-docker-compose.md`
- `docs/deploy/zhangrh-shop-server-ledger.md`
- `docs/deploy/zhangrh-shop-service-ledger.md`

新文档只记录当前逻辑架构、部署目录、环境变量、发布命令和只读验证方法。删除：

- 已下线的 `legacy-h5` 服务与验证命令。
- 云实例 ID、到期时间、利用率和逐机器资产清单。
- 裸 IP；发布脚本与文档统一使用 `zhangrh.shop` 主机名。

发布目标、Docker Compose 目录和 OSS 静态资源流程保持不变。

### 项目内文档

- 将 `frontend/project/cardgame/dev.md` 中仍准确的规则整理到
  `frontend/project/cardgame/README.md`。
- 删除未发布且使用失效旧域名的 `frontend/project/cardgame/blog.md`。
- 更新 `frontend/docs/track.md`，只记录当前实际事件、请求方式和“尚未入库”的边界。
- 删除不存在的 `.vscode/extensions.json` 对应的 `.gitignore` 例外规则。

### 历史过程文档

删除本设计写入前已经存在的 30 份 `docs/superpowers/specs` 与
`docs/superpowers/plans` 历史文件。它们仍可从 Git 历史恢复。

本次设计与后续实现计划作为最新维护基线保留，不在本次删除范围内。

## 废弃代码与本地文件

### 删除仓库文件

删除：

- `automation/scheduler/track_ingest.py`
- `automation/scheduler/README.md`
- `backend/tools/simulate-card-game01.mjs`
- `frontend/project/cardgame/blog.md`
- 被 `README.md` 替代的 `frontend/project/cardgame/dev.md`
- 两份服务器/服务台账和旧 Docker Compose 部署说明
- 本设计之前的历史 Superpowers 设计与计划

Scheduler 文件只是没有数据库写入、没有调度入口、没有调用方的预览骨架。删除它不影响
浏览器端埋点请求；若以后需要日志入库，应重新设计有数据源、存储和部署责任的完整任务。

Cardgame 模拟器没有 package 脚本、文档或调用方，并且不直接模拟当前“抽 5 选 3”的完整
回合，因此不再作为当前工程工具保留。

### 清理忽略文件

清理并按需要重建：

- `frontend/dist`
- `frontend/output`
- `frontend/.cache`
- Hub 文章生成目录
- 仓库内 `.DS_Store`
- 前后端 `node_modules` 中不在 lockfile 的额外包

最终 `frontend/dist` 只允许包含本次验证生成的 `hub`、`cardgame` 和 `shotmarker`。

### 本地 Git 维护

- 将 `origin` 从已重定向的 `card-game-demo.git` 更新为
  `git@github.com:zhangrunhao/zhangrh.shop.git`。
- 在提交与验证完成后执行常规 `git gc`。
- 不使用 `git filter-repo`、BFG 或强制推送，因此远端克隆历史体积不会在本次缩小。

## 图片优化

将
`frontend/project/hub/assets/works/20260517_shotmarker/cover.png`
转换为适合网页卡片的 WebP，并更新 `works.json` 引用。

约束：

- 保持 16:9 附近的现有比例，不裁掉主要内容。
- 最大边不超过当前 1672 像素，不做无意义放大。
- 目标体积不超过 300 KB。
- 构建后由 Vite 正常生成指纹文件。
- 视觉检查确认文字、图标和主体没有明显压缩伪影。

## 发布配置

前后端发布脚本的默认主机从裸 IP 改为 `zhangrh.shop`，对应测试与日志文本同步更新。
SSH 用户、远端目录、rsync 参数、Docker Compose 命令和 OSS 上传逻辑不变。

这一调整只替换等价主机标识，不触发发布，也不改变服务器授权方式。

## 错误处理与安全边界

- 依赖更新后若审计仍有漏洞，不使用强制大版本自动修复；单独评估依赖链。
- Node 24 下若测试或构建失败，先定位兼容性问题，不回退到已经 EOL 的 Node 20。
- 图片转换若达不到体积与可读性要求，保留原图并记录未完成项，不提交劣化资产。
- 删除仅作用于上述明确路径；不对工作区根目录、用户目录或未知目录执行递归删除。
- 所有线上检查只使用 GET/HEAD；不调用发布脚本，不写远端状态。

## 验证

实现完成后执行：

1. Node 24 下安装前后端依赖。
2. 根目录 `npm run check`。
3. 前后端 `npm audit`，确认零漏洞。
4. 检查 `frontend/dist` 只包含三个当前项目。
5. 检查封面构建产物体积与页面引用。
6. 搜索旧域名、裸 IP、实例 ID、`legacy-h5` 和已删除文件名的残留。
7. 对根页面、Cardgame、ShotMarker How-to 和 Cardgame health 执行线上只读检查。
8. 执行 `git diff --check`、检查分支和工作区状态。

## 完成标准

- 新开发者可以从根 README 找到安装、开发、验证和发布入口。
- 一条根命令可完整验证当前项目。
- Node 20 不再出现在当前运行配置中。
- 后端依赖审计为零漏洞。
- 旧过程文档、废弃骨架、草稿和重复台账已从当前树删除。
- 当前三个产品构建成功且行为没有有意改变。
- 工作区不再保留旧项目构建产物或多余直接依赖。
- 不发生生产发布、历史重写或强制推送。
