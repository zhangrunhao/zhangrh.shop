# Hub 首页最新文章设计

## 目标

让 Hub 首页文章区域与文章列表、文章详情使用同一份构建生成数据，移除
`home.json` 中重复维护的文章标题、摘要和日期。

## 当前问题

- 文章列表和详情读取构建生成的 `ARTICLES`。
- 首页仍读取 `home.json.featuredArticles`。
- 首页文章没有六位 ID，也不能打开文章详情。
- 当文章源目录为空时，文章列表显示空状态，但首页仍显示三条静态占位文章。

## 已确认方案

首页自动展示 `ARTICLES` 中最新发布的三篇文章。

- `ARTICLES` 已按 `publishDate` 降序、`id` 降序排列。
- 首页取 `ARTICLES.slice(0, 3)`，不再单独排序。
- 每一行使用现有 `Link` 组件打开 `/articles/<id>`。
- 首页展示文章的 `name`、`summary` 和 `publishDate`。
- 没有已发布文章时保留首页文章区域，并显示明确空状态。
- “查看更多”继续指向 `/articles`。

第一版不提供人工精选文章 ID。需要人工精选时，再单独引入
`featuredArticleIds`；本次不为未来需求增加配置。

## 数据结构调整

从 `frontend/project/hub/data/home.json` 删除：

```json
{
  "featuredArticles": []
}
```

从 `HomeData` 删除 `featuredArticles`，并删除不再使用的
`HomeFeaturedArticle` 类型。

文章数据继续只由：

```text
content/articles/*
→ prepare-articles.mjs
→ .generated/articles.json
→ shared/articles.ts
```

生成。`home.json` 只管理首页作品选择和关于我信息。

## 页面行为

首页文章区域：

1. 从 `shared/articles.ts` 导入 `ARTICLES`。
2. 读取前三篇文章。
3. 将整行包装为 `/articles/<id>` 的内部链接。
4. 使用与文章列表一致的标题、摘要和日期字段。
5. 数组为空时显示“没有已发布的文章。”

文章列表和详情页行为保持不变。

## 验证

- `home.json` 不再包含 `featuredArticles`。
- `HomeData` 不再包含旧首页文章类型和字段。
- 首页只展示最新三篇生成文章。
- 首页文章链接使用六位数字 ID。
- 空文章仓库能正常渲染首页空状态。
- 现有文章生成、路由、作品和发布测试继续通过。
- TypeScript、ESLint 和 Hub 生产构建通过。

## 不包含

- 人工精选文章。
- 首页文章数量配置。
- 标签、分类、搜索或分页。
- 自动同步 Notion。
- 导入真实文章或再次执行生产发布。
