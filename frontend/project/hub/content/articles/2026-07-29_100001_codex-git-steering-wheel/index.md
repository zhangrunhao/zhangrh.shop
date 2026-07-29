# 一次错误的 Git Tracking：我为什么不再把方向盘完全交给 Coding Agent

> 一次错误的分支 tracking，让功能分支提交绕过正常合并流程进入了主分支。真正危险的不是某条 Git 命令，而是我默认工具流程会自己正确。

这次事情表面上是一个 Git 分支 tracking 配错的问题。

但我真正想记录的，不是 `git worktree add` 这条命令本身，而是我在使用 Codex 时暴露出来的一个问题：

> 我太相信流程会自己正确了。

文中统一使用 `main` 表示项目主分支。

## 一条被我忽略的提示

当时我想让 Codex 在一个独立 worktree 中处理代码清理任务。

创建功能分支时，执行了类似下面的命令：

```bash
git fetch origin main
git worktree add \
  .worktrees/codex/test-code-cleanup \
  -b codex/test-code-cleanup \
  origin/main
```

我的理解很简单：

> 基于最新的 `origin/main` 创建一个功能分支，然后让 Codex 在独立目录里工作。

Git 当时其实已经明确给出了提示：

```text
branch 'codex/test-code-cleanup' set up to track 'origin/main'.
```

我没有认真看。

本地分支虽然叫：

```text
codex/test-code-cleanup
```

但它的 upstream 是：

```text
origin/main
```

也就是：

```text
codex/test-code-cleanup → origin/main
```

这是一个非常危险的关系。

## 基于主分支与 tracking 主分支不是一回事

功能分支当然可以基于 `main` 创建。

这表示它从主分支当前提交开始：

```text
origin/main
    ↓
codex/test-code-cleanup
```

随后功能分支拥有自己的提交历史，并通过正常的 Pull Request 或 merge 流程回到主分支。

但 tracking 描述的是另一种关系：本地分支默认从哪个远端分支拉取，以及在某些配置或命令下向哪个远端分支推送。

```text
基于 main
= 起点问题

tracking origin/main
= 上游关系问题
```

这两件事不能混在一起。

需要说明的是，设置 upstream 本身不会自动修改远端。真正的危险出现在后续的 `push`、`pull`、`rebase` 或自动化流程继续依赖这段错误关系，而执行者没有重新确认目标。

在我当时的命令、Git 配置和后续操作组合下，功能分支上的提交最终进入了 `origin/main`。

## 问题是怎样被发现的

后来我看到功能分支上的提交全部出现在了远端主分支。

更严重的是，中间没有正常的 Pull Request、merge commit 或者明确的合并过程。

这些提交就这样成为了主分支历史的一部分。

这时问题已经不是“可能有风险”。

问题已经发生了：

- `git push` 已经执行；
- `git rebase` 已经执行；
- 其他功能分支已经基于新的主分支继续工作；
- 远端历史已经成为团队新的开发基线。

Git 技术上当然可以回退，甚至可以重写远端历史。

但协作环境里，能不能做和应不应该做不是一回事。

其他分支已经基于这些节点进行 rebase，如果这时强行改写 `main` 历史，会让更多人的提交关系受到影响。

所以最后只能接受一个事实：

> 后续提交需要基于这些已经进入主分支的节点继续向前。

万幸的是，这批提交中的代码本身没有明显问题。

如果里面包含实验代码、破坏性修改或者不应该进入主分支的内容，这就不只是一场 Git 事故，还可能继续扩大成线上事故。

## 真正的问题不是 Git

这次问题的根源，不是 Codex 故意做错了什么，也不是 Git 神秘地合并了代码。

真正的问题是：

> 我没有把关键操作的确认权握在自己手里。

Codex 可以帮我写代码、补测试、整理文档和执行检查。这些都很好。

但下面这些操作不只是普通的文件修改：

```text
git worktree add
git branch
git switch
git pull
git push
git rebase
git merge
```

它们会影响：

