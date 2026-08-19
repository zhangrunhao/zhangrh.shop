# ShotMarker 公开页面内容同步设计

- 日期：2026-08-19
- 状态：已实现
- 实施仓库：`zhangrh.shop`
- 事实来源仓库：`ShotMarker`
- 核验基线：`zhangrh.shop` main / `a0470f7`；`ShotMarker` main / `41bfda2`，产品代码基线 `42c249a`

## 背景与根因

`frontend/project/shotmarker` 维护 ShotMarker 的公开支持页、使用说明和隐私政策。现有支持与隐私基础文案主要形成于 2026-05-17；此后 ShotMarker 在 2026-06-15 调整了诊断日志导出入口、增加了 iCloud 视频准备与持久化集锦任务，在 2026-08-16 又接入了 GlitchTip 错误与崩溃上报和第一方产品 Analytics。

网站已经同步第一方 Analytics 契约，但没有完整同步其他实现变化。现有测试主要断言旧文案仍然存在，因此测试通过只能证明页面可以渲染和旧契约没有被删除，不能证明公开说明与当前 App 一致。

当前确认的差异如下：

| 公开内容 | 当前实现 | 影响 |
| --- | --- | --- |
| 隐私政策只描述第一方 Analytics 和本地诊断日志 | iOS App 已自动上报未捕获崩溃，并远程发送精简的 `.error` 事件 | 用户无法从政策中完整了解会离开设备的诊断数据 |
| FAQ 要求点击首页右上角导出按钮导出诊断日志 | 右上角按钮用于训练记录导入/导出；诊断导出需要长按导航标题“训练记录”5 秒 | 用户会导出错误的数据类型，无法按说明取得诊断日志 |
| iCloud FAQ 只建议先去照片 App 打开视频 | App 已内置视频下载/准备、进度、暂停和恢复流程 | 首选排障步骤已经过时 |
| 政策声称诊断日志按本地保留策略自动删除 | `AppLogStore` 配置为 14 天和 30 MiB，但当前只在诊断导出开始时调用 `cleanup()` | 页面把配置目标写成了持续生效的实现事实 |
| 本地保留说明只列出训练、设置、Watch outbox 和日志 | App 还持久化集锦任务、必要的输入副本和生成结果 | 本地视频与任务数据的保留和删除边界披露不完整 |
| how-to 只说完成后可以播放和保存 | 点击生成后会创建持久化队列任务、返回首页，并在“集锦任务”区域提供后续操作 | 用户不知道任务在哪里继续查看和管理 |

## 目标

- 使 `/shotmarker/privacy`、`/shotmarker/support` 和 `/shotmarker/how-to` 与当前 ShotMarker 实现和有效公开决定一致。
- 明确区分第一方产品 Analytics、自动错误/崩溃上报和完整本地诊断日志三条数据链路。
- 给出当前可操作的诊断导出、iCloud 视频准备和集锦任务说明。
- 完整说明集锦任务文件、系统照片库、Apple Health 和 App 沙盒之间的保留与删除边界。
- 用自动化测试锁定新的内容契约，避免再次依赖人工跨仓库比对。

## 非目标

- 本 Change 不修改 ShotMarker App 代码、App Store Connect 回答、GlitchTip 生产配置或 Track Backend。
- 不发布网站，不访问或写入生产服务，不生成真实 Track 事件。
- 不声称当前 TestFlight、App Store、Analytics 或 GlitchTip 线上状态已经验证。
- 不改变三个公开路由、Track 三参数协议或四个 ShotMarker Analytics 事件。
- 不在公开仓库记录 GlitchTip 凭据、服务器路径、原始事件、用户标识或其他私有基础设施值。
- 不加入尚未实现的语音口令、技术统计或其他规划功能。

## 实施复核修正

