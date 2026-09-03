# WebTrace 官网与商店发布准备规格

完成状态：已于 2026-09-03 发布并完成公网只读验证。

## 当前结论

本 Change 在 zhangrh.shop 新增独立的 WebTrace 前端项目，提供产品首页、支持页和隐私政策页，并把三个页面发布到稳定公开 URL，供用户和 Chrome Web Store Developer Dashboard 使用。

本 Change 与 `chrome_plugin_time_tracker` 仓库中的同名 Change 配套实施。扩展的数据行为和商店材料由扩展仓库维护；本仓库负责公开页面、前端构建与部署事实。两个仓库直接在各自 `main` 分支工作，但分别验证、提交和推送。

## 背景

WebTrace 是本地优先的 Chrome 扩展，会处理用户配置的网站域名、打开时间和有效观看时长。即使数据不离开设备，Chrome Web Store 仍要求准确披露数据采集、使用和共享方式，并提供可访问的隐私政策。

截至 2026-09-03 核验的官方要求和发布字段见：

- [Chrome Web Store Program Policies](https://developer.chrome.com/docs/webstore/program-policies/policies)
- [Fill out the privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)
- [Complete your listing information](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)

## 目标

1. 在 `https://zhangrh.shop/webtrace/` 建立易读的产品首页和使用说明。
2. 在 `https://zhangrh.shop/webtrace/support` 建立支持与排障页面。
3. 在 `https://zhangrh.shop/webtrace/privacy` 发布准确、完整且中英双语的隐私政策。
4. 让三个页面与扩展新品牌、当前功能和本地优先边界一致。
5. 把 WebTrace 纳入前端项目发现、完整检查、构建、发布手册和公开部署契约。
6. 发布后执行公网只读验证，并把带日期的事实写入 current 文档。

## 非目标

- 本 Change 不在 Hub 新增 WebTrace 作品卡，也不改变 Hub 路由或埋点目录。
- 不给 WebTrace 官网增加登录、表单提交、评论、下载代理、产品分析或其他数据采集。
- 不修改 Backend、Nginx、证书、DNS、Track 协议或生产基础设施配置。
- 不在官网承诺 Chrome Web Store 已上架、已审核或提供尚不存在的商店链接。
- 不把官网发布等同于 Chrome Web Store 提交。

## 项目结构与路由

新增 `frontend/project/webtrace`，沿用现有 Vite + React 独立项目模式。项目至少包括：

- `app.tsx`：路由分发和页面组件；
- `content.ts`：产品、支持和隐私政策的结构化文案；
- `shared/route.ts`：base path 归一化和路由解析；
- `styles.css`：品牌与响应式样式；
- `index.html`、`main.tsx`、`vite.config.ts` 和 favicon；
- 必要的单元、内容和渲染测试；
- 从扩展仓库复制的公开品牌图标与合成产品截图，作为本项目受控静态资产。

路由契约：

| 公开路径 | 项目内路径 | 页面 |
| --- | --- | --- |
| `/webtrace/` | `/` | 首页与使用说明 |
| `/webtrace/support` | `/support` | 支持 |
| `/webtrace/privacy` | `/privacy` | 隐私政策 |

`/webtrace/how-to` 不作为额外公开契约。未知路径渲染 WebTrace 自己的 404 页面，并提供返回首页或支持页的链接。

## 首页设计

首页采用独立产品落地页而不是通用政策卡片。视觉沿用扩展的森林绿、暖白、深色文字和“时间轨迹”图形，兼顾桌面与移动端。

内容顺序：

1. Hero：WebTrace 名称、单一用途和真实分析页截图；
2. 显著隐私披露：明确写出“只记录用户配置的网站域名、打开时间和有效观看时长，全部仅保存在本机，不上传、不共享”；
3. 三步使用说明：添加网站、正常浏览、查看统计；
4. 计时解释：打开次数和有效时长的边界；
5. 本地数据说明：记录内容、不记录内容、长期保留与删除方法；
6. 功能概览：今日概览、最近 14 天趋势、访问明细、多网站和拖动排序；
7. 相关链接：支持、隐私政策、zhangrh.shop Hub。

首页不得暗示：

- WebTrace 限制网站使用或提供提醒；
- 数据会同步到云端或跨设备；
- 能查看最近 14 天以前的数据；
- 用户可删除网站配置；
- 已在 Chrome Web Store 上架。

## 支持页设计

支持页使用简体中文为主，至少包含：

- 安装后从工具栏打开 WebTrace；
- 添加网站时输入名称、域名或 HTTP/HTTPS URL；
- 添加网站后需离开并重新进入才会产生首次访问，不追溯当前页面；
- 有效时长仅在目标标签页活动、Chrome 前台、页面可见且设备未锁屏时累计；
- 刷新、站内跳转、跨子域名跳转和同站子标签继承不重复计算打开次数；
- 最近 14 天趋势和按打开日期归属的访问明细；
- 鼠标长按网站或触摸右侧把手进行排序；
- 删除历史会永久移除目标网站访问记录，但保留配置并继续统计；
- 常见问题和排查步骤；
- 支持邮箱 `zhangrhweb@gmail.com`，以及首页和隐私政策链接。

支持页不提供会向服务器提交扩展数据的网页表单。联系支持时提示用户不要发送敏感浏览数据；若用户主动通过邮件分享信息，则由其邮件服务处理，不属于扩展自动传输。

## 隐私政策设计

隐私页采用中英双语，并以 2026-09-03 为生效与最后更新日期。中文和英文必须表达相同事实，不使用含糊的“可能收集”替代当前已确认行为。

### 处理的数据

- 用户输入的网站名称及归一化后的可注册主域名；
- 网站访问的打开时间、结束时间、有效观看区间和由此计算的时长；
- 为本地关联网站、访问和会话所需的随机技术标识与 checkpoint；
- 为判断有效时长而临时处理的活动标签页、窗口前台/最小化、页面可见和设备锁屏状态。

### 明确不处理的数据

- 完整 URL、路径、查询参数和网页标题；
- 网页正文、图片、表单输入、密码、Cookie 或身份认证数据；
- 姓名、邮箱、账号、广告标识或精确位置；
- 鼠标移动、键盘输入或普通无输入状态。

### 用途与存储

- 数据只用于展示用户配置网站的打开次数、有效观看时长、最近 14 天趋势和逐次访问明细；
- 网站配置保存在 `chrome.storage.local`，会话映射和恢复 checkpoint 保存在 `chrome.storage.session`，访问记录保存在扩展 IndexedDB；
- 扩展不向 zhangrh.shop、开发者服务器或第三方发送这些数据，也不加载远程可执行代码。

### 保留、删除与控制

- 访问记录默认长期保留，没有自动过期；分析页只展示最近 14 天不等于删除旧记录；
- 用户可按网站永久删除历史，操作不可撤销，但网站配置保留并继续统计；
- 卸载扩展会删除 Chrome 为该扩展保存的本地数据；
- 用户通过 Chrome 的扩展管理页控制扩展是否启用、站点访问权限和卸载。

### 不共享与 Limited Use

- 不出售、出租、授权或共享扩展数据；
- 不用于个性化广告、再营销、信用评估或数据经纪；
- 开发者和第三方无法读取只保存在用户设备上的扩展数据；
- 数据只用于或改进 WebTrace 已披露的单一用途；
- 明确声明 WebTrace 对用户数据的使用遵守 Chrome Web Store User Data Policy，包括 Limited Use 要求。

隐私页还需包含权限说明、儿童隐私、政策变更、联系邮箱和指向首页的链接。政策变更不得追溯性淡化旧版本行为；若未来数据实践变化，需在实施前建立独立 Change 并更新产品内显著披露。

## 视觉与响应式要求

- 使用扩展仓库确认后的 WebTrace 图标，不自行维护第二套品牌图形。
- 产品截图只使用隔离环境生成的合成数据，不含真实用户信息。
- 页面正文在 320px 以上视口可用，重点验收 390×844 和 1280×800。
- 链接、按钮和政策标题可键盘访问，颜色对比清晰，图片包含准确替代文本。
- 支持 `prefers-reduced-motion`，装饰动画不能影响阅读或操作。
- 公开页面不加载远程字体、远程脚本或第三方嵌入。

## 构建、发布与文档

### 项目发现与检查

- 现有开发和发布菜单通过扫描 `frontend/project` 自动发现 `webtrace`。
- `frontend/package.json` 的 `build:all` 明确加入 WebTrace，使根 `npm run check` 覆盖其生产构建。
- 需要更新相应测试，确保完整构建目标与公开组件清单包含 WebTrace。

### 发布

使用现有前端发布流程发布 `webtrace`：拉取 Git、生产构建、上传受控静态资源、改写 HTML 资源地址、通过 SSH/rsync 发布 HTML。发布授权只覆盖新增 WebTrace 前端目标，不修改 Backend 或基础设施。

发布后只读检查三个页面及当次 HTML 引用的 JS、CSS、图标和截图资源。浏览器检查桌面与移动视口、内部路由、标题/描述、控制台和横向溢出。

### 当前文档

完成前更新：

- `docs/current/project.md`：加入 WebTrace 公开能力和页面事实；
- `docs/current/deployment.md`：加入 `/webtrace/` 拓扑、发布和带日期公网证据；
- `docs/current/development.md`：更新项目数量、检查覆盖和当次验证；
- `docs/current/automation.md`：确认自动发现 WebTrace 后的入口事实；
- `RUNBOOK.md`：加入本地启动、单独构建、发布和发布后检查命令。

若没有给 WebTrace 官网新增 Track 调用，则 `docs/current/track.md` 不增加 WebTrace 网页事件。

## 错误与边界

- 未知前端路径显示本项目 404，不跳转到错误产品。
- 图片加载失败时正文和链接仍可理解产品功能。
- 公网发布失败时停止记录“已上线”事实；保留通过本地验证的代码，并报告具体失败阶段。
- 如果发布脚本需要扩展现有生产基础设施范围，则停止执行并请求新授权。
- 如果扩展实现与准备文案不一致，以当前代码和当次验证为准，先修正文案或实现，不能发布矛盾政策。

## 验收标准

### 自动验证

- WebTrace 路由、内容、隐私关键语句和默认 HTML 元数据有测试覆盖。
- `npm run check` 在 Node.js 24 下通过，包括全部前端测试、lint、TypeScript 和五个前端生产构建。
- `git diff --check`、本地 Markdown 链接和标题锚点检查通过。

### 浏览器验证

- `/webtrace/`、`/webtrace/support`、`/webtrace/privacy` 在本地预览中正确渲染。
- 1280×800 和 390×844 视口无横向溢出，控制台无错误或警告。
- 路由直接访问和页内链接均正确，页面标题和 meta description 随路由更新。
- 首页截图、图标和隐私重点在浅色与深色环境下可读。

### 公网与跨仓库

- 发布后上述三个 HTTPS URL 和页面引用资源返回成功响应。
- 官网文案与 `chrome_plugin_time_tracker` 当前代码、商店发布手册和公开隐私披露一致。
- 两个仓库的 spec/plan 使用同一日期和 topic，完成后先更新各自 current，再分别归档。
- Notion 状态准确记录官网已部署、材料已准备和商店尚待手工提交。
