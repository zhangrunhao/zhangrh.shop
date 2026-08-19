# 项目平衡整理实施计划

> 设计依据：[项目平衡整理设计](./2026-07-29-project-cleanup-spec.md)

## 实施原则

- 所有修改在 `codex/project-cleanup` 隔离 worktree 中完成。
- 每组改动先建立可失败的验证，再修改实现，最后执行对应回归。
- 依赖只做兼容范围更新，不使用 `npm audit fix --force`。
- 删除只作用于设计中列出的明确文件和忽略目录。
- 不运行 `publish`、`deploy`、`rsync`、SSH 写操作或 OSS 上传。
- 每次提交使用中文 Conventional Commit 前缀。

## Task 1：统一 Node 24 与验证命令

**新增：**

- `.nvmrc`

**修改：**

- `package.json`
- `frontend/package.json`
- `frontend/package-lock.json`
- `backend/package.json`
- `backend/package-lock.json`
- `backend/Dockerfile`

### 步骤

1. 记录前端当前缺少测试入口：

   ```bash
   npm --prefix frontend test
   ```

   预期：失败并提示 `Missing script: "test"`。

2. 在三个 `package.json` 中加入 `engines.node: ">=24 <25"`。
3. 新增 `.nvmrc`，内容为 `24`。
4. 将后端基础镜像更新为 `node:24-alpine`。
5. 在前端安装 `tsx` 开发依赖：

   ```bash
   npm --prefix frontend install --save-dev tsx
   ```

6. 在前端新增：

   - `test`: `tsx --test`
   - `typecheck`: 两个 TypeScript 配置依次执行 `tsc --noEmit`
   - `build:all`: 依次构建 `hub`、`cardgame`、`shotmarker`

7. 在根目录保留原自动化测试为 `test:automation`，并新增：

   - `test`: 根自动化、前端、后端测试
   - `lint`
   - `typecheck`
   - `build`
   - `check`

8. 验证：

   ```bash
   npm test
   npm run lint
   npm run typecheck
   ```

9. 提交：

   ```bash
   git add .nvmrc package.json frontend/package.json frontend/package-lock.json \
     backend/package.json backend/package-lock.json backend/Dockerfile
   git commit -m "chore: 统一 Node 24 与验证命令"
   ```

## Task 2：修复依赖漏洞并更新兼容版本

**修改：**

- `frontend/package-lock.json`
- `backend/package-lock.json`
- 必要时修改 `frontend/package.json`
- 必要时修改 `backend/package.json`

### 步骤

1. 保存修改前审计摘要：

   ```bash
   npm --prefix frontend audit
   npm --prefix backend audit
   ```

2. 预演自动修复，确认不需要大版本：

   ```bash
   npm --prefix frontend audit fix --dry-run
   npm --prefix backend audit fix --dry-run
   ```

3. 执行兼容修复和当前范围更新：

   ```bash
   npm --prefix frontend audit fix
   npm --prefix backend audit fix
   npm --prefix frontend update
   npm --prefix backend update
   ```

4. 更新 Browserslist 数据：

   ```bash
   cd frontend
   npx update-browserslist-db@latest
   ```

5. 验证依赖树和安全报告：

   ```bash
   npm --prefix frontend ls --depth=0
   npm --prefix backend ls --depth=0
   npm --prefix frontend audit
   npm --prefix backend audit
   ```

   预期：无 extraneous 直接包，两个审计均为零漏洞。

6. 回归：

   ```bash
   npm test
   npm run lint
   npm run typecheck
   ```

7. 提交：

   ```bash
   git add frontend/package.json frontend/package-lock.json \
     backend/package.json backend/package-lock.json
   git commit -m "fix: 修复前后端依赖安全问题"
   ```

## Task 3：发布主机由裸 IP 改为域名

**修改：**

- `backend/tools/publish-lib.test.mjs`
- `backend/tools/publish-lib.mjs`
- `frontend/scripts/deploy-static.test.mjs`
- `frontend/scripts/deploy-static.mjs`
- `frontend/tools/publish.mjs`

