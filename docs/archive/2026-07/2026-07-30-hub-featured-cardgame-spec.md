# Hub 首页展示 CardGame 设计

## 目标

在 Hub 首页“作品”区域展示 CardGame，并保持现有精选作品机制。首页顺序固定为：

1. ShotMarker Support
2. CardGame

CardGame 继续链接到 `https://zhangrh.shop/cardgame/`，状态为 `Paused`。

## 数据与组件

- `frontend/project/hub/data/home.json` 继续作为首页精选作品顺序的唯一配置来源。
- 将 `20260729_cardgame` 追加到 `featuredWorkIds`，不改 `works.json` 中的作品信息。
- 首页卡片继续从 `FEATURED_WORKS` 读取名称、摘要、链接和状态。
- 首页复用现有 `WorkStatusBadge`，以真实状态替换通用的 `Work` 角标：
  - ShotMarker 显示 `Active`。
  - CardGame 显示 `Paused`。
- 保持现有首页卡片布局、外链行为、响应式网格和 hover 样式，不展示作品封面。

## 测试

- 更新首页数据测试，断言精选顺序为 ShotMarker、CardGame。
- 更新首页 SSR 测试，断言两张精选卡按配置顺序渲染，并分别显示 `Active`、`Paused`。
- 保留无嵌套链接、外链安全属性和作品数据单一来源的现有验证。
- 运行 Hub 相关测试、完整前端测试、lint、类型检查和 Hub 生产构建。

## 发布

- 只重新发布 Hub。
- 发布后验证 `/hub/` 首页出现两张作品卡，CardGame 显示 `Paused`，点击链接指向 `/cardgame/`。

## 非目标

- 不修改 CardGame 页面、路由、玩法或后端。
- 不把全部作品自动加入首页；后续精选仍由 `featuredWorkIds` 显式控制。
- 不调整首页整体布局、文案或文章区域。
