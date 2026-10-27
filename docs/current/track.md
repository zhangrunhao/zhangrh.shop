# Track 埋点与趋势

- 本地实现复核：2026-10-27。新增 ShotMarker 来源与步骤聚合尚未部署；不从本地检查推断生产接收状态。
- Track 是公开、可伪造的产品观察数据，不用于计费、风控、审计或强一致业务指标。

## 有效数据契约

所有客户端发送 `project`、`event`、`device_id`；服务端增加 ISO 8601 `time`。

| 字段 | 规则 |
| --- | --- |
| `project` | `hub`、`cardgame` 或 `shotmarker` |
| `event` | 小写 snake_case，最多 64 字符；新版 ShotMarker 扩展记录限制为下述事件 |
| `device_id` | 12 位字母数字随机安装标识 |
| `distribution` | ShotMarker 专用：`app_store`、`test`、`unknown` |
| `is_self_use` | ShotMarker 专用：字符串 `true`、`false` |
| `app_version` / `app_build` | 数字点分版本 / 数字构建号，最长 32 字符；允许 `unknown` |
| `operation_id` | 专用随机小写 UUID；启动事件无值，流程事件必需 |
| `stage` / `reason` | 受控步骤 / 原因枚举，允许无值；启动事件必须无值 |

- 历史四字段和扩展字段全部为空的记录继续有效，来源归未知；无操作标识只参与趋势，不还原操作数。
- 非法或未知字段不参与查询，不把非法新版记录降级成正式流量。旧网页客户端不发送新增字段。
- 不收集客户端时间、自由文本、通用 context、原始错误、业务 UUID、训练记录、打点、视频、HealthKit 数据或诊断日志。
- 公开响应只包含聚合，不返回原始记录、安装/操作标识、文件路径或堆栈。

## 事件目录

### Hub 与 Cardgame

Hub：`home_page_load`、`products_page_load`、`articles_page_load`、`article_detail_page_load`、`about_page_load`。未知文章和未匹配路由不发送。

Cardgame：`cardgame_page_load`、`create_room_click`、`join_room_click`、`ai_battle_click`、`play_cards_click`、`round_confirm_click`、`play_again_click`。点击表示触发动作，不表示业务成功。

网页通过 Image 向同源 `/track` 非阻塞 GET，不重试，在 localStorage 与 `.zhangrh.shop` Cookie 间复用安装标识。

### ShotMarker

| 流程 | 事件 |
| --- | --- |
| 进程启动 | `app_launch` |
| 手机收到同步载荷 | `training_sync_started`、`training_sync_succeeded`、`training_sync_failed`、`training_sync_ignored` |
| 生成 | `highlight_generate_started`、`highlight_generate_succeeded`、`highlight_generate_failed`、`highlight_generate_cancelled` |
| 相册保存 | `highlight_save_started`、`highlight_save_succeeded`、`highlight_save_failed`、`highlight_save_cancelled` |
| 附属诊断 | `training_sync_ack_failed`、`highlight_save_state_failed` |

