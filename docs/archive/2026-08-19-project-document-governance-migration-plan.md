# Project Document Governance Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 更新通用文档治理规范，并将公开项目文档与私有基础设施台账迁移到各自的 `current / changes / archive` 生命周期。

**Architecture:** 生命周期与可见性分开管理。公开仓库维护产品、代码、质量和部署契约；私有仓库维护基础设施、生产配置和外部验证；凭据不进入任一仓库。

**Tech Stack:** Markdown、Git、Node.js 文档链接校验

**Spec:** `/Users/runhaozhang/Desktop/PROJECT_DOCUMENT_GOVERNANCE.md`，以及用户在当前会话中批准的公开与私有文档迁移设计

## Global Constraints

- 语言简洁、准确、清晰，不使用冗余说明或过渡表达。
- 保留仍有价值的事实、决定和历史证据，不以清理为由删除。
- 公开仓库不得包含私有基础设施值或凭据。
- 私有仓库不得包含密码、私钥、Token、AccessKey、数据库凭据或 `.env` 实际值。
- 两个 Git 仓库分别检查差异；本次不提交或推送。

---

### Task 1: 更新通用治理规范

**Files:**
- Modify: `/Users/runhaozhang/Desktop/PROJECT_DOCUMENT_GOVERNANCE.md`

**Interfaces:**
- Consumes: 已有 `current / changes / archive` 生命周期和事实可信度规则
- Produces: 公开/私有边界、多仓库协作和多项目文档仓库适配规则

- [x] **Step 1: 更新规范版本**

将版本从 `1.0` 更新为 `1.1`，保留制定日期。

- [x] **Step 2: 增加可见性与多仓库规则**

在核心模型后增加短节，明确生命周期不表示公开级别、单一事实归属、公开文档独立可读、私有文档不保存凭据、跨仓库 Change 分别闭环，以及多项目文档仓库的目录适配。

- [x] **Step 3: 补充 AGENTS.md 可复用规则**

增加事实唯一归属、私有事实不得复制到公开仓库、任何文档不得保存凭据三条规则。

- [x] **Step 4: 复核语言和结构**

运行：

```bash
rg -n '^## |版本：|可见性|多仓库|凭据|事实来源' /Users/runhaozhang/Desktop/PROJECT_DOCUMENT_GOVERNANCE.md
```

预期：版本为 `1.1`；新增规则集中在一个短节；原有生命周期和可信度顺序不变。

### Task 2: 迁移公开项目文档

**Files:**
- Create: `AGENTS.md`
- Create: `docs/README.md`
- Create: `docs/current/project.md`
- Create: `docs/current/development.md`
- Create: `docs/current/deployment.md`
- Modify: `README.md`
- Modify: `RUNBOOK.md`
- Modify: `docs/deploy/README.md`
- Move and rename: `docs/superpowers/specs/*.md` to `docs/archive/*-spec.md`
- Move and rename: `docs/superpowers/plans/*.md` to `docs/archive/*-plan.md`
- Move at completion: `docs/changes/2026-08-19-project-document-governance-migration-plan.md` to `docs/archive/2026-08-19-project-document-governance-migration-plan.md`

**Interfaces:**
- Consumes: 当前代码、测试、根 README、运行手册、部署说明、组件文档和 Git 历史
- Produces: 公开项目的 Agent 入口、文档入口、当前事实入口和扁平历史归档

- [x] **Step 1: 建立公开文档入口**

`AGENTS.md` 规定读取顺序、事实可信度、Change 生命周期、验证命令和私有仓库边界。`docs/README.md` 列出三个目录、current 主题、活动 Change 和代码邻近参考文档。

- [x] **Step 2: 提炼当前事实**

创建三个稳定主题：

- `project.md`：产品范围、组件边界和当前公开能力；
- `development.md`：Node 版本、依赖边界、测试与完整检查；
- `deployment.md`：发布路径、基础设施边界、Track 当前契约、外部状态验证日期和未确认项。

- [x] **Step 3: 归档已结束材料**

将 9 份设计重命名为 `*-spec.md`，将 6 份计划重命名为 `*-plan.md`，全部迁入扁平 `docs/archive`。保留首次形成日期和 topic。

- [x] **Step 4: 修复入口和内部链接**

根 README 以 `docs/README.md` 作为文档总入口。修复归档移动产生的相对链接，不改业务内容。

- [x] **Step 5: 校验公开文档**

运行：

