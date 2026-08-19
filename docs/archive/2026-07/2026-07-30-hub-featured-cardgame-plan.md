# Hub 首页展示 CardGame 实施计划

## 目标

首页精选作品按 ShotMarker、CardGame 的顺序展示，并使用真实的 `Active`、`Paused` 状态角标。

## 步骤

1. 更新 `home.test.mjs`，期望 `featuredWorkIds` 同时包含 ShotMarker 和 CardGame。
2. 更新首页 SSR 测试，验证两张精选卡的顺序、链接和真实状态标签。
3. 运行目标测试，确认现有实现不能满足新要求。
4. 在 `home.json` 中追加 CardGame ID。
5. 在 `home-page.tsx` 中复用 `WorkStatusBadge`，替换通用 `Work` 角标。
6. 运行目标测试、完整前端测试、lint、类型检查、Hub 生产构建和 `git diff --check`。
7. 提交实现，快进合并到 main。
8. 重新发布 Hub，线上验证首页两张卡、状态和 CardGame 链接。

## 修改范围

- `frontend/project/hub/data/home.json`
- `frontend/project/hub/data/home.test.mjs`
- `frontend/project/hub/pages/home-page.tsx`
- `frontend/project/hub/pages/works-pages-render.test.mjs`

不修改 CardGame、ShotMarker、backend 或其他首页区域。