同步成功点在导入后、ACK 前；保存成功点在实际 Photos 写入后、本地状态持久化前。附属诊断不撤销这些成功。完整触发与客户端隐私边界由 [ShotMarker 产品埋点](https://github.com/zhangrunhao/ShotMarker/blob/main/docs/current/analytics.md)维护。

客户端仅 Release 真机 iPhone 启用；Debug、模拟器和其他平台 no-op。使用临时 URLSession、5 秒超时、无 Cookie/持久缓存、不重试。分发通过验证过的渠道证据分类，不确定保留未知；诊断入口的本地自用标记优先于分发来源。

允许的 `stage`：`received`、`decode`、`import`、`ack`、`validation`、`queue`、`export`、`commit`、`permission`、`photos_write`、`local_state`。

允许的 `reason`：`invalid_input`、`decode_failed`、`import_failed`、`ack_failed`、`before_cutover`、`background`、`busy`、`invalid_task`、`revision_conflict`、`source_unavailable`、`export_failed`、`output_commit_failed`、`permission_denied`、`missing_output`、`photos_write_failed`、`state_update_failed`、`user_cancelled`、`backgrounded`、`cancelled`、`interrupted`、`unknown`。

## 服务端接收

Nginx 接收 `/track`，生成服务器时间，使用 JSON 转义向单一 `events.jsonl` 追加并返回 `204`。新增字段只扩展日志格式，采集仍由 Nginx 完成。不写入 IP、User-Agent、Referer、Cookie 或完整 URL；查询时校验字段。

读取只覆盖当前文件，不读取轮转文件或 gzip；达到 `32 MiB` 时必须重新评估存储方案。历史保留数据不迁移、不回填来源或操作信息。

## 趋势查询

```text
GET /api/track/trend?project=shotmarker&event=app_launch&days=30&audience=production
```

- `project`、`event`、`days` 必填；`days` 为 `1`、`7`、`30`、`90`；未知/重复参数拒绝。
- ShotMarker 可选 `audience` 和 `version`；不传来源保留原来的全部记录语义。其他项目不接受这些筛选。
- 来源：`self` 自用；`production` 非自用且 App Store；`test` 非自用测试；`unknown` 非自用未知或旧记录；`all` 全部。
- 版本为可选精确匹配，不做历史推断。
- 响应保持 `{daily:[{date,pv,uv}]}`；按上海自然日连续升序，长度等于 days，无记录补零。PV 为匹配记录数，UV 为当日安装去重数，均为安全整数且 `0 <= uv <= pv`。

## ShotMarker 步骤查询

```text
GET /api/track/shotmarker?days=30&audience=production
```

- 来源默认 `production`，可选 `version`；响应仅包含 `flows` 和 `issues`。
- `flows` 固定为同步、生成、保存；每项含 `flow`、`attempts`、`installations`、`succeeded`、`failed`、`cancelled`、`ignored`、`unknown`、`missing_start`、`conflicts`。
- 以安装、操作标识和流程配对，支持乱序，重复开始/相同终态去重。尝试数是收到开始的操作数，涉及安装仅对这些尝试去重。
- 已开始且无终态归结果未知；有效操作标识的孤立终态归缺开始；矛盾终态归冲突，不计入成功或失败。窗口外不猜补，旧版无操作标识不参与步骤统计。
- `issues` 按 `flow`、`event`、`stage`、`reason` 汇总 `count`；同操作同诊断去重。ACK 与保存状态错误单列，不充当主流程失败。
- 不计算虚假完成率或端到端漏斗；尚不能关联不同流程为同一训练/任务，也看不到 Watch 发送前的阻塞。

## 资源与错误边界

两个路由共享单查询槽；单次上限 `64 MiB`，单行 `32 KiB`，超时 20 秒。超限、不可用文件或并发返回 `503`；参数错误返回 `400`；未知内部错误返回 `500`。`track_query_busy` 附 `Retry-After: 2`。

## Analytics 页面

保留逐日趋势图；ShotMarker 默认筛选“正式使用”，可切换自用、测试、未知或全部，并按版本过滤。步骤与诊断以简单表格展示，阶段和原因提供中文名称。

趋势和步骤请求串行执行，兼容单查询槽；筛选变化清除旧结果，过期请求不能覆盖新状态。浏览器只持久保存项目和天数。正式分发分类不等于已经确认外部真人身份。

## 生产状态

- 历史四字段生产接收验收日期为 2026-08-16。
- ShotMarker 于 2026-10-27 只读核验保留日志与现有趋势 API；脱敏结论由 [ShotMarker 观测验证](https://github.com/zhangrunhao/ShotMarker/blob/main/docs/current/observability.md)维护。
- 本次扩展尚未部署；生产 Nginx 格式、Backend、Analytics 页面及真实 App Store/TestFlight 端到端验收未完成。发布顺序见[部署边界](deployment.md)。
- 具体主机、权限和生产配置由私有台账维护；不含敏感信息的协议与验收结论留在公开仓库。

## 证据

- `frontend/common/{device_id,track}.ts`
- `frontend/project/analytics/`
- `backend/projects/{track,track-query,track-shotmarker}.js`
- `backend/tools/track-*.test.mjs`