### 步骤

1. 将前后端发布测试的默认主机期望改为 `zhangrh.shop`。
2. 运行对应测试，确认它们先因现有裸 IP 失败：

   ```bash
   npm --prefix backend test
   node --test frontend/scripts/deploy-static.test.mjs
   ```

3. 将两个 `DEFAULT_RSYNC_HOST` 和发布说明日志改为 `zhangrh.shop`。
4. 确认 SSH 用户、目录、rsync 参数和 Docker Compose 命令没有变化。
5. 回归：

   ```bash
   npm --prefix backend test
   node --test frontend/scripts/deploy-static.test.mjs frontend/tools/publish-lib.test.mjs
   ```

6. 提交：

   ```bash
   git add backend/tools/publish-lib.mjs backend/tools/publish-lib.test.mjs \
     frontend/scripts/deploy-static.mjs frontend/scripts/deploy-static.test.mjs \
     frontend/tools/publish.mjs
   git commit -m "refactor: 发布主机统一使用域名"
   ```

## Task 4：重整当前文档入口

**新增：**

- `README.md`
- `docs/deploy/README.md`
- `frontend/project/cardgame/README.md`

**修改：**

- `RUNBOOK.md`
- `automation/README.md`
- `frontend/docs/track.md`
- `.gitignore`

**删除：**

- `docs/deploy/zhangrh-shop-docker-compose.md`
- `docs/deploy/zhangrh-shop-server-ledger.md`
- `docs/deploy/zhangrh-shop-service-ledger.md`
- `frontend/project/cardgame/dev.md`
- `frontend/project/cardgame/blog.md`

### 步骤

1. 新建根 README，列出当前组件、在线入口、Node 版本、安装与根命令。
2. 精简 RUNBOOK，使用仓库相对命令和域名，不写用户机器绝对路径或裸 IP。
3. 用 `docs/deploy/README.md` 合并当前部署架构、目录、环境变量和只读验证。
4. 删除 `legacy-h5`、实例 ID、服务器利用率和到期时间。
5. 将 Cardgame 当前规则从 `dev.md` 整理到项目 README，不保留旧博客草稿。
6. 更新埋点文档，使其匹配 Hub 与 Cardgame 当前调用；明确当前没有仓库内入库任务。
7. 更新 Automation 边界，只描述当前 `publish/`。
8. 删除 `.gitignore` 中不存在的 `.vscode/extensions.json` 例外规则。
9. 检查文档链接和敏感运维标识：

   ```bash
   rg -n '101\.200\.185\.29|i-[a-z0-9]+|zhangrh\.top|legacy-h5' \
     README.md RUNBOOK.md docs/deploy automation frontend/docs frontend/project/cardgame
   ```

   预期：没有结果。

10. 提交：

    ```bash
    git add README.md RUNBOOK.md .gitignore automation/README.md docs/deploy \
      frontend/docs/track.md frontend/project/cardgame
    git commit -m "docs: 重整项目与部署文档"
    ```

## Task 5：删除废弃代码与历史过程文档

**删除：**

- `automation/scheduler/README.md`
- `automation/scheduler/track_ingest.py`
- `backend/tools/simulate-card-game01.mjs`
- 本设计与本计划之外的 `docs/superpowers/**/*.md`

### 步骤

1. 再次确认三个废弃入口没有调用方：

   ```bash
   rg -n 'track_ingest|simulate-card-game01|automation/scheduler' \
     . -g '!docs/superpowers/**' -g '!node_modules/**'
   ```

2. 删除明确文件。
3. 删除本设计和本计划之外的 30 份历史过程文档。
4. 验证保留集：

   ```bash
   find docs/superpowers -type f -name '*.md' -print | sort
   ```

   预期仅包含：

   - `docs/superpowers/specs/2026-07-29-project-cleanup-design.md`
   - `docs/superpowers/plans/2026-07-29-project-cleanup.md`

