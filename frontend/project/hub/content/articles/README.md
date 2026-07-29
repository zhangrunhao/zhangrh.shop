# 文章目录规则

这里存放发布到 zhangrh.shop 的 Markdown 文章。Notion 继续负责写作和发布状态管理；确认发布后，将文章手动导出为 Markdown 并放入本目录。

## 一篇文章一个目录

目录名必须使用：

```text
YYYY-MM-DD_XXXXXX_short-english-name
```

例如：

```text
2026-07-26_100001_codex-subagent/
├── index.md
└── assets/
    └── context-flow.png
```

- `YYYY-MM-DD`：文章第一次发布到 zhangrh.shop 的日期，必须是真实日期。
- `XXXXXX`：永久不变且不能重复的六位数字 ID。建议从 `100001` 开始，每次取当前最大 ID 加一。
- `short-english-name`：只允许小写英文字母、数字和连字符；仅用于方便在仓库中辨认，不参与网站地址。
- 文章发布后的固定地址为 `/hub/articles/XXXXXX`。
- 纯文字文章也需要单独目录，但可以没有 `assets/`。
- 不提供单独的文章创建命令；按上述规则手工新建目录即可。

## Markdown 规则

每篇文章的正文文件固定为 `index.md`，不写 Front Matter：

```md
# Codex Subagent：如何隔离 Coding Agent 的上下文

> Subagent：管理上下文的一种方法

正文……

![上下文隔离流程](./assets/context-flow.png)
```

- 第一个一级标题是文章标题。
- 标题后的第一个段落或引用块是文章摘要。
- 必须同时提供标题和摘要。
- 暂不支持在 Markdown 中直接写 HTML。
- 普通外部链接可以正常使用。

## 图片规则

- 图片放在当前文章目录的 `assets/` 中，可以继续建立子目录。
- Markdown 使用相对于 `index.md` 的本地路径，例如 `./assets/context-flow.png`。
- 不要保留 Notion 导出的临时签名图片地址；必须把图片文件一并放入 `assets/`。
- 开发和构建时，图片会自动复制到生成目录；生产构建会把正文中的图片地址改为现有 OSS 地址。
- 不需要单独上传图片。现有发布流程会递归上传构建产物中的文章图片。

文章列表、标题、摘要、发布日期和正文数据都由现有 `dev` / `build` 流程自动生成，不要手动维护 `articles.json`。
