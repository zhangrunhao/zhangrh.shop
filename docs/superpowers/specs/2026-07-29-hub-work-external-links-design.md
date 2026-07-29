# Hub 作品绝对链接与详情页移除设计

## 背景

Hub 当前在 `data/works.json` 中为每个作品配置内部详情地址：

```text
/products/<作品 ID>
```

点击作品后，Hub 会进入通用 `ProductDetailPage`。现在每个作品已经拥有独立页面，不再需要 Hub 通用详情页。

## 目标

- `works.json` 为每个作品保存完整的 HTTPS 地址。
- 首页和作品列表继续读取同一个 `work.link`。
- 点击作品后在新标签页打开独立页面。
- 删除 Hub 通用作品详情页及其路由、标题和追踪逻辑。
- 保留作品列表页 `/hub/products`。

## 作品地址

```text
20260619_zhangrh_shop
→ https://zhangrh.shop/hub/

20260205_card_game
→ https://zhangrh.shop/cardgame/

20260517_shotmarker
→ https://zhangrh.shop/shotmarker/support
```

`works.json` 的其他字段和作品顺序保持不变。

## 跳转行为

现有 `Link` 组件已经把 `http://` 和 `https://` 地址识别为外部地址，并生成：

```html
<a target="_blank" rel="noreferrer">
```

因此首页作品卡片和作品列表卡片无需增加单独的点击逻辑。它们继续把 `work.link` 传给 `Link`，由浏览器在新标签页打开。

## 删除详情页逻辑

删除：

- `pages/product-detail-page.tsx`
- `Route` 类型中的 `product-detail`
- `/products/:id` 路由匹配
- `App` 中的详情页组件渲染
- `App` 中根据作品 ID 设置详情页标题的逻辑
- 只为详情页存在的 `WORKS` 查询
- 详情页相关测试和断言

如果追踪模块存在 `product-detail` 分支，也同步移除。

旧地址：

```text
/hub/products/<作品 ID>
```

不做兼容重定向，统一进入现有 404 页面。

## 数据校验

`works.json` 测试增加以下约束：

- `link` 必须是合法的绝对 URL。
- 协议必须是 `https:`。
- 不再允许 `/products/<作品 ID>` 形式的相对地址。

页面测试验证：

- 首页与作品列表仍直接使用 `work.link`。
- 三个作品地址与已确认的独立页面一致。
- `ProductDetailPage` 文件和 `product-detail` 路由均不存在。
- 旧详情地址解析为 `not-found`。
- 外部链接继续使用新标签页和 `noreferrer`。

## 非目标

- 不修改作品卡片视觉设计。
- 不删除作品列表页。
- 不为旧详情地址增加重定向。
- 不调整文章路由。
- 本次实施不自动发布生产环境。

## 验收标准

- `works.json` 中三个作品都使用已确认的 HTTPS 绝对地址。
- 首页和作品列表点击作品会在新标签页打开对应页面。
- Hub 不再包含通用作品详情页代码。
- `/hub/products/<作品 ID>` 显示 404。
- 数据测试、页面测试、TypeScript、lint 和 Hub 构建通过。
