# Hub 首页最新文章实施计划

**目标：** 删除 `home.json` 中重复维护的首页文章数据，让首页自动展示生成文章中的最新三篇。

**设计：** `docs/superpowers/specs/2026-07-29-home-latest-articles-design.md`

## Task 1：改造首页文章数据流

**修改文件：**

- `frontend/project/hub/data/home.json`
- `frontend/project/hub/data/home.test.mjs`
- `frontend/project/hub/types.ts`
- `frontend/project/hub/pages/home-page.tsx`
- `frontend/project/hub/pages/home-page-layout.test.mjs`
- `frontend/project/hub/pages/works-pages-render.test.mjs`

### 1. 先更新测试

- 要求 `home.json` 不再包含 `featuredArticles`。
- 要求首页导入 `ARTICLES` 并只取前三篇。
- 要求每篇首页文章链接到 `/articles/<id>`。
- 要求首页使用 `name`、`summary`、`publishDate`。
- 要求空文章仓库显示“没有已发布的文章。”

运行相关测试并确认旧实现失败。

### 2. 实现数据和页面调整

- 删除 `home.json.featuredArticles`。
- 删除 `HomeFeaturedArticle` 和 `HomeData.featuredArticles`。
- 首页使用 `ARTICLES.slice(0, 3)`。
- 使用现有 `Link` 包裹整行文章。
- 保留现有文章区域、“查看更多”和视觉样式。
- 增加空状态。

### 3. 验证

运行：

```bash
cd frontend
node --test \
  project/hub/data/home.test.mjs \
  project/hub/pages/home-page-layout.test.mjs \
  project/hub/pages/works-pages-render.test.mjs
npm exec tsc -- --noEmit -p tsconfig.app.json
npm run lint
npm run build -- hub
```

随后运行全部 `.test.mjs` 测试，确认作品、文章、路由和发布构建没有回归。

### 4. 提交

实现与对应测试作为一个功能提交：

```text
feat: 首页展示最新发布文章
```
