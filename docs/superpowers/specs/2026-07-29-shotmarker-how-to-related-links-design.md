# ShotMarker How-to 相关链接设计

## 背景

Hub 当前只展示 ShotMarker，但作品卡片仍跳转到 Support 页面。ShotMarker 的 How-to 页面已经承担产品介绍和使用说明，需要成为用户从 Hub 进入 ShotMarker 后的首要落点，并在页面底部提供 Support、Privacy 和主站入口。

## 目标

- Hub 中 ShotMarker 作品卡片跳转到 `https://zhangrh.shop/shotmarker/how-to`。
- How-to 页面底部新增“相关链接”区域。
- 相关链接区域包含以下三个入口：
  - `ShotMarker Support` → `/shotmarker/support`
  - `Privacy Policy` → `/shotmarker/privacy`
  - `zhangrh.shop` → `https://zhangrh.shop/hub/`
- 所有链接均在当前标签页打开。

## 非目标

- 不修改 Support、Privacy 页面正文。
- 不新增 ShotMarker 路由。
- 不调整 How-to 页面现有三步流程、截图或使用提示。
- 不修改 Hub 的作品数据结构。

## 页面设计

在 How-to 页面现有“使用提示”之后增加“相关链接”区块。区块沿用页面当前的浅色背景、卡片边框和圆角风格，桌面端展示三列，窄屏下改为单列。

每个卡片包含入口名称和简短说明，整张卡片可点击：

1. `ShotMarker Support`：获取使用帮助、反馈问题。
2. `Privacy Policy`：查看 ShotMarker 隐私政策。
3. `zhangrh.shop`：返回 zhangrh.shop 作品主页。

链接使用普通导航行为，在当前标签页打开。Support 和 Privacy 使用现有路由常量，主站链接使用明确的绝对 URL，避免部署路径影响。

## 数据与组件

- 在 ShotMarker 内容模块维护相关链接数据，避免在 JSX 中重复写 URL。
- How-to 页面读取该数据并渲染统一的链接卡片。
- Hub 的 `works.json` 只修改 ShotMarker 的 `link` 字段。
- 不引入新依赖，不新增全局导航组件。

## 测试与验收

- Hub 数据测试确认 ShotMarker 链接为 `https://zhangrh.shop/shotmarker/how-to`。
- ShotMarker 内容测试确认三个相关链接的名称与目标地址。
- 页面渲染测试或等价的静态检查确认 How-to 页面消费相关链接数据。
- Hub 和 ShotMarker 的测试、类型检查、代码检查与生产构建全部通过。
- 若发布，线上确认：
  - Hub 作品卡片进入 `/shotmarker/how-to`。
  - How-to 页面底部出现三个入口。
  - 三个入口分别导航至约定地址。
