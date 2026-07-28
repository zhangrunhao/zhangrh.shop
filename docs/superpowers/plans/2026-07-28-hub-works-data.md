# Hub 作品数据与本地图片发布实施计划

> 实施时按任务顺序执行，每个任务先补失败测试，再做最小实现。未经用户明确要求，不执行生产发布。

**目标：** 将 Hub 作品内容统一到 `works.json`，让首页只引用作品 ID，并让本地作品图片经过 Vite 构建后自动进入现有 OSS 上传流程。

**架构：** `works.json` 保存唯一作品内容，`home.json.featuredWorkIds` 保存首页选择和顺序。Hub 用 `import.meta.glob` 建立本地图片资源映射，Vite 负责生成带哈希的图片文件。发布构建使用项目对应的 OSS absolute base，现有上传脚本继续递归上传 `dist/<project>/static`。

**技术栈：** React、TypeScript、Vite、Node.js test runner、Aliyun OSS 发布脚本。

**设计规格：** `docs/superpowers/specs/2026-07-28-hub-works-data-design.md`

---

## Task 1：建立作品数据契约

**文件：**

- Create: `frontend/project/hub/data/works.test.mjs`
- Modify: `frontend/project/hub/data/home.test.mjs`
- Modify: `frontend/project/hub/pages/list-pages.test.mjs`
- Rename: `frontend/project/hub/data/products.json` → `frontend/project/hub/data/works.json`
- Modify: `frontend/project/hub/data/home.json`

- [ ] **Step 1：为 `works.json` 写失败测试**

在 `works.test.mjs` 中读取 `works.json`，验证：

- 每条作品只包含 `id`、`name`、`summary`、`coverImage`、`status`、`link`。
- ID 匹配 `^\d{8}_[a-z0-9]+(?:_[a-z0-9]+)*$`。
- ID 唯一。
- `status` 只能是 `active` 或 `archived`。
- 四个文本字段非空。
- `coverImage` 不包含远程协议。
- `coverImage` 位于 `works/<id>/` 下。

- [ ] **Step 2：为首页 ID 引用写失败测试**

修改 `home.test.mjs`：

- 要求存在 `featuredWorkIds`。
- 要求不存在 `featuredWorks`。
- 要求首页 ID 不重复。
- 读取 `works.json`，验证所有首页 ID 都存在。
- 验证按 `featuredWorkIds` 解析后的作品顺序保持不变。
- 保留现有文章和关于我数据测试。

- [ ] **Step 3：更新列表页数据文件测试**

将 `list-pages.test.mjs` 对 `products.json` 的读取改为 `works.json`，并保留至少三个作品的断言。

- [ ] **Step 4：运行测试并确认 RED**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node --test \
  project/hub/data/works.test.mjs \
  project/hub/data/home.test.mjs \
  project/hub/pages/list-pages.test.mjs
```

预期：失败，因为 `works.json` 和 `featuredWorkIds` 尚不存在。

- [ ] **Step 5：迁移作品数据**

将 `products.json` 重命名为 `works.json`，迁移三个现有作品：

```text
20260205_card_game
20260517_shotmarker
20260619_zhangrh_shop
```

每条数据只保留六个已确认字段。作品列表顺序以 `works.json` 数组顺序为准。

每个作品的 `link` 指向对应的内部通用详情路由：

```text
/products/<作品 ID>
```

- [ ] **Step 6：迁移首页精选配置**

将 `home.json.featuredWorks` 替换为 `featuredWorkIds`，保持当前三个作品的首页展示顺序。不得在 `home.json` 中保留作品名称、简介或链接副本。

- [ ] **Step 7：运行数据测试并确认 GREEN**

重复 Step 4 的命令。

预期：所有数据契约和首页引用测试通过。

---

## Task 2：迁移本地作品图片

**文件：**

- Create: `frontend/project/hub/assets/works/20260205_card_game/cover.png`
- Create: `frontend/project/hub/assets/works/20260517_shotmarker/cover.png`
- Create: `frontend/project/hub/assets/works/20260619_zhangrh_shop/cover.png`
- Modify: `frontend/project/hub/data/works.test.mjs`
- Modify: `frontend/project/hub/data/works.json`

- [ ] **Step 1：补充图片存在性失败测试**

在 `works.test.mjs` 中把每个 `coverImage` 解析到：

```text
frontend/project/hub/assets/<coverImage>
```

验证文件存在，并验证路径确实位于当前作品 ID 的目录中。

- [ ] **Step 2：运行测试并确认 RED**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node --test project/hub/data/works.test.mjs
```

预期：失败，因为新的作品图片目录还不存在。

- [ ] **Step 3：迁移现有本地图片**

按设计目录移动或复制现有 `assets/cardgame.png` 和 `assets/calorie.png`：

