# Hub 仅保留 ShotMarker 设计

## 背景

Hub 当前展示三个作品：

- `20260619_zhangrh_shop`
- `20260205_card_game`
- `20260517_shotmarker`

本次只保留 ShotMarker。当前 ShotMarker 封面实际是旧的“热量管家”图片，
与产品无关，需要同时替换。

ShotMarker 是一款配合 Apple Watch 和 iPhone 使用的篮球训练工具。训练时在
Apple Watch 上记录有效投篮，训练结束后在 iPhone 上选择视频并自动生成集锦。

## 目标

- Hub 作品数据只保留 ShotMarker。
- 首页推荐作品只保留 ShotMarker。
- 删除另外两个作品的本地封面目录。
- 保留通用作品数据、资源解析和卡片渲染机制。
- 生成并接入一张符合 ShotMarker 品牌与功能的新封面。
- 提供一份可以在其他图片生成平台复用的完整提示词。

## 非目标

- 不把 ShotMarker 硬编码进 React 页面。
- 不删除通用作品列表、作品卡片或作品状态逻辑。
- 不修改 ShotMarker 独立站点的功能、截图、路由或页面内容。
- 不修改文章功能。
- 不在本次实施结束后自动发布 Hub。

## 数据清理

### `works.json`

删除：

- `20260619_zhangrh_shop`
- `20260205_card_game`

只保留：

```json
{
  "id": "20260517_shotmarker",
  "name": "ShotMarker Support",
  "summary": "ShotMarker 的支持与隐私页面，承载产品发布后的公开信息。",
  "link": "https://zhangrh.shop/shotmarker/support",
  "coverImage": "works/20260517_shotmarker/cover.png",
  "status": "active"
}
```

ShotMarker 的字段结构和绝对 URL 保持不变。

### `home.json`

`featuredWorkIds` 只保留：

```json
["20260517_shotmarker"]
```

首页继续从 `works.json` 按 ID 引用作品，不复制作品内容。

## 本地资源清理

删除以下目录及其中封面：

```text
frontend/project/hub/assets/works/20260619_zhangrh_shop/
frontend/project/hub/assets/works/20260205_card_game/
```

保留并替换：

```text
frontend/project/hub/assets/works/20260517_shotmarker/cover.png
```

通用的 Vite 资源扫描、OSS 上传和 `coverImage` 路径规则保持不变。

## ShotMarker 封面设计

### 视觉方向

- 横版 16:9 产品主视觉。
- 蓝色、青色、绿色渐变，延续现有 App 图标颜色。
- 靶心或准星图形作为品牌核心，但明确表现为篮球训练打点。
- 一条橙色篮球飞行轨迹连接智能手表和手机。
- 智能手表表达“训练时打点”，手机表达“自动生成集锦”。
- 整体简洁、现代、具有苹果产品发布视觉的留白和质感。
- 只允许出现一个英文词：`ShotMarker`。
- 不出现中文说明、小字、复杂界面文字或额外品牌标志。
- 不出现枪械、射击游戏、军事元素、食物、热量或营养管理元素。

### 参考资产

生成时参考：

- ShotMarker App 图标中的蓝绿渐变、白色靶心和绿色中心点。
- ShotMarker Apple Watch 截图中的大号绿色训练按钮。
- ShotMarker iPhone 截图中的训练记录、打点和生成集锦概念。

参考资产只用于确定品牌和产品语义，不直接拼贴完整截图。

### 生成结果处理

- 优先生成一张完整的 16:9 PNG 封面。
- 检查 `ShotMarker` 拼写、设备结构、篮球语义和画面裁切安全区。
- 如果文字错误或产品语义明显偏离，调整提示词后重试一次。
- 不接受带有乱码、错误中文、枪械或热量管理元素的结果。
- 最终选定图片直接覆盖 ShotMarker 的现有 `cover.png`。

## 可复用生成提示词

实施完成时交付一份不依赖特定平台语法的中文提示词，完整描述：

- 画面比例和用途。
- ShotMarker 的篮球训练功能。
- 蓝绿品牌色和靶心图形。
- 智能手表、手机、篮球轨迹的构图。
- `ShotMarker` 唯一文字要求。
- 需要排除的错误主题和视觉元素。

同时附带简短的负面提示词，方便在支持 negative prompt 的平台使用。

## 测试与验收

### 数据

- `works.json` 恰好包含一个作品。
- 唯一作品 ID 是 `20260517_shotmarker`。
- 唯一链接是 `https://zhangrh.shop/shotmarker/support`。
- `home.json` 只引用该 ID。

### 资源

- ShotMarker 新封面存在并可由 Vite 解析。
- `assets/works` 下只存在 ShotMarker 作品目录。
- 删除的两个封面目录不存在。
- 构建产物包含 ShotMarker 新封面，不再包含被删除作品的封面。

### 页面行为

- 首页只展示 ShotMarker。
- 作品列表只展示 ShotMarker。
- 点击作品仍在新标签页打开绝对 URL。
- 文章、关于我、导航和 404 行为不变。

### 最终验证

- Hub 数据和页面测试。
- Hub 路由与资源解析测试。
- TypeScript 类型检查。
- ESLint。
- Hub 生产构建。
- 根目录自动化测试。
- `git diff --check` 和工作区状态检查。

## 提交与发布

- 设计规格单独提交。
- 实施、测试和新封面作为后续提交。
- 实施完成后不自动推送或发布，等待用户明确指令。