```bash
git diff --check
rg -n '\]\([^)]*(docs/superpowers|\.\./specs|\.\./plans|[^)]*-design\.md)' --glob '*.md' .
```

预期：格式检查通过；不存在指向旧治理目录的 Markdown 链接。archive 中保留的历史路径文字不计为链接。

### Task 3: 迁移私有项目台账

**Files:**
- Create: `docs/private.local/AGENTS.md`
- Modify: `docs/private.local/README.md`
- Create: `docs/private.local/zhangrh-shop/README.md`
- Move: `docs/private.local/zhangrh-shop/{overview,main,glitchtip,back}.md` to `docs/private.local/zhangrh-shop/current/`
- Create: `docs/private.local/zhangrh-shop/archive/2026-07-29-cardgame-portfolio-routing.md`
- Create: `docs/private.local/zhangrh-shop/archive/2026-07-29-project-cleanup.md`
- Create: `docs/private.local/zhangrh-shop/archive/2026-08-15-nginx-log-mount-cleanup.md`
- Create: `docs/private.local/zhangrh-shop/archive/2026-08-15-track-jsonl-query-api.md`
- Create: `docs/private.local/zhangrh-shop/archive/2026-08-16-track-four-field-cutover.md`
- Create: `docs/private.local/zhangrh-shop/archive/2026-08-17-analytics-native-svg-values.md`
- Create: `docs/private.local/zhangrh-shop/archive/2026-08-19-project-document-governance-migration.md`
- Create: `docs/private.local/zhangrh-shop/changes/.gitkeep`

**Interfaces:**
- Consumes: 四份现有台账、公开部署契约和私有 Git 安全边界
- Produces: 私有项目的 current 入口、活动变更目录和历史归档

- [x] **Step 1: 建立私有仓库入口**

根 `AGENTS.md` 规定安全边界、读取顺序、证据规则、生命周期和独立 Git 检查。根 README 将定位收窄为私有基础设施与生产实例事实入口。

- [x] **Step 2: 建立项目入口和目录**

`zhangrh-shop/README.md` 列出 current 文档、活动 Change、archive 和维护流程。四份台账迁入 `current`，保留稳定名称。

- [x] **Step 3: 分离历史过程**

将已结束的生产操作和从公开 archive 提取的生产盘点、外部验证实值整理到私有 archive。current 只保留当前配置、当前结论、风险、待确认项和最后验证日期。

- [x] **Step 4: 修复私有链接**

修复 current 文档间链接、公开部署说明链接和 archive 回链。不得把私有值复制到公开仓库。

- [x] **Step 5: 校验安全边界和私有差异**

运行：

```bash
git -C docs/private.local diff --check
git -C docs/private.local status --short
(
  cd docs/private.local
  rg -n --hidden -i \
    -e '-----BEGIN .*PRIVATE KEY-----' \
    -e '^[A-Z0-9_]*(PASSWORD|TOKEN|SECRET|ACCESS_KEY|PRIVATE_KEY|DATABASE_URL|DB_PASSWORD)[A-Z0-9_]*[[:space:]]*=' \
    . --glob '!.git/**'
  find . -path './.git' -prune -o -type f \( -name '.env' -o -name '.env.*' \) -print
)
```

预期：格式检查通过；只有预期的目录迁移和内容提炼；不存在私钥正文、敏感变量赋值或 `.env` 文件。

### Task 4: 完整验证与 Change 闭环

**Files:**
- Modify: `docs/README.md`
- Move: `docs/changes/2026-08-19-project-document-governance-migration-plan.md` to `docs/archive/2026-08-19-project-document-governance-migration-plan.md`

**Interfaces:**
- Consumes: 三项迁移结果
- Produces: 无活动迁移 Change、链接有效、两个仓库边界清晰的最终工作区

- [x] **Step 1: 校验 Markdown 相对链接**

使用 Node.js 扫描公开仓库和私有仓库的本地 Markdown 链接；忽略 HTTP、锚点和示例占位符。

- [x] **Step 2: 运行公开仓库完整测试**

运行：

```bash
npm test
```

预期：根自动化、前端和后端测试全部通过。

- [x] **Step 3: 归档迁移计划**

确认 current 已更新后，将本计划移入 `docs/archive`，并把 `docs/README.md` 的活动 Change 更新为“无”。

- [x] **Step 4: 检查最终工作区**

运行：

```bash
git status --short --branch
git diff --check
git -C docs/private.local status --short --branch
git -C docs/private.local diff --check
```

预期：两个仓库只包含本次批准的文档治理改造；不提交、不推送。