- 完成前的只读代码审查继续检查了锁定的 `sentry-cocoa 9.26.0` 源码。`SentryClient.prepareEvent` 会在 ShotMarker 构造精简 `.error` 事件后补充 release、build、environment、SDK 元数据、当前线程栈与调试镜像、App/设备/系统/语言区域/当前视图上下文；该 v9 路径还会补充安装范围的 Sentry user ID。
- 因此，下文原先把 `makeRemoteEvent` 发送前字段视为最终网络 payload 的设计已修正：最终页面分别披露 App 主动提供的字段、未复制的业务字段和 SDK 自动补充字段，并明确 `sendDefaultPii = false` 不会阻止该版本加入安装范围 ID。
- HTTPS 源 IP 会暴露给接收网络基础设施；当前 GlitchTip 部署是否保留该地址仍标记为未独立核验。
- 本 Change 不执行发布，无法产生实际公开日期；最终页面使用 `Effective date: Upon publication`，并以 `LAST_UPDATED = 2026-08-19` 记录内容完成日期。

## 事实来源与使用规则

### 权威顺序

1. 实现、构建和运行行为以 ShotMarker 当前代码、测试和当次验证为准。
2. 已生效的产品、隐私和数据契约以 ShotMarker `docs/current/` 为准。
3. `zhangrh.shop/docs/current/track.md` 只负责 Track 服务端与查询契约，不承担 GlitchTip 或 App 本地数据事实。
4. `docs/archive/` 只用于解释历史根因，不得作为当前实现的唯一证据。
5. 容易变化的线上状态只能来自当次外部验证或私有台账；未验证时必须保留日期或明确写成未确认。

### ShotMarker 当前文档

| 文件 | 本 Change 使用的事实 |
| --- | --- |
| `ShotMarker: docs/current/product.md` | Watch 打点、iPhone 视频选择、持久化集锦任务、播放和手动保存的当前用户流程；本地优先边界 |
| `ShotMarker: docs/current/architecture.md` | 训练记录、集锦任务与任务文件的持久化位置；日志配置；Sentry/GlitchTip target 范围和隐私边界 |
| `ShotMarker: docs/current/analytics.md` | Release iPhone 的四事件、三参数请求、安装标识、失败语义和 Analytics 排除项 |
| `ShotMarker: docs/current/release.md` | 当前版本、受支持产品范围，以及公开披露不得声称完全离线的要求 |
| `ShotMarker: docs/current/status.md` | GlitchTip、Analytics、真机和线上链路的已实现与未验收边界 |

### ShotMarker 实现文件

| 文件 | 需要核对的实现事实 |
| --- | --- |
| `ShotMarker: ShotMarker/ShotMarkerApp.swift` | iOS 启动早期初始化 GlitchTip；Analytics 仅在 Release iPhone 使用真实客户端 |
| `ShotMarker: ShotMarker/Services/AppLogging/GlitchTipCrashReporter.swift` | Sentry/GlitchTip 配置、精简错误事件字段、默认 PII、性能追踪、Session Replay 和其他关闭项 |
| `ShotMarker: ShotMarker/Services/AppLogging/AppLogger.swift` | 只有 `.error` 同时进入远端上报器；其他日志级别只写本地 |
| `ShotMarker: ShotMarkerTests/GlitchTipConfigurationTests.swift` | 精简错误事件允许字段及明确排除的 context、路径和原始错误描述 |
| `ShotMarker: ShotMarkerTests/AppLoggerTests.swift` | `.error` 远端上报与非 error 不上报的契约 |
| `ShotMarker: ShotMarker/Services/AppLogging/AppLogStore.swift` | 日志按日写入、14 天和 30 MiB 配置，以及清理只在显式调用时发生 |
| `ShotMarker: ShotMarker/Services/AppLogging/AppLogExportService.swift` | 导出包内容和当前唯一生产 `cleanup()` 调用点 |
| `ShotMarker: ShotMarker/Views/TrainingSessionListView.swift` | 右上角训练记录导入/导出按钮；长按标题 5 秒触发诊断日志导出 |
| `ShotMarker: ShotMarker/Views/TrainingSessionHighlightView.swift` | 视频准备确认、进度、暂停/恢复、生成任务后返回首页的实际流程 |
| `ShotMarker: ShotMarker/Services/SelectedTrainingVideoSelectionItem.swift` | “未下载或未准备好”、准备中和已暂停等状态 |
| `ShotMarker: ShotMarker/Services/PhotoLibraryVideoAssetProvider.swift` | 本地可用性检查和允许网络下载的高质量视频准备请求 |
| `ShotMarker: ShotMarker/Models/HighlightJob.swift` | 集锦任务保存的训练、视频来源、设置、状态和输出路径 |
| `ShotMarker: ShotMarker/Services/HighlightJobFileStore.swift` | 必要输入副本和输出视频在 App 沙盒中的路径及删除行为 |
| `ShotMarker: ShotMarker/ViewModels/HighlightJobManager.swift` | 任务创建、取消、重启、播放、保存、清理和文件生命周期 |
| `ShotMarker: ShotMarker/Views/HighlightJobListSection.swift` | 首页任务区的播放、保存、删除、重启和取消入口 |
| `ShotMarker: ShotMarkerWatchApp/Views/WatchTrainingView.swift` | 长按开始/结束、双击按钮和数码表冠打点 |
| `ShotMarker: ShotMarker/PrivacyInfo.xcprivacy` | Analytics 的 Device ID、Product Interaction 和 Tracking 声明；它不代替错误/崩溃公开披露 |