- Card Game 使用现有 `cardgame.png`。
- ShotMarker 使用现有 `calorie.png`。
- Hub 当前也使用 `cardgame.png`，因此迁移时将同一现有图片复制为 Hub 的 `cover.png`；不在本任务中重新设计封面。

迁移后的文件统一命名为 `cover.png`。迁移完成后删除不再被引用的旧图片文件。

- [ ] **Step 4：更新 `coverImage`**

示例：

```json
{
  "id": "20260517_shotmarker",
  "coverImage": "works/20260517_shotmarker/cover.png"
}
```

- [ ] **Step 5：运行图片数据测试并确认 GREEN**

重复 Step 2 的命令。

预期：所有封面路径都能找到实际文件。

---

## Task 3：让 Vite 解析作品图片

**文件：**

- Create: `frontend/project/hub/shared/work-assets.ts`
- Modify: `frontend/project/hub/types.ts`
- Modify: `frontend/project/hub/shared/data.ts`
- Modify: `frontend/project/hub/shared/format.ts`

- [ ] **Step 1：建立图片资源映射**

在 `work-assets.ts` 使用：

```ts
import.meta.glob("../assets/works/**/*.{png,jpg,jpeg,webp,avif,svg}", {
  eager: true,
  import: "default",
  query: "?url",
});
```

实现 `resolveWorkAsset(relativePath)`：

- 只接受 `works/` 下的相对路径。
- 把相对路径转换成 glob 模块键。
- 返回 Vite 生成的 URL。
- 路径缺失时抛出包含原路径的错误。

- [ ] **Step 2：更新作品类型**

将：

```text
Product → Work
ProductStatus → WorkStatus
```

`Work` 只包含：

```ts
id
name
summary
coverImage
status
link
```

将 `HomeData.featuredWorks` 改为 `HomeData.featuredWorkIds`。

- [ ] **Step 3：更新共享数据模块**

`shared/data.ts`：

- 导入 `works.json`。
- 导出解析完图片 URL 的 `WORKS`。
- 建立按 ID 查询的作品映射。
- 导出按 `featuredWorkIds` 顺序解析的 `FEATURED_WORKS`。
- 首页 ID 缺失时抛出明确错误，不使用 `filter(Boolean)` 静默丢弃。

- [ ] **Step 4：移除旧图片 URL 兼容逻辑**

作品封面不再接受 HTTP、data 或 blob URL。删除只为外部 `coverImage` 服务的分支；保留其他仍被使用的日期或基础路径工具。

- [ ] **Step 5：运行 Hub 构建并确认当前消费者暴露错误**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run build -- hub
```

预期：如果页面仍引用 `PRODUCTS`、版本字段或旧类型，构建失败或页面测试仍失败。下一任务负责迁移所有消费者。

---

## Task 4：迁移首页、作品列表和通用详情页

**文件：**

- Rename: `frontend/project/hub/components/product-card.tsx` → `frontend/project/hub/components/work-card.tsx`
- Modify: `frontend/project/hub/pages/home-page.tsx`
- Modify: `frontend/project/hub/pages/products-page.tsx`
- Modify: `frontend/project/hub/pages/product-detail-page.tsx`
- Modify: `frontend/project/hub/app.tsx`
- Modify: `frontend/project/hub/pages/home-page-layout.test.mjs`
- Modify: `frontend/project/hub/pages/list-pages.test.mjs`

- [ ] **Step 1：补充页面结构失败测试**

更新现有 MJS 页面测试，验证：

- 首页使用 `FEATURED_WORKS`，不再访问 `HOME.featuredWorks`。
- 首页和作品列表都使用作品的 `link`。
- 页面不再读取 `currentVersion` 或 `currentVersionCommitDate`。
- 页面不再导入 `PRODUCTS`。

- [ ] **Step 2：运行页面测试并确认 RED**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node --test \
  project/hub/pages/home-page-layout.test.mjs \
  project/hub/pages/list-pages.test.mjs
```

预期：失败，因为页面仍在使用旧数据接口。

- [ ] **Step 3：迁移作品卡片**

将作品卡片改为 `WorkCard`：

- 使用 `Work` 和 `WorkStatus`。
- 保留封面、状态、名称和简介。
- 删除版本号和版本日期展示。
- 卡片操作使用唯一的 `work.link`。
- 保留当前视觉语言，不进行额外重设计。

- [ ] **Step 4：迁移首页**

首页改用 `FEATURED_WORKS`。展示名称、简介和固定的“查看作品”操作，不再从 `home.json` 获取作品文案或按钮文案。

- [ ] **Step 5：迁移作品列表**

作品列表直接按 `WORKS` 数组顺序展示，不再按版本日期排序。

- [ ] **Step 6：迁移通用详情页和标题**

通用详情页及 `app.tsx` 中的标题查找改用 `WORKS`。详情页删除版本元数据区，只保留当前数据模型能提供的内容。

