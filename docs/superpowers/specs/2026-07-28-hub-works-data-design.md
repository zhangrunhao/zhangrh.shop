# Hub 作品数据与本地图片发布设计

## 背景

Hub 当前用两份数据描述同一批作品：

- `data/products.json` 为作品列表页和通用详情页提供完整作品数据。
- `data/home.json` 的 `featuredWorks` 为首页提供精选作品数据。

两份数据都包含名称、简介和链接。修改一个作品时需要同步更新两处，容易产生内容不一致。

当前 `products.json` 的封面是外部 OSS URL。Hub 仓库中虽然已有本地图片，但 JSON 字符串不会被 Vite 自动识别为模块依赖，因此这些图片不会因为出现在 JSON 中就自动进入构建产物。

## 目标

- 用 `works.json` 作为唯一的作品内容数据源。
- 首页只按 ID 选择作品并控制展示顺序，不复制作品内容。
- 作品列表和作品详情都读取同一份作品数据。
- 作品封面保存在 Hub 项目内，并在构建时进入带哈希的静态资源。
- 发布时自动把构建后的图片和其他静态资源上传到 OSS。
- 发布流程不修改源代码中的 `works.json`。

## 非目标

- 本次不设计每个作品的完整详情页内容。
- 本次不引入 CMS、数据库或远程内容接口。
- 本次不实现图片裁剪、压缩或格式转换服务。
- 本次不改造文章数据。
- 本次不重新设计 Hub 页面视觉样式。
- 本次不自动执行生产发布。

## 作品 ID

作品 ID 格式为：

```text
创建年月日_小写名称
```

示例：

```text
20260728_shotmarker
20260205_card_game
20260619_zhangrh_shop
```

约束：

- 日期部分固定为 8 位 `YYYYMMDD`。
- 日期使用作品创建当天的 Asia/Shanghai 自然日。
- 名称部分只允许小写字母、数字和下划线。
- 完整格式用正则 `^\d{8}_[a-z0-9]+(?:_[a-z0-9]+)*$` 校验。
- ID 创建后保持稳定；作品展示名称变化时不修改 ID。
- ID 只负责唯一标识，不负责控制首页或列表顺序。
- `works.json` 中的 ID 必须唯一。

现有作品迁移时使用已有数据中可确认的日期：

```text
20260205_card_game
20260517_shotmarker
20260619_zhangrh_shop
```

## `works.json`

将 `data/products.json` 重命名为 `data/works.json`。

每条作品只保留以下字段：

```json
{
  "id": "20260517_shotmarker",
  "name": "ShotMarker",
  "summary": "使用 Apple Watch 标记精彩击球并生成视频集锦。",
  "coverImage": "works/20260517_shotmarker/cover.png",
  "status": "active",
  "link": "/products/20260517_shotmarker"
}
```

字段含义：

- `id`：稳定的作品标识，同时用于详情路由和图片目录。
- `name`：作品展示名称。
- `summary`：首页、作品列表和当前通用详情页共用的简短介绍。
- `coverImage`：相对于 Hub `assets` 目录的本地图片路径。
- `status`：保留现有 `active | archived` 两种状态。
- `link`：点击作品后访问的唯一地址，可以是 Hub 内部详情页或外部地址。

以下字段从作品模型中移除：

- `currentVersion`
- `currentVersionCommitDate`

作品列表按 `works.json` 中的数组顺序展示，不根据 ID 日期自动排序。

## 首页数据

`data/home.json` 删除完整的 `featuredWorks` 内容，改为只保存 ID：

```json
{
  "featuredWorkIds": [
    "20260517_shotmarker",
    "20260205_card_game",
    "20260619_zhangrh_shop"
  ],
  "featuredArticles": [],
  "about": {}
}
```

以上示例只展示数据结构；实施时保留现有 `featuredArticles` 和 `about` 内容。

首页按 `featuredWorkIds` 的数组顺序从 `works.json` 查找作品。首页顺序变化时只调整这个 ID 数组。

约束：

- `featuredWorkIds` 中的 ID 不得重复。
- 每个 ID 必须存在于 `works.json`。
- 找不到作品时视为数据错误，不静默忽略。

## 本地图片目录

每个作品拥有独立图片目录：

```text
frontend/project/hub/assets/works/
├── 20260205_card_game/
│   ├── cover.png
│   ├── 01-overview.webp
│   └── 02-detail.webp
├── 20260517_shotmarker/
│   └── cover.png
└── 20260619_zhangrh_shop/
    └── cover.png
```

约定：

- 封面统一使用 `cover.<扩展名>`，新封面优先使用 `cover.webp`。
- 现有 PNG 图片迁移时保留 `.png` 格式，不通过改扩展名伪装成 WebP。
- 详情页图片可按展示顺序命名为 `01-overview.webp`、`02-detail.webp`。
- `coverImage` 必须指向 `assets/works/<作品 ID>/` 内存在的文件。
- 封面推荐使用 16:9 的 WebP 图片，建议尺寸为 1600×900。
- Vite 只负责复制和生成哈希文件，不负责自动压缩或转换图片。
- 现有图片迁移时保持当前展示内容，不在本次数据重构中评价或重做封面设计。

## 图片如何自动进入构建产物

仅在 JSON 中写：

```json
{
  "coverImage": "works/20260517_shotmarker/cover.png"
}
```

不会让 Vite 自动处理这张图片，因为 JSON 中的普通字符串不是模块导入。

Hub 需要增加一个图片资源映射模块。该模块使用 Vite 的 `import.meta.glob` 扫描：

```text
frontend/project/hub/assets/works/**
```

扫描时使用 URL 模式和 eager 加载，使每个匹配文件都成为 Vite 构建依赖。概念代码如下：

