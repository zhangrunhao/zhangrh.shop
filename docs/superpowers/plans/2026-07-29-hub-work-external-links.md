# Hub 作品绝对链接与详情页移除实施计划

**目标：** 让 Hub 作品直接打开各自的 HTTPS 页面，并彻底移除通用作品详情页。

**设计规格：** `docs/superpowers/specs/2026-07-29-hub-work-external-links-design.md`

## Task 1：建立失败测试

**修改：**

- `frontend/project/hub/data/works.test.mjs`
- `frontend/project/hub/shared/route.test.ts`
- `frontend/project/hub/pages/list-pages.test.mjs`
- `frontend/project/hub/pages/works-pages-render.test.mjs`

步骤：

1. 要求每个 `work.link` 都是合法的 HTTPS 绝对 URL。
2. 固定验证三个作品对应的已确认 URL。
3. 要求 `/products/<id>` 解析为 `not-found`。
4. 要求详情页文件、详情路由、详情标题和追踪分支不存在。
5. SSR 验证首页与列表作品链接包含 `target="_blank"` 和 `rel="noreferrer"`。
6. 运行相关测试并确认当前实现失败。

## Task 2：更新作品地址

**修改：**

- `frontend/project/hub/data/works.json`

地址：

```text
20260619_zhangrh_shop → https://zhangrh.shop/hub/
20260205_card_game → https://zhangrh.shop/cardgame/
20260517_shotmarker → https://zhangrh.shop/shotmarker/support
```

不修改其他作品字段和数组顺序。

## Task 3：删除详情页逻辑

**删除：**

- `frontend/project/hub/pages/product-detail-page.tsx`

**修改：**

- `frontend/project/hub/app.tsx`
- `frontend/project/hub/shared/route.ts`
- `frontend/project/hub/shared/tracking.ts`
- `frontend/project/hub/shared/constants.ts`
- `frontend/project/hub/components/app-header.tsx`

步骤：

1. 删除 `product-detail` 路由类型与 `/products/:id` 匹配。
2. 删除详情页组件导入和渲染。
3. 删除详情页标题的 `WORKS.find` 查询，并移除 `App` 中不再需要的 `WORKS` 导入。
4. 删除 `product_detail` 追踪页面名和转换分支。
5. 简化导航类型与作品导航激活判断。
6. 保留 `/products` 作品列表路由。

## Task 4：验证

运行：

```bash
cd frontend
node --test \
  project/hub/data/*.test.mjs \
  project/hub/pages/*.test.mjs \
  project/hub/shared/*.test.mjs
npx tsc -b --pretty false
npm run lint
npm run build -- hub
```

再运行根目录测试：

```bash
npm test
```

最后确认：

- `rg` 找不到业务代码中的 `ProductDetailPage`、`product-detail` 和 `product_detail`。
- `git diff --check` 通过。
- 没有构建产物或无关改动进入提交。
- 不执行生产发布。