- [ ] **Step 7：运行页面测试并确认 GREEN**

重复 Step 2 的命令。

- [ ] **Step 8：运行 Hub 构建**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run build -- hub
```

预期：

- 构建成功。
- `dist/hub/static` 中出现三个作品封面。
- 生成文件名包含 Vite 内容哈希。

---

## Task 5：让发布构建生成 OSS 图片地址

**文件：**

- Modify: `frontend/scripts/oss-static-lib.mjs`
- Modify: `frontend/scripts/oss-static-lib.test.mjs`
- Modify: `frontend/tools/publish-lib.mjs`
- Modify: `frontend/tools/publish-lib.test.mjs`
- Modify: `frontend/tools/publish.mjs`

- [ ] **Step 1：为项目 OSS base 写失败测试**

在 `oss-static-lib.test.mjs` 增加测试：

```text
projectName = hub
→ https://static.zhangrh.shop/zhangrh-shop/hub/
```

验证尾部只有一个 `/`，并复用现有项目名校验。

- [ ] **Step 2：为发布构建参数写失败测试**

在 `publish-lib.test.mjs` 增加纯函数测试，期望构建参数包含：

```text
run build -- hub --base https://static.zhangrh.shop/zhangrh-shop/hub/
```

- [ ] **Step 3：运行测试并确认 RED**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node --test \
  scripts/oss-static-lib.test.mjs \
  tools/publish-lib.test.mjs
```

预期：失败，因为 OSS 项目 base 和发布构建参数帮助函数尚不存在。

- [ ] **Step 4：实现 OSS 项目 base**

在 `oss-static-lib.mjs` 增加根据现有 `publicBaseUrl`、`uploadRoot` 和 `projectName` 生成项目 base 的纯函数。

- [ ] **Step 5：实现并接入发布构建参数**

在 `publish-lib.mjs` 增加纯函数生成 Vite 构建参数。`publish.mjs` 使用该函数，使发布构建传入项目对应的 absolute OSS base。

本地命令：

```bash
npm run build -- hub
```

保持现有 `/hub/` base，不依赖 OSS。

- [ ] **Step 6：运行发布脚本单元测试并确认 GREEN**

重复 Step 3 的命令。

- [ ] **Step 7：执行无网络的生产构建验证**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run build -- hub \
  --base https://static.zhangrh.shop/zhangrh-shop/hub/ \
  --outDir /tmp/zhangrh-shop-hub-oss-build-check
```

检查：

```bash
rg -n "https://static\\.zhangrh\\.shop/zhangrh-shop/hub/static/" \
  /tmp/zhangrh-shop-hub-oss-build-check/index.html \
  /tmp/zhangrh-shop-hub-oss-build-check/static
```

预期：

- HTML 的 JS/CSS URL 指向 OSS。
- JS 中的作品封面 URL 指向 OSS。
- 临时构建目录的 `static` 下包含作品图片。

本任务不调用真实 OSS API，不修改服务器。

---

## Task 6：完整验证

**文件：**

- Verify: `frontend/project/hub/**`
- Verify: `frontend/scripts/**`
- Verify: `frontend/tools/**`

- [ ] **Step 1：运行全部可执行前端测试**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node --test \
  scripts/*.test.mjs \
  tools/*.test.mjs \
  project/hub/data/*.test.mjs \
  project/hub/pages/*.test.mjs
```

预期：0 个失败。

- [ ] **Step 2：运行根目录自动化测试**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
npm test
```

预期：0 个失败。

- [ ] **Step 3：运行前端 lint**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run lint
```

预期：0 个错误。

- [ ] **Step 4：运行 Hub 本地构建**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run build -- hub
```

预期：构建成功，三个作品封面进入 `dist/hub/static`。

- [ ] **Step 5：本地预览**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run preview -- hub -- --host 127.0.0.1
```

检查：

- 首页按 `featuredWorkIds` 顺序展示三个作品。
- 作品列表展示全部作品。
- 所有封面加载成功。
- 三个作品链接可以进入对应 `/products/<id>` 页面。
- 通用详情页可以按新 ID 找到作品。

- [ ] **Step 6：确认发布不修改源数据**

在执行任何真实发布前后都运行：

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
git diff -- frontend/project/hub/data/works.json
```

预期：无差异。

- [ ] **Step 7：检查最终差异**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
git diff --check
git status --short
```

确认没有构建产物、临时文件或无关改动进入提交范围。

---

## 建议提交拆分

完成 Task 1–4 后：

```bash
git add frontend/project/hub
git commit -m "refactor: 统一 Hub 作品数据和本地图片"
```

完成 Task 5 后：

```bash
git add frontend/scripts frontend/tools
git commit -m "fix: 完善前端 OSS 资源构建地址"
```

Task 6 只做验证，不创建额外提交。