### zhangrh.shop 实施文件

| 文件 | 职责 |
| --- | --- |
| `frontend/project/shotmarker/content.ts` | 三个页面的中英文正文、日期、联系信息和相关链接 |
| `frontend/project/shotmarker/content.test.ts` | 内容契约的正向与负向断言 |
| `frontend/project/shotmarker/app.tsx` | how-to 步骤、截图和可访问文本的渲染 |
| `frontend/project/shotmarker/how-to-page-render.test.mjs` | how-to 静态渲染与链接/截图结构验证 |
| `frontend/project/shotmarker/assets/how-to/` | 与当前 App 界面一致且不包含真实用户数据的演示截图 |
| `docs/current/project.md` | ShotMarker 公开页面组件范围和完成后的最近复核事实 |
| `docs/current/track.md` | 继续作为第一方 Analytics 服务端契约来源，不复制 GlitchTip 事实 |

## 内容设计

### 1. 隐私政策：分离三条数据链路

隐私页必须把以下三类数据处理分别成段说明，不得再用“诊断日志”一词同时指代它们：

1. **First-Party Product Analytics / 第一方产品分析**
   - 保留当前四事件、`project`、`event`、`device_id`、服务器接收时间和单一 JSONL 保留边界。
   - 明确只在 Release iPhone 启用，不发送训练、打点、视频、HealthKit、错误或诊断数据。
2. **Crash and Error Reporting / 崩溃与错误上报**
   - 说明配置了有效 DSN 的 iOS App 会使用 Sentry SDK 向开发者运营的 GlitchTip 服务发送未捕获崩溃和精简业务错误；Watch App 不接入该链路。
   - ShotMarker 主动提供固定消息、错误名称和分类、时间，以及可选的 error domain/code；不把 `AppLogEvent.context`、训练 ID、任务 ID、视频 ID、路径或原始错误描述复制到远端事件。
   - Sentry Cocoa 9.26.0 在发送前还可能补充 release、build、environment、SDK 元数据、当前线程栈与调试镜像，以及 App、设备、系统、语言区域和当前视图上下文；原生崩溃报告可包含崩溃堆栈和相似技术环境。
   - `sendDefaultPii` 设为 false，App 不设置账号身份；但该 SDK 版本仍会加入独立于第一方 Analytics 12 位标识的安装范围 Sentry user ID。App 不附加训练记录、视频、截图或完整本地日志文件。
   - HTTPS 请求的源 IP 会暴露给接收网络基础设施；当前 GlitchTip 部署是否保留该地址未经独立核验，不作绝对声明。
   - 明确性能追踪、Profiling、Session Replay、自动 Session Tracking、网络追踪和自动 Breadcrumb 已关闭。
   - 不从 Track 的无固定过期策略推导 GlitchTip 保留周期。没有新的外部证据时，不写未经证实的固定天数；只说明数据用于故障诊断并保留联系入口。
3. **Local Diagnostic Logs / 本地诊断日志**
   - 说明完整 JSONL 日志和 iPhone 侧 WatchConnectivity 诊断保存在本地，只有用户主动导出并分享后开发者才能看到完整导出包。
   - 同时明确其中 `.error` 的精简子集可能通过上一条 GlitchTip 链路自动发送，避免“只有主动分享才会离开设备”的笼统表述。

