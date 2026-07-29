# Hub 仅保留 ShotMarker 实施计划

**目标：** Hub 的作品数据和推荐区域只保留 ShotMarker，删除另外两个作品的
本地封面，并用新的 ShotMarker 品牌图替换错误的“热量管家”封面。

**设计规格：**
`docs/superpowers/specs/2026-07-29-hub-shotmarker-only-design.md`

## 任务 1：用测试锁定单作品数据边界

修改：

- `frontend/project/hub/data/works.test.mjs`
- `frontend/project/hub/data/home.test.mjs`
- `frontend/project/hub/pages/list-pages.test.mjs`
- `frontend/project/hub/shared/work-assets.test.mjs`

测试要求：

- `works.json` 恰好只有一个作品。
- 唯一 ID 是 `20260517_shotmarker`。
- 唯一链接是 `https://zhangrh.shop/shotmarker/support`。
- `home.json` 的 `featuredWorkIds` 恰好是
  `["20260517_shotmarker"]`。
- `assets/works` 只包含 ShotMarker 目录。
- Vite 只需要解析 ShotMarker 的真实封面。

先运行：

```bash
cd frontend
node --test \
  project/hub/data/works.test.mjs \
  project/hub/data/home.test.mjs \
  project/hub/pages/list-pages.test.mjs \
  project/hub/shared/work-assets.test.mjs
```

期望：在旧数据和旧目录仍存在时失败，证明测试覆盖本次清理目标。

## 任务 2：删除另外两个作品

修改：

- `frontend/project/hub/data/works.json`
- `frontend/project/hub/data/home.json`

删除：

- `frontend/project/hub/assets/works/20260619_zhangrh_shop/cover.png`
- `frontend/project/hub/assets/works/20260205_card_game/cover.png`

实现要求：

- `works.json` 只保留现有 ShotMarker 对象。
- `home.json` 只保留 ShotMarker 推荐 ID。
- 不修改通用 `WORKS`、`FEATURED_WORKS`、`WorkCard` 和资源扫描逻辑。
- 不修改文章数据、文章页面或 ShotMarker 独立站点。

重新运行任务 1 的测试，期望全部通过。

## 任务 3：生成并接入 ShotMarker 新封面

参考：

- `/Users/runhaozhang/Documents/project/ShotMarker/ShotMarker/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png`
- `frontend/project/shotmarker/assets/how-to/apple-watch-49mm.jpg`
- `frontend/project/shotmarker/assets/how-to/iphone-highlight-ready.png`

替换：

- `frontend/project/hub/assets/works/20260517_shotmarker/cover.png`

执行要求：

1. 使用 imagegen 生成横版 16:9 产品主视觉。
2. 画面使用蓝、青、绿渐变靶心品牌语言。
3. 用篮球轨迹、智能手表打点和手机集锦表达产品功能。
4. 只允许 `ShotMarker` 一个英文词。
5. 检查拼写、篮球语义、设备形态、裁切安全区和错误主题。
6. 如果结果存在文字错误或明显偏题，修正提示词后重试一次。
7. 将选定结果保存为 ShotMarker 的 `cover.png`。
8. 使用图片查看工具检查最终仓库文件。

运行：

```bash
cd frontend
node --test project/hub/shared/work-assets.test.mjs
npm run build -- hub
```

期望：新封面由 Vite 正常解析，并进入 Hub 构建产物。

## 任务 4：验证单作品页面行为

运行：

```bash
cd frontend
node --test \
  project/hub/data/*.test.mjs \
  project/hub/pages/*.test.mjs \
  project/hub/shared/*.test.mjs
```

确认：

- 首页只渲染 ShotMarker。
- 作品列表只渲染 ShotMarker。
- 链接仍为绝对 URL，并带有 `target="_blank"` 和
  `rel="noreferrer"`。
- 删除的作品名称、ID 和封面路径不再出现在生产数据或构建产物中。

## 任务 5：完整验证与提交

运行：

```bash
cd frontend
node --test \
  scripts/*.test.mjs \
  tools/*.test.mjs \
  vite.config.test.mjs \
  project/hub/data/*.test.mjs \
  project/hub/pages/*.test.mjs \
  project/hub/shared/*.test.mjs
npx tsc -b --pretty false
npm run lint
npm run build -- hub

cd ..
npm test
git diff --check
git status --short --branch
```

检查最终差异只包含：

- 单作品数据和测试。
- 两个旧作品封面的删除。
- ShotMarker 新封面。
- 本实施计划。

提交信息：

```text
refactor: Hub 仅保留 ShotMarker
```

不推送、不发布。

## 交付

最终向用户提供：

- 新封面预览和本地文件链接。
- 可复制到其他图片平台的完整中文提示词。
- 简短负面提示词。
- 测试、构建和提交结果。