5. 运行根、前端和后端测试，确认删除没有运行时影响。
6. 提交：

   ```bash
   git add -A automation/scheduler backend/tools docs/superpowers
   git commit -m "chore: 删除废弃脚本与历史过程文档"
   ```

## Task 6：压缩 Hub 作品封面

**新增：**

- `frontend/project/hub/assets/works/20260517_shotmarker/cover.webp`

**修改：**

- `frontend/project/hub/data/works.json`

**删除：**

- `frontend/project/hub/assets/works/20260517_shotmarker/cover.png`

### 步骤

1. 记录原图尺寸与体积：

   ```bash
   sips -g pixelWidth -g pixelHeight \
     frontend/project/hub/assets/works/20260517_shotmarker/cover.png
   stat -f '%z' frontend/project/hub/assets/works/20260517_shotmarker/cover.png
   ```

2. 使用确定性参数转换：

   ```bash
   cwebp -quiet -q 82 -m 6 -metadata none \
     frontend/project/hub/assets/works/20260517_shotmarker/cover.png \
     -o frontend/project/hub/assets/works/20260517_shotmarker/cover.webp
   ```

3. 若输出超过 300 KB，逐步降低质量但不低于 75；若仍超标，按比例缩小到
   1280 像素宽后重试。
4. 视觉检查 WebP，确认文字、图标和主体没有明显伪影。
5. 更新 `works.json`，删除 PNG。
6. 验证：

   ```bash
   npm --prefix frontend test
   npm --prefix frontend run build -- hub
   find frontend/dist/hub/static -name 'cover-*' -exec ls -lh {} \;
   ```

7. 提交：

   ```bash
   git add frontend/project/hub/assets/works/20260517_shotmarker \
     frontend/project/hub/data/works.json
   git commit -m "refactor: 优化 Hub 作品封面资源"
   ```

## Task 7：全量验证与本地维护

### 隔离 worktree 验证

1. 在 Node 24 环境执行：

   ```bash
   node --version
   npm ci --prefix frontend
   npm ci --prefix backend
   npm run check
   npm --prefix frontend audit
   npm --prefix backend audit
   ```

2. 检查构建集合：

   ```bash
   find frontend/dist -mindepth 1 -maxdepth 1 -type d -print | sort
   ```

   预期只有 `cardgame`、`hub`、`shotmarker`。

3. 检查残留：

   ```bash
   rg -n '101\.200\.185\.29|i-[a-z0-9]+|zhangrh\.top|legacy-h5|node:20' \
     . -g '!docs/superpowers/**' -g '!node_modules/**' \
     -g '!frontend/dist/**' -g '!.git/**'
   ```

4. 执行线上只读检查：

   ```bash
   curl -L --max-time 12 -fIsS https://zhangrh.shop/
   curl -L --max-time 12 -fIsS https://zhangrh.shop/cardgame/
   curl -L --max-time 12 -fIsS https://zhangrh.shop/shotmarker/how-to
   curl -L --max-time 12 -fsS https://zhangrh.shop/api/cardgame/health
   ```

5. 最终 Git 检查：

   ```bash
   git diff --check
   git status --short --branch
   git log --oneline --decorate -8
   ```

### 原始工作区维护

在确认明确路径后：

1. 删除原始工作区的旧 `frontend/dist`、`frontend/output` 和 `frontend/.cache`。
2. 删除仓库内 `.DS_Store`。
3. 使用原始 lockfile 执行 `npm prune`，清除额外依赖。
4. 将 origin 更新为：

   ```text
   git@github.com:zhangrunhao/zhangrh.shop.git
   ```

5. 执行常规 `git gc`，不改写可达历史。

### 完成报告

报告：

- 删除和保留的文档/工具。
- Node、测试入口和依赖审计结果。
- 全量测试、构建和线上只读检查结果。
- 封面压缩前后体积。
- 原始工作区与 `.git` 清理前后体积。
- 分支提交列表以及未执行的发布、历史重写事项。