- 当前工作所在的分支；
- 本地与远端的对应关系；
- 团队共享的提交历史；
- 其他分支之后的开发基线；
- 代码是否绕过正常审查进入主分支。

我当时只关心 Codex 有没有完成任务，却没有认真确认它站在哪个分支、指向哪个远端、准备把历史推到哪里。

## 当时只要看一眼就能发现

创建 worktree 后，如果执行：

```bash
git branch -vv
```

就可能看到类似结果：

```text
codex/test-code-cleanup abc1234 [origin/main] docs: 补充测试维护说明
```

这里的 `[origin/main]` 已经在提醒我：功能分支的 upstream 不符合预期。

也可以使用：

```bash
git status --short --branch
git config --get-regexp '^branch\..*\.\(remote\|merge\)$'
```

检查当前分支状态与 tracking 配置。

我并不需要理解 Git 所有内部实现。

只需要在创建任务以后认真看一次命令输出和分支关系，这次问题就很可能被挡住。

## 怎样创建一个不 tracking 主分支的 worktree

一种做法是在创建时明确使用 `--no-track`：

```bash
git worktree add \
  .worktrees/codex/test-code-cleanup \
  -b codex/test-code-cleanup \
  --no-track \
  origin/main
```

如果分支已经创建，也可以解除错误的 upstream：

```bash
git branch --unset-upstream codex/test-code-cleanup
```

这条命令不会删除分支，也不会修改任何提交，只会移除 upstream 关系。

第一次推送功能分支时，再明确绑定同名远端分支：

```bash
git push -u origin codex/test-code-cleanup
```

重点不只是记住这些命令。

重点是每次都确认：

```text
当前在哪个分支
→ 分支基于哪个提交
→ upstream 指向哪里
→ push 会改变哪个远端引用
```

## 我现在固定执行的检查

### 任务开始前

```bash
git status --short --branch
git branch -vv
git remote -v
```

确认：

- 当前工作区是否干净；
- 当前分支是谁；
- 有没有错误的 upstream；
- `origin` 指向哪个仓库。

### 创建 worktree 后

```bash
git -C .worktrees/codex/test-code-cleanup status --short --branch
git branch -vv
```

确认新的 worktree 确实位于预期功能分支。

### 提交任务后

```bash
git status --short --branch
git log --oneline --decorate -5
git branch -vv
```

确认：

- 修改已经正确提交；
- HEAD 位于预期分支；
- 最近提交没有进入错误的历史；
- upstream 没有悄悄改变。

### 涉及远端操作前

如果接下来要执行 `push`、`pull`、`rebase` 或 `merge`，我会再停一下，明确说出：

```text
本地分支是什么？
远端目标是什么？
这条命令成功以后，哪个引用会发生变化？
```

如果这三个问题没有答案，就不应该继续。

## 哪些操作必须把方向盘留在人手里

这次事情以后，我不再用“是否能自动完成”判断一件事要不要完全交给 Agent。

我还会看它的影响是否容易撤销。

普通代码修改通常有 Git diff，有测试，也可以回退。

但下面这些操作影响的是共享状态：

- 推送主分支；
- rebase 已经共享的提交；
- 强制推送；
- 修改远端配置；
- 删除分支或者 tag；
- 发布生产环境；
- 修改数据库和权限；
- 读取、移动或者删除大范围文件。

它们不是不能让 AI 执行。

而是执行前必须由人确认目标，执行后必须由人检查结果。

## AI 编程不是完全自动驾驶

我以前容易把 Codex 当作一个可以直接接走任务的人。

这次事情提醒我，它更像一个很强的副驾驶。

它可以提速，可以处理大量细节，也可以比我更耐心地执行检查。

但路线、分支、远端和最终责任，仍然需要我自己确认。

越是使用 AI，越需要一份自己的检查清单。

因为 AI 会让我做事变快，而检查流程如果没有同时变强，错误也会被更快地放大。

这次真正的教训是：

> 使用 Coding Agent 时，我不能只看代码有没有改对，还要看分支有没有站对、远端有没有指对、历史有没有推对。

AI 可以帮我踩油门，但方向盘必须在我手里。