```ts
const workImages = import.meta.glob(
  "../assets/works/**/*.{png,jpg,jpeg,webp,avif,svg}",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
);
```

资源解析器把 `works.json` 中的：

```text
works/20260517_shotmarker/cover.png
```

转换为 glob 映射中的模块路径，并返回 Vite 生成的 URL。路径不存在时直接抛出包含作品 ID 和图片路径的错误。

构建后图片文件会类似：

```text
dist/hub/static/cover-Ab3x91.png
```

原始 `works.json` 仍然保留本地相对路径，不写入哈希文件名或 OSS 地址。

## 图片如何自动上传 OSS

现有发布脚本 `frontend/scripts/publish-oss-assets.mjs` 已经递归扫描：

```text
dist/<project>/static/**
```

并把其中所有文件上传到：

```text
https://static.zhangrh.shop/zhangrh-shop/<project>/static/
```

因此，只要本地图片先通过 Vite 进入 `dist/hub/static`，现有 OSS 上传步骤就会把它和 JS、CSS、favicon 一起上传，不需要为作品图片新增单独上传脚本。

需要调整生产构建的资源 base。发布 Hub 时，构建命令使用：

```text
https://static.zhangrh.shop/zhangrh-shop/hub/
```

作为 Vite `base`。这样 HTML、JS、CSS 以及打包进 JS 的图片引用都会直接使用 OSS 完整地址。

本地 `npm run dev` 和普通本地构建继续使用项目路径，不依赖 OSS。只有发布流程为生产构建传入 OSS base。

已通过现有 ShotMarker 图片构建进行可行性验证：给 Vite 传入完整 OSS base 后，HTML 和 JS 中的图片地址都会变成完整 OSS URL。

## 完整数据流

```text
assets/works/<id>/cover.<ext>
        ↓ import.meta.glob 建立资源映射
works.json 中的 coverImage 相对路径
        ↓ 构建时解析
dist/hub/static/cover-<hash>.<ext>
        ↓ 发布脚本递归扫描
上传到 static.zhangrh.shop
        ↓
页面通过构建生成的完整 OSS URL 加载图片
```

发布过程不修改：

```text
frontend/project/hub/data/works.json
```

## 页面数据流

### 首页

```text
home.json.featuredWorkIds
        ↓ 按数组顺序查找
works.json
        ↓
首页精选作品卡片
```

### 作品列表

```text
works.json
        ↓ 保持数组顺序
全部作品卡片
```

### 作品跳转

首页和作品列表的作品卡片都使用该作品的 `link`。内部地址继续交给现有 Hub `Link` 组件处理，外部地址按现有行为直接跳转。

现有通用详情路由 `/products/:id` 继续使用作品 ID 查找数据。独立作品详情页的内容结构另行设计。

## 类型和模块边界

`Product` 和 `ProductStatus` 重命名为 `Work` 和 `WorkStatus`。

```ts
type WorkStatus = "active" | "archived";

type Work = {
  id: string;
  name: string;
  summary: string;
  coverImage: string;
  status: WorkStatus;
  link: string;
};
```

职责划分：

- `data/works.json`：唯一的作品内容数据。
- `data/home.json`：首页选择和排序配置。
- 图片资源模块：把本地相对路径解析为 Vite 资源 URL。
- `shared/data.ts`：加载作品和首页数据，解析首页精选作品。
- 页面组件：只负责展示已经解析的数据。
- OSS 发布脚本：只处理 `dist` 构建产物，不修改源数据。

## 错误处理和校验

增加数据测试，至少覆盖：

- 所有作品只包含约定字段。
- ID 格式正确且唯一。
- `status` 只能是 `active` 或 `archived`。
- `name`、`summary`、`coverImage` 和 `link` 是非空字符串。
- `coverImage` 不允许使用 `http:`、`https:`、`data:` 或 `blob:`。
- `coverImage` 必须位于对应作品 ID 的图片目录。
- `coverImage` 指向的本地文件必须存在于资源映射中。
- `featuredWorkIds` 不重复，并且全部能在 `works.json` 中找到。
- 首页精选作品保持 `featuredWorkIds` 指定的顺序。
- 作品详情路由可以通过新 ID 找到作品。

发布与构建测试至少覆盖：

- 发布构建会传入当前项目对应的 OSS base。
- 本地构建不强制使用 OSS base。
- Hub 构建产物包含作品封面。
- 生产构建生成的图片引用指向 `static.zhangrh.shop/zhangrh-shop/hub/static/`。
- OSS 上传扫描包含构建后的图片文件。

## 迁移影响

实施时需要同步调整：

- `data/products.json` → `data/works.json`
- `data/home.json`
- `types.ts`
- `shared/data.ts`
- 图片资源解析模块
- 首页作品展示
- 作品列表页
- 通用作品详情页
- 作品卡片组件
- Hub 路由和页面标题中按 ID 查找作品的逻辑
- 相关数据、页面和发布脚本测试
- 发布构建的 OSS base 参数

现有外部 OSS 封面 URL 将从数据文件中移除，现有本地图片迁入按作品 ID 划分的目录。

## 验收标准

- 修改作品名称、简介、状态、封面或链接时只需要修改 `works.json` 和对应本地图片。
- 调整首页精选作品时只需要修改 `home.json` 的 ID 数组。
- 首页和作品列表不会维护重复的名称、简介或链接。
- 本地开发能够显示本地作品封面。
- Hub 生产构建包含带哈希的作品图片。
- 发布构建引用 OSS 图片地址。
- OSS 上传步骤包含作品图片。
- 发布前后 Git 工作区中的 `works.json` 内容不发生变化。
- 数据测试、前端 lint 和 Hub 构建通过。
