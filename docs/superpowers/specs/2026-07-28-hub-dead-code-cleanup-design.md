# Hub 废弃代码清理设计

## 背景

Hub 经过多轮页面改版后，仍保留已经从导航和路由中移除的复盘功能、没有入口的 `/zhengtian` 原型页，以及若干不再被生产代码引用的组件、常量、图标和样式。前端依赖中也残留了一批随旧项目引入、当前源码已经不再使用的包。

仓库同时已经存在以下作品数据迁移文档：

- `docs/superpowers/specs/2026-07-28-hub-works-data-design.md`
- `docs/superpowers/plans/2026-07-28-hub-works-data.md`

本次清理必须与该迁移兼容，不提前修改或删除它需要的输入。

## 目标

- 删除已经不可达的复盘功能及其完整依赖链。
- 按用户确认删除 `/zhengtian` 原型页。
- 删除确认没有生产引用的 Hub 组件、常量、图标分支和旧样式。
- 删除当前源码零引用、且作品数据计划不需要的前端依赖。
- 用测试约束已退役路由和残留模块，避免后续误恢复。
- 保持首页、作品、文章、关于我和发布流程的现有行为不变。

## 非目标

- 不实施作品数据迁移计划。
- 不修改 `products.json`、`home.json` 或作品数据结构。
- 不删除或移动 `assets/cardgame.png`、`assets/calorie.png`。
- 不删除 `/products/:id`、通用作品详情页或作品卡片。
- 不提前删除作品计划后续会替换的版本字段、排序和图片 URL 兼容逻辑。
- 不删除文章功能、Scheduler 骨架、Cardgame 模拟器或部署台账。
- 不执行生产发布。

## 删除范围

### 复盘功能

删除：

- `frontend/project/hub/pages/reviews-page.tsx`
- `frontend/project/hub/components/review-card.tsx`
- `frontend/project/hub/data/reviews.json`
- `Review` 类型
- `REVIEWS` 数据导入和导出
- `ProductMarkIcon`
- `NavIcon` 的 `review` 类型和渲染分支

### `/zhengtian` 原型页

删除：

- `frontend/project/hub/pages/zhengtian-page.tsx`
- `Route` 中的 `zhengtian`
- `/zhengtian` 路由解析分支
- `app.tsx` 中的页面导入、标题和独立布局分支
- 埋点页名中的 `zhengtian`
- 原有 `/zhengtian` 路由测试

删除后 `/zhengtian` 与其他未知路径一致，解析为 `not-found`。

### 无引用 Hub 代码

删除：

- `frontend/project/hub/components/section-title.tsx`
- `HOME_AREAS`
- `AreaIcon`
- `index.css` 中无消费者的 `.line-clamp-2` 和 `.prose-content` 样式

保留仍被作品数据计划引用或改造的格式化、作品和图片逻辑。

### 无引用依赖

从 `frontend/package.json` 删除以下直接依赖声明，并由 npm 重新计算 lockfile：

- `@better-scroll/core`
- `handlebars`
- `lodash`
- `marked`
- `less`
- `mime-types`

删除前后都用全仓引用检索和前端构建确认没有项目源码消费者。若某个包仍是其他保留依赖的传递依赖或可选 peer，允许它继续由 lockfile 管理，不手工破坏依赖树。

## 测试设计

更新 Hub 路由测试：

- `/zhengtian` 解析为 `not-found`。
- `/reviews`、`/ideas` 和 `/previews` 继续解析为 `not-found`。

更新 Hub 源码结构测试：

- 路由和 App 不再包含 `ReviewsPage` 或 `ZhengtianPage`。
- `shared/data.ts` 不再导入 reviews 数据。
- 已删除的复盘、原型页和无引用组件文件不存在。
- 保留作品列表、文章和关于我入口。

最终验证：

- 根目录自动化测试。
- Hub MJS 测试。
- Hub TypeScript 路由测试。
- 前端 lint。
- TypeScript 类型检查。
- Hub 生产构建。
- 构建产物不再包含 `时间线web - 组件库` 或复盘卡片独有样式。
- `git diff --check` 和工作区状态检查。

## 与作品数据计划的兼容性

本次允许与作品数据计划重叠修改的文件只有：

- `frontend/project/hub/app.tsx`
- `frontend/project/hub/shared/data.ts`
- `frontend/project/hub/shared/route.ts`
- `frontend/project/hub/shared/tracking.ts`
- `frontend/project/hub/types.ts`
- `frontend/project/hub/shared/format.ts`
- Hub 页面测试
- `frontend/package.json`
- `frontend/package-lock.json`

这些文件只做废弃成员的局部删除，不重命名作品类型、不改变作品字段、不迁移图片、不改变发布参数。作品数据分支合并或变基时，可以按成员级差异处理，不需要改变其设计。

## 提交策略

使用独立分支 `codex/hub-dead-code-cleanup`：

1. 提交本设计说明。
2. 单独提交 Hub 废弃代码和依赖清理。
3. 不在本分支实施 works-data 计划或生产发布。