摘要和“What ShotMarker Does Not Do”必须同步改写：可以继续声明不使用第三方产品 Analytics 服务，但必须同时承认使用 Sentry SDK 连接开发者运营的错误报告服务。不得用“不使用第三方 SDK”概括整个 App。

### 2. 隐私政策：本地数据、保留与删除

“Data Retention and Deletion”至少覆盖：

- 训练记录、剪辑设置、Watch outbox、安装标识和本地诊断日志。
- 集锦任务保存的训练快照、视频本地标识、剪辑设置、状态、错误状态和输出路径。
- PhotosPicker 无法保持照片库资产引用时，为持久任务复制到 App 沙盒的必要输入视频，以及任务完成后的本地输出视频。
- 取消任务或删除任务会移除对应任务文件；删除 App 会移除 App 沙盒和 UserDefaults 中的数据。
- 原始照片库视频和已经手动保存到系统相册的集锦由照片 App 管理，删除任务或卸载 ShotMarker 不会自动删除这些照片库内容。
- HealthKit workout 由 Apple Health 和系统权限管理，卸载 ShotMarker 不等于删除 Apple Health 中已经保存的 workout。

本地日志的“自动清理”是发布门槛：

- 如果 ShotMarker 在本 Change 发布前另行实现并验证启动或持续运行期间调用 `AppLogStore.cleanup()`，政策可以写明 14 天和 30 MiB 上限。
- 如果没有完成该跨仓库修复，政策只能写当前实现事实：日志按日写入，准备诊断导出时执行配置清理，删除 App 会删除本地日志；不得承诺持续自动执行 14 天或 30 MiB 上限。
- 若选择修复 App，应在 ShotMarker 仓库建立同日期、同主题 Change，并独立测试、记录和归档；本 spec 不授权直接修改 ShotMarker。

### 3. 支持页：诊断日志导出

FAQ 第 1 条和第 6 条的中英文步骤统一为：

1. 在 iPhone 打开 ShotMarker 首页。
2. 长按页面中央导航标题“训练记录”5 秒。
3. 在“是否导出诊断日志？”提示中选择“导出”。
4. 使用系统分享面板选择是否把生成的诊断文件发送给支持邮箱。

页面必须明确右上角向下/向上箭头分别用于训练记录导入和导出，不是诊断日志入口。完整诊断文件只有用户选择分享时才会交给开发者；自动 GlitchTip 精简错误属于隐私页说明的另一条链路。

### 4. 支持页：iCloud 视频准备

iCloud FAQ 的首选流程更新为：

1. 选择视频后，如果卡片显示“未下载或未准备好”，点击该视频卡片。
2. 在“下载或准备视频？”提示中确认“开始”；提示可能使用网络流量。
3. 通过卡片查看准备进度；再次点击准备中的卡片可暂停，点击已暂停卡片可重新开始准备。
4. 失败时先确认网络可用后重试；在照片 App 中打开并完整播放原视频只作为补充排障方法。

不得承诺底层请求一定从原字节位置续传；页面只描述用户可见的暂停和重新准备行为。

### 5. 使用说明：持久化集锦任务

how-to 第 3 步补充以下事实：

- 点击“生成集锦”会创建持久化队列任务并返回首页；任务在 App 进程内串行执行，不承诺退出 App 或锁屏后仍由系统后台持续运行。
- 首页“集锦任务”区域展示排队、处理中、完成、失败或中断状态。
- 完成后可以播放、重复尝试保存到系统相册或删除任务；失败/中断任务可以重新开始，可取消的任务可以取消。
- 保存到相册和生成完成是两个独立动作。
- App 再次启动时，遗留的排队、运行或保存中任务会标记为中断，用户可以在首页重新开始。

增加一张来自当前模拟器或真机演示数据的“已完成集锦任务”截图，并在 `app.tsx` 中用于第 3 步。截图不得包含真实训练、用户标识、设备标识、邮件、照片或其他私人数据；替代文本必须说明它展示首页集锦任务及播放/保存/删除入口。现有 Watch、训练列表和生成页面截图如果仍与当前 UI 一致则保留。

### 6. 日期与双语一致性

- 隐私政策发生实质变化后应使用实际公开生效日期；本 Change 不执行发布，因此 `EFFECTIVE_DATE` 使用 `Upon publication`，不虚构未来日期。
- `LAST_UPDATED` 使用本次页面内容完成日期，不预填未来日期。
- 英文和中文必须表达相同的数据类别、启用范围、字段、排除项、保留边界和用户操作，不允许只在一种语言中披露 GlitchTip 或本地任务文件。
- 保持联系邮箱、支持页、隐私页和 how-to 路径不变。

## 测试要求

`content.test.ts` 至少新增或调整以下断言：

- 隐私页同时出现 first-party analytics、GlitchTip/Sentry crash and error reporting、local diagnostic logs 三个独立概念。
- 英文和中文都说明自动崩溃、精简 `.error`、Watch 排除、`sendDefaultPii` 配置、Sentry 安装范围 ID、SDK 自动技术上下文和业务数据排除项。
- 页面不再笼统声称开发者只能在用户主动分享后看到任何诊断数据。
- 页面不声称原生崩溃一定不含设备型号或系统版本。
- 本地保留说明包含集锦任务、必要输入副本、本地输出、任务删除、照片库和 Apple Health 边界。
- 诊断导出步骤包含“长按训练记录标题 5 秒”，且不再包含“点击右上角导出按钮导出诊断日志”。
- iCloud FAQ 包含 App 内准备、确认、进度、暂停/重新准备和网络失败处理。
- how-to 包含持久化队列任务、返回首页、播放、保存、删除和中断恢复，不声称系统后台持续执行。

`how-to-page-render.test.mjs` 至少验证新增任务截图已渲染、替代文本准确，且相关链接仍不添加无必要的新窗口行为。现有路由测试继续通过。

## 验证与发布边界

实现完成后运行：

```bash
npm run check
git diff --check
```

同时执行：

- 检查本地 Markdown 链接和标题锚点。
- 在桌面与手机宽度分别渲染 `/shotmarker/support`、`/shotmarker/privacy` 和 `/shotmarker/how-to`。
- 核对三个页面的标题、meta description、邮件与内部链接。
- 检查新增截图的内容、裁切、清晰度、替代文本和隐私边界。
- 再次从 ShotMarker 当前源码核验诊断导出、日志清理、GlitchTip、视频准备和任务生命周期；不得仅引用本 spec。
- 不根据本地测试或构建声称线上页面已经发布；生产发布和公网验证需要单独授权并记录日期。

## 完成与文档治理

完成实现和验证后：

1. 更新 `docs/current/project.md` 中 ShotMarker 公开页面的最近复核事实，不复制完整隐私正文。
2. 只有第一方 Analytics 契约确实变化时才更新 `docs/current/track.md`；本 Change 预计不改变它。
3. 将本 spec 和后续 plan 移入 `docs/archive/2026-08/`。
4. 如果日志自动清理在 ShotMarker 仓库另行修复，先分别更新两仓库受影响的 current 文档，再分别归档、检查和提交。

## 验收标准

- 支持页的诊断导出步骤与当前 5 秒标题长按入口一致，用户不会误把训练记录导出当作诊断导出。
- iCloud FAQ 首先指导用户使用 App 内准备流程，并把照片 App 方法降为补充排障。
- how-to 明确集锦任务会进入持久化队列并返回首页，说明中断恢复和完成后的播放、手动保存、删除入口，且不声称系统后台持续执行。
- 隐私页用中英文分别、完整地披露第一方 Analytics、GlitchTip 错误/崩溃和完整本地日志，且三者的数据字段、启用范围和排除项不混淆。
- 隐私页覆盖持久化集锦任务、必要输入副本、本地输出、照片库和 Apple Health 的保留与删除边界。
- 日志保留文案只描述当次重新核验的实际行为；未完成 ShotMarker 自动清理修复时不再声称 14 天和 30 MiB 上限持续自动生效。
- 页面没有引入尚未实现的功能、未经验证的线上状态、私有基础设施值或与当前源码冲突的绝对承诺。
- 新增内容契约测试、渲染测试和现有测试全部通过，根目录 `npm run check`、`git diff --check`、链接和标题锚点检查通过。
