# Track JSONL 查询 API 实施计划

> **状态更新（2026-08-16）：** 本文已被[四字段埋点与单事件趋势重构设计](../specs/2026-08-16-track-four-field-trend-redesign-design.md)取代，仅保留历史记录。不得重新执行旧 schema、轮转/gzip 读取或 summary API 步骤。

> **历史计划：** 该计划已经执行。涉及 Track 专用 logrotate、自动轮转和约三个月保留的步骤，自 2026-08-16 起由[单一 JSONL 存储设计](../specs/2026-08-16-track-single-jsonl-storage-design.md)取代；Backend 对历史 gzip 的兼容读取保持不变。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不修改现有前端埋点协议的前提下，为 Backend 增加安全、只读、流式的 Track JSONL 聚合器与公开查询路由，并补齐自动化测试和公开文档。

**Architecture:** `backend/projects/track-query.js` 独立负责日志快照、普通/Gzip JSONL 流式读取、验证、去重、时间过滤和聚合；`backend/projects/track.js` 只负责严格 HTTP 契约、单查询并发闸门和错误映射。`backend/server.js` 仅完成模块注册，生产环境通过只读 `TRACK_LOG_DIR` 挂载提供数据，目录不可用时只影响 Track 路由。

**Tech Stack:** Node.js 24 ESM、Node 标准库（`node:fs`、`node:path`、`node:stream`、`node:timers/promises`、`node:zlib`）、Express 5、Node Test Runner。

---

## 文件结构

### 新增

- `backend/projects/track-query.js`：日志发现、快照、流式读取、验证、去重、过滤、聚合和资源保护。
- `backend/projects/track.js`：严格 Track Router、query 校验、并发闸门、响应头和错误映射。
- `backend/tools/track-query.test.mjs`：聚合器、轮转与资源边界测试。
- `backend/tools/track-route.test.mjs`：HTTP 契约与隔离测试。

### 修改

- `backend/server.js`：注册 Track Router，并解析 `TRACK_LOG_DIR`。
- `frontend/docs/track.md`：记录生产数据流、公开聚合边界与数据可信度。
- `docs/deploy/README.md`：记录服务器私有挂载与发布验证职责。
- `RUNBOOK.md`：增加本地验证、公开查询和线上故障排查命令。

### 保持不变

- `frontend/common/track.ts`
- `frontend/common/device_id.ts`
- `backend/Dockerfile`
- `backend/package.json`
- `backend/package-lock.json`
- `backend/tools/publish-lib.mjs`

---

### Task 1：建立聚合测试夹具与基础普通 JSONL 聚合

**Files:**

- Create: `backend/tools/track-query.test.mjs`
- Create: `backend/projects/track-query.js`

- [x] **Step 1：创建真实临时目录测试夹具**

在 `backend/tools/track-query.test.mjs` 写入测试公共部分：

```js
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  summarizeTrackEvents,
  TrackLogTooLargeError,
  TrackLogUnavailableError,
  TrackQueryTimeoutError,
} from '../projects/track-query.js'

const FIXED_NOW = new Date('2026-08-15T12:30:00.000Z')

const requestId = (value) => value.toString(16).padStart(32, '0')

const encodeParams = (params) => {
  const query = new URLSearchParams({ params: JSON.stringify(params) }).toString()
  return query.slice('params='.length)
}

const record = (overrides = {}) => ({
  schema_version: 1,
  request_id: requestId(1),
  received_at: '2026-08-15T12:00:00.000Z',
  client_time: '1786795200000',
  project: 'hub',
  device_id: 'Device000001',
  event: 'load_page',
  params_encoded: encodeParams({ page_name: 'home' }),
  ...overrides,
})

const jsonl = (...records) => `${records.map((entry) => JSON.stringify(entry)).join('\n')}\n`

const createLogDir = async (t) => {
  const logDir = await mkdtemp(path.join(os.tmpdir(), 'track-query-'))
  t.after(() => rm(logDir, { recursive: true, force: true }))
  return logDir
}

const writeCurrent = (logDir, content) => writeFile(path.join(logDir, 'events.jsonl'), content)
```

- [x] **Step 2：写基础聚合失败测试**

追加一个覆盖跨项目设备去重、稳定排序、页面/按钮维度和北京时间 daily 的测试：

```js
test('summarizes valid plain JSONL records across projects', async (t) => {
  const logDir = await createLogDir(t)
  await writeCurrent(
    logDir,
    jsonl(
      record({ request_id: requestId(1) }),
      record({
        request_id: requestId(2),
        project: 'cardgame',
        event: 'click',
        params_encoded: encodeParams({ button: 'create_room' }),
      }),
      record({
        request_id: requestId(3),
        device_id: 'Device000002',
        event: 'click',
        params_encoded: encodeParams({ button: 'nav_about' }),
      }),
    ),
  )

  const result = await summarizeTrackEvents({ logDir, days: 2, project: null, now: FIXED_NOW })

  assert.equal(result.range.days, 2)
  assert.equal(result.range.from, '2026-08-14T00:00:00+08:00')
  assert.equal(result.range.to, '2026-08-15T20:30:00.000+08:00')
  assert.equal(result.range.timezone, 'Asia/Shanghai')
  assert.deepEqual(result.filter, { project: null })
  assert.deepEqual(result.totals, {
    events: 3,
    devices: 2,
    earliest_received_at: '2026-08-15T12:00:00.000Z',
    latest_received_at: '2026-08-15T12:00:00.000Z',
  })
  assert.deepEqual(result.projects, [
    { project: 'cardgame', events: 1, devices: 1 },
    { project: 'hub', events: 2, devices: 2 },
  ])
  assert.deepEqual(result.event_breakdown, [
    { project: 'cardgame', event: 'click', events: 1, devices: 1 },
    { project: 'hub', event: 'click', events: 1, devices: 1 },
    { project: 'hub', event: 'load_page', events: 1, devices: 1 },
  ])
  assert.deepEqual(result.page_breakdown, [
    { project: 'hub', page_name: 'home', events: 1, devices: 1 },
  ])
  assert.deepEqual(result.button_breakdown, [
    { project: 'cardgame', button: 'create_room', events: 1, devices: 1 },
    { project: 'hub', button: 'nav_about', events: 1, devices: 1 },
  ])
  assert.deepEqual(result.daily, [
    { date: '2026-08-14', events: 0, devices: 0 },
    { date: '2026-08-15', events: 3, devices: 2 },
  ])
  assert.equal(result.diagnostics.files_read, 1)
  assert.equal(result.diagnostics.compressed_files_read, 0)
  assert.equal(result.diagnostics.lines_read, 3)
  assert.equal(result.diagnostics.included_records, 3)
  assert.doesNotMatch(JSON.stringify(result), /Device00000/)
})
```

追加空目录和 90 天零值补齐测试：

```js
test('returns ninety zero-filled Shanghai days for an empty readable directory', async (t) => {
  const logDir = await createLogDir(t)

  const result = await summarizeTrackEvents({ logDir, days: 90, project: null, now: FIXED_NOW })

  assert.deepEqual(result.totals, {
    events: 0,
    devices: 0,
    earliest_received_at: null,
    latest_received_at: null,
  })
  assert.equal(result.daily.length, 90)
  assert.deepEqual(result.daily[0], { date: '2026-05-18', events: 0, devices: 0 })
  assert.deepEqual(result.daily.at(-1), { date: '2026-08-15', events: 0, devices: 0 })
  assert.equal(result.diagnostics.files_read, 0)
})
```

- [x] **Step 3：运行目标测试并确认 RED**

Run:

```bash
node --test --test-name-pattern='summarizes valid plain JSONL|returns ninety zero-filled' backend/tools/track-query.test.mjs
```

Expected: FAIL，原因是 `../projects/track-query.js` 尚不存在；不能接受语法错误或夹具错误作为 RED。

- [x] **Step 4：实现最小公共类型、时间范围和普通 JSONL 聚合**

在 `backend/projects/track-query.js` 实现以下公开接口和内部结构：

```js
import fs, { constants } from 'node:fs'
import path from 'node:path'
import { setImmediate as yieldToEventLoop } from 'node:timers/promises'
import { createGunzip } from 'node:zlib'

const fileSystem = fs.promises

const TRACK_TIMEZONE = 'Asia/Shanghai'
const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000

const DEFAULT_LIMITS = Object.freeze({
  timeoutMs: 20_000,
  maxDecodedBytes: 64 * 1024 * 1024,
  maxLineBytes: 32 * 1024,
  maxParamsBytes: 16 * 1024,
  maxUniqueDevices: 100_000,
  maxDimensionKeys: 10_000,
  yieldEveryLines: 500,
  readChunkBytes: 64 * 1024,
})

export class TrackLogUnavailableError extends Error {
  constructor(message = 'track log is unavailable', options) {
    super(message, options)
    this.name = 'TrackLogUnavailableError'
  }
}

export class TrackLogTooLargeError extends Error {
  constructor(message = 'track log exceeds query limits', options) {
    super(message, options)
    this.name = 'TrackLogTooLargeError'
  }
}

export class TrackQueryTimeoutError extends Error {
  constructor(message = 'track query timed out', options) {
    super(message, options)
    this.name = 'TrackQueryTimeoutError'
  }
}

export async function summarizeTrackEvents({ logDir, days, project, now, limits = {} }) {
  // 合并并验证测试可覆盖的资源上限。
  // 固定查询开始 now，生成北京时间自然日范围。
  // 固定日志文件快照，逐行读取 events.jsonl。
  // 把有效记录直接写入计数器和 Set，不保存原始事件数组。
  // 在 finally 中关闭全部 FileHandle 和读取流。
}
```

内部实现必须包含这些明确职责，名称可以保持为非导出函数：

```text
resolveLimits(overrides)
buildRange(days, now)
formatShanghaiDate(date)
formatShanghaiIso(date)
createDiagnostics()
openSnapshot(logDir)
readSnapshotFile(snapshotFile, state)
parseRecord(line)
includeRecord(state, parsedRecord)
buildResponse(state)
```

本任务的最小版本只需让单个普通 `events.jsonl` 的有效记录通过；gzip、轮转竞争和资源失败在后续任务补充。所有返回数组必须按 Spec 的字符串顺序排序，`generated_at` 使用聚合完成时的真实 UTC ISO 时间。

- [x] **Step 5：运行目标测试并确认 GREEN**

Run:

```bash
node --test --test-name-pattern='summarizes valid plain JSONL|returns ninety zero-filled' backend/tools/track-query.test.mjs
```

Expected: 1 个目标测试 PASS，没有未处理 Promise、资源泄漏或警告。

- [x] **Step 6：提交基础聚合**

```bash
git add backend/projects/track-query.js backend/tools/track-query.test.mjs
git commit -m 'feat: 实现埋点日志基础聚合'
```

---

### Task 2：补齐记录校验、诊断闭环、去重和项目过滤

**Files:**

- Modify: `backend/tools/track-query.test.mjs`
- Modify: `backend/projects/track-query.js`

- [x] **Step 1：写 URL 解码、未知维度和项目过滤失败测试**

追加测试：

```js
test('decodes form query params and keeps unknown dimension values', async (t) => {
  const logDir = await createLogDir(t)
  await writeCurrent(
    logDir,
    jsonl(
      record({
        request_id: requestId(10),
        event: 'future_event.v2',
        params_encoded: '%7B%22page_name%22%3A%22ideas%22%2C%22button%22%3A%22a+b%2Bc%22%2C%22extra%22%3A1%7D',
      }),
      record({
        request_id: requestId(11),
        project: 'cardgame',
        params_encoded: encodeParams({ button: 'create_room' }),
      }),
    ),
  )

  const result = await summarizeTrackEvents({ logDir, days: 1, project: 'hub', now: FIXED_NOW })

  assert.equal(result.totals.events, 1)
  assert.deepEqual(result.event_breakdown, [
    { project: 'hub', event: 'future_event.v2', events: 1, devices: 1 },
  ])
  assert.deepEqual(result.page_breakdown, [
    { project: 'hub', page_name: 'ideas', events: 1, devices: 1 },
  ])
  assert.deepEqual(result.button_breakdown, [
    { project: 'hub', button: 'a b+c', events: 1, devices: 1 },
  ])
  assert.equal(result.diagnostics.project_filtered_records, 1)
})
```

- [x] **Step 2：写字段拒绝和 request_id 去重失败测试**

使用数据驱动方式追加：

```js
test('rejects invalid records and deduplicates valid request ids', async (t) => {
  const logDir = await createLogDir(t)
  const invalidRecords = [
    record({ request_id: requestId(20), schema_version: 2 }),
    record({ request_id: 'A'.repeat(32) }),
    record({ request_id: requestId(22), received_at: 'not-a-date' }),
    record({ request_id: requestId(23), client_time: '1e12' }),
    record({ request_id: requestId(24), project: 'audit' }),
    record({ request_id: requestId(25), device_id: 'short' }),
    record({ request_id: requestId(26), event: '1bad' }),
    record({ request_id: requestId(27), params_encoded: '%E0%A4%A' }),
    record({ request_id: requestId(28), params_encoded: encodeParams([]) }),
  ]
  const accepted = record({ request_id: requestId(29) })

  await writeCurrent(logDir, jsonl(...invalidRecords, accepted, accepted))

  const result = await summarizeTrackEvents({ logDir, days: 1, project: null, now: FIXED_NOW })

  assert.equal(result.totals.events, 1)
  assert.equal(result.diagnostics.rejected_records, invalidRecords.length)
  assert.equal(result.diagnostics.duplicate_records, 1)
  assert.equal(result.diagnostics.included_records, 1)
})
```

- [x] **Step 3：写时间分类、空行、损坏 JSON、忽略维度和尾行闭环失败测试**

追加：

```js
test('classifies every scanned line and ignores only invalid dimensions', async (t) => {
  const logDir = await createLogDir(t)
  const tooLong = 'x'.repeat(129)
  const content = [
    '',
    '{bad json}',
    JSON.stringify(record({ request_id: requestId(30), project: 'diagnostic' })),
    JSON.stringify(record({ request_id: requestId(31), received_at: '2026-08-14T15:59:59.999Z' })),
    JSON.stringify(record({ request_id: requestId(32), project: 'cardgame' })),
    JSON.stringify(record({
      request_id: requestId(33),
      params_encoded: encodeParams({ page_name: tooLong, button: 42 }),
    })),
    '{"schema_version":1',
  ].join('\n')
  await writeCurrent(logDir, content)

  const result = await summarizeTrackEvents({ logDir, days: 1, project: 'hub', now: FIXED_NOW })

  assert.equal(result.diagnostics.lines_read, 7)
  assert.equal(result.diagnostics.empty_lines, 1)
  assert.equal(result.diagnostics.invalid_json_lines, 1)
  assert.equal(result.diagnostics.rejected_records, 1)
  assert.equal(result.diagnostics.duplicate_records, 0)
  assert.equal(result.diagnostics.out_of_range_records, 1)
  assert.equal(result.diagnostics.project_filtered_records, 1)
  assert.equal(result.diagnostics.included_records, 1)
  assert.equal(result.diagnostics.ignored_dimensions, 2)
  assert.equal(result.diagnostics.partial_lines, 1)
  assert.equal(result.totals.events, 1)
})

test('accepts a complete final JSON object without a trailing newline', async (t) => {
  const logDir = await createLogDir(t)
  await writeCurrent(logDir, JSON.stringify(record({ request_id: requestId(34) })))

  const result = await summarizeTrackEvents({ logDir, days: 1, project: null, now: FIXED_NOW })

  assert.equal(result.totals.events, 1)
  assert.equal(result.diagnostics.lines_read, 1)
  assert.equal(result.diagnostics.partial_lines, 0)
})
```

- [x] **Step 4：运行新增测试并确认 RED**

Run:

```bash
node --test --test-name-pattern='decodes form|rejects invalid|classifies every' backend/tools/track-query.test.mjs
```

Expected: FAIL，分别暴露项目过滤、严格字段验证或诊断分类尚未实现；基础测试继续通过。

- [x] **Step 5：实现严格验证与固定分类顺序**

在 `track-query.js` 中按以下顺序处理每一行：

```text
未完成当前文件尾行
→ 空行
→ JSON 语法错误
→ schema/字段/params 拒绝
→ request_id 重复
→ received_at 范围外
→ project 过滤
→ 纳入聚合
```

验证规则必须直接编码为以下正则和上限：

```js
const REQUEST_ID_PATTERN = /^[0-9a-f]{32}$/
const CLIENT_TIME_PATTERN = /^\d{10,16}$/
const DEVICE_ID_PATTERN = /^[A-Za-z0-9]{12}$/
const EVENT_PATTERN = /^[A-Za-z][A-Za-z0-9_.:-]{0,63}$/
const PROJECTS = new Set(['hub', 'cardgame'])
```

`params_encoded` 必须使用表单查询语义解码：先把 `+` 解释为空格，再进行百分号解码；按 UTF-8 字节计算 16 KiB 上限；JSON 结果必须是非 `null`、非数组对象。`page_name` 和 `button` 缺失时不计诊断，存在但不是 1～128 字符字符串时增加 `ignored_dimensions`。

`request_id` 在完整字段和 params 验证成功后立即加入本次查询的 `Set`，因此后续范围外或项目过滤记录的重复副本仍分类为 duplicate。所有聚合 Set 只在记录最终纳入后更新。

- [x] **Step 6：运行聚合测试并确认 GREEN**

Run:

```bash
node --test --test-name-pattern='summarizes valid|decodes form|rejects invalid|classifies every' backend/tools/track-query.test.mjs
```

Expected: 4 个目标测试全部 PASS，且 `included_records === totals.events`。

- [x] **Step 7：提交校验和诊断**

```bash
git add backend/projects/track-query.js backend/tools/track-query.test.mjs
git commit -m 'feat: 完善埋点记录校验与诊断'
```

---

### Task 3：实现轮转文件发现、Gzip 流式读取与固定快照

**Files:**

- Modify: `backend/tools/track-query.test.mjs`
- Modify: `backend/projects/track-query.js`

- [x] **Step 1：补充 gzip 与文件系统测试依赖**

把测试文件的导入扩展为：

```js
import fs from 'node:fs'
import { appendFile, mkdtemp, rename, rm, symlink, writeFile } from 'node:fs/promises'
import { gzip as gzipCallback } from 'node:zlib'
import { promisify } from 'node:util'

const gzip = promisify(gzipCallback)
```

- [x] **Step 2：写当前、未压缩轮转和 gzip 联合读取失败测试**

```js
test('reads rotated plain and gzip files without double-counting same-date pairs', async (t) => {
  const logDir = await createLogDir(t)
  await writeFile(
    path.join(logDir, 'events.jsonl-20260813.gz'),
    await gzip(jsonl(record({ request_id: requestId(40), received_at: '2026-08-13T16:01:00.000Z' }))),
  )
  await writeFile(
    path.join(logDir, 'events.jsonl-20260814'),
    jsonl(record({ request_id: requestId(41), received_at: '2026-08-14T16:01:00.000Z' })),
  )
  await writeFile(
    path.join(logDir, 'events.jsonl-20260814.gz'),
    await gzip(jsonl(record({
      request_id: requestId(42),
      received_at: '2026-08-14T17:01:00.000Z',
      project: 'cardgame',
    }))),
  )
  await writeCurrent(
    logDir,
    jsonl(record({ request_id: requestId(43), received_at: '2026-08-15T12:00:00.000Z' })),
  )
  await writeFile(path.join(logDir, 'events.jsonl-20260230'), jsonl(record({ request_id: requestId(44) })))
  await writeFile(path.join(logDir, 'unrelated.jsonl'), jsonl(record({ request_id: requestId(45) })))
  await symlink(path.join(logDir, 'events.jsonl'), path.join(logDir, 'events.jsonl-20260812'))

  const result = await summarizeTrackEvents({ logDir, days: 3, project: null, now: FIXED_NOW })

  assert.equal(result.totals.events, 3)
  assert.equal(result.diagnostics.files_read, 3)
  assert.equal(result.diagnostics.compressed_files_read, 1)
  assert.equal(result.diagnostics.duplicate_records, 0)
  assert.deepEqual(result.projects, [
    { project: 'hub', events: 3, devices: 1 },
  ])
})
```

- [x] **Step 3：写查询期间追加数据不混入固定快照的失败测试**

```js
test('does not include bytes appended after the query snapshot', async (t) => {
  const logDir = await createLogDir(t)
  const initial = Array.from({ length: 5_000 }, (_, index) =>
    record({ request_id: requestId(1_000 + index) }),
  )
  await writeCurrent(logDir, jsonl(...initial))

  const summaryPromise = summarizeTrackEvents({
    logDir,
    days: 1,
    project: null,
    now: FIXED_NOW,
    limits: { readChunkBytes: 128, yieldEveryLines: 1 },
  })

  await new Promise((resolve) => setTimeout(resolve, 25))
  await appendFile(
    path.join(logDir, 'events.jsonl'),
    jsonl(record({ request_id: requestId(9_999) })),
  )

  const result = await summaryPromise
  assert.equal(result.totals.events, 5_000)
})
```

测试必须确认追加发生时 `summaryPromise` 尚未完成；如果已经完成，增加初始记录数量，不能通过放宽断言掩盖竞态。

- [x] **Step 4：写 inode 竞争重试和持续竞争失败测试**

`track-query.js` 必须通过共享的 `fs.promises` 对象调用 `lstat/open/readdir`，测试才能在单进程内精确替换 `open`。追加：

```js
test('retries one inode replacement and rejects a second consecutive race', async (t) => {
  const logDir = await createLogDir(t)
  const currentPath = path.join(logDir, 'events.jsonl')
  await writeCurrent(logDir, jsonl(record({ request_id: requestId(46) })))

  const originalOpen = fs.promises.open
  t.after(() => {
    fs.promises.open = originalOpen
  })

  let replacements = 0
  fs.promises.open = async (target, ...args) => {
    if (target === currentPath && replacements === 0) {
      replacements += 1
      await rename(currentPath, `${currentPath}.swap-${replacements}`)
      await writeCurrent(logDir, jsonl(record({ request_id: requestId(47) })))
    }
    return originalOpen(target, ...args)
  }

  const recovered = await summarizeTrackEvents({ logDir, days: 1, project: null, now: FIXED_NOW })
  assert.equal(replacements, 1)
  assert.equal(recovered.totals.events, 1)

  replacements = 0
  fs.promises.open = async (target, ...args) => {
    if (target === currentPath && replacements < 2) {
      replacements += 1
      await rename(currentPath, `${currentPath}.persistent-${replacements}`)
      await writeCurrent(logDir, jsonl(record({ request_id: requestId(48 + replacements) })))
    }
    return originalOpen(target, ...args)
  }

  await assert.rejects(
    summarizeTrackEvents({ logDir, days: 1, project: null, now: FIXED_NOW }),
    TrackLogUnavailableError,
  )
  assert.equal(replacements, 2)
})
```

- [x] **Step 5：写缺失目录和损坏 gzip 失败测试**

```js
test('maps missing directories and corrupt gzip files to unavailable errors', async (t) => {
  const missingDir = path.join(os.tmpdir(), `track-missing-${Date.now()}`)
  await assert.rejects(
    summarizeTrackEvents({ logDir: missingDir, days: 1, project: null, now: FIXED_NOW }),
    TrackLogUnavailableError,
  )

  const logDir = await createLogDir(t)
  await writeCurrent(logDir, '')
  await writeFile(path.join(logDir, 'events.jsonl-20260815.gz'), 'not gzip')
  await assert.rejects(
    summarizeTrackEvents({ logDir, days: 1, project: null, now: FIXED_NOW }),
    TrackLogUnavailableError,
  )
})
```

- [x] **Step 6：运行轮转测试并确认 RED**

Run:

```bash
node --test --test-name-pattern='reads rotated|does not include bytes|retries one inode|maps missing directories' backend/tools/track-query.test.mjs
```

Expected: FAIL，原因是轮转文件、gzip 或快照大小尚未实现。

- [x] **Step 7：实现受控文件发现和两次快照尝试**

实现严格候选规则：

```js
const CURRENT_FILE = 'events.jsonl'
const ROTATED_FILE_PATTERN = /^events\.jsonl-(\d{8})(\.gz)?$/
```

处理要求：

1. 使用共享 `fs.promises` 对象执行 `readdir/lstat/open`；`readdir(logDir, { withFileTypes: true })` 只考虑普通文件，忽略符号链接和其他名称。
2. `YYYYMMDD` 必须能往返解析为有效日历日期。
3. 同日 `.jsonl-YYYYMMDD` 与 `.gz` 并存时只选未压缩文件。
4. 轮转文件按日期升序，当前文件最后。
5. 每个候选执行 `lstat → open(O_RDONLY | O_NOFOLLOW) → fstat`；必须是普通文件且 `dev/ino` 一致。
6. 所有文件打开后记录字节大小，读取严格限制在 `[0, size - 1]`。
7. `ENOENT`、inode 变化或候选在打开窗口改变时关闭全部句柄并完整重试一次；第二次仍竞争抛 `TrackLogUnavailableError`。
8. 所有句柄在顶层 `finally` 中关闭。

普通文件使用固定 `start/end` 的读取流；gzip 文件先用同样的压缩字节范围创建流，再经过 `createGunzip()`，不创建临时文件。流错误统一转换为 `TrackLogUnavailableError`，但资源上限和超时错误必须保持原类型。

- [x] **Step 8：运行全部聚合测试并确认 GREEN**

Run:

```bash
node --test --test-name-pattern='summarizes valid|decodes form|rejects invalid|classifies every|reads rotated|does not include bytes|retries one inode|maps missing directories' backend/tools/track-query.test.mjs
```

Expected: 所有目标测试 PASS；同日期 `.gz` 记录没有重复计数。

- [x] **Step 9：提交轮转读取**

```bash
git add backend/projects/track-query.js backend/tools/track-query.test.mjs
git commit -m 'feat: 支持埋点轮转日志快照读取'
```

---

### Task 4：实现有界分行、资源上限、超时和事件循环让出

**Files:**

- Modify: `backend/tools/track-query.test.mjs`
- Modify: `backend/projects/track-query.js`

- [x] **Step 1：写单行、params 和解压总量上限失败测试**

```js
test('rejects oversized lines and decoded input while classifying oversized params', async (t) => {
  const lineDir = await createLogDir(t)
  await writeCurrent(lineDir, `${'x'.repeat(65)}\n`)
  await assert.rejects(
    summarizeTrackEvents({
      logDir: lineDir,
      days: 1,
      project: null,
      now: FIXED_NOW,
      limits: { maxLineBytes: 64 },
    }),
    TrackLogTooLargeError,
  )

  const paramsDir = await createLogDir(t)
  await writeCurrent(
    paramsDir,
    jsonl(record({ params_encoded: encodeParams({ button: 'x'.repeat(65) }) })),
  )
  const paramsResult = await summarizeTrackEvents({
    logDir: paramsDir,
    days: 1,
    project: null,
    now: FIXED_NOW,
    limits: { maxParamsBytes: 64 },
  })
  assert.equal(paramsResult.totals.events, 0)
  assert.equal(paramsResult.diagnostics.rejected_records, 1)

  const totalDir = await createLogDir(t)
  await writeCurrent(totalDir, jsonl(record()))
  await assert.rejects(
    summarizeTrackEvents({
      logDir: totalDir,
      days: 1,
      project: null,
      now: FIXED_NOW,
      limits: { maxDecodedBytes: 32 },
    }),
    TrackLogTooLargeError,
  )
})
```

- [x] **Step 2：写设备数和维度 key 上限失败测试**

```js
test('rejects aggregation cardinality above configured limits', async (t) => {
  const deviceDir = await createLogDir(t)
  await writeCurrent(
    deviceDir,
    jsonl(
      record({ request_id: requestId(50), device_id: 'Device000001' }),
      record({ request_id: requestId(51), device_id: 'Device000002' }),
    ),
  )
  await assert.rejects(
    summarizeTrackEvents({
      logDir: deviceDir,
      days: 1,
      project: null,
      now: FIXED_NOW,
      limits: { maxUniqueDevices: 1 },
    }),
    TrackLogTooLargeError,
  )

  const dimensionDir = await createLogDir(t)
  await writeCurrent(
    dimensionDir,
    jsonl(
      record({ request_id: requestId(52), event: 'event_a' }),
      record({ request_id: requestId(53), event: 'event_b' }),
    ),
  )
  await assert.rejects(
    summarizeTrackEvents({
      logDir: dimensionDir,
      days: 1,
      project: null,
      now: FIXED_NOW,
      limits: { maxDimensionKeys: 1 },
    }),
    TrackLogTooLargeError,
  )
})
```

- [x] **Step 3：写超时和主动让出事件循环失败测试**

```js
test('times out and yields to the event loop during large scans', async (t) => {
  const timeoutDir = await createLogDir(t)
  await writeCurrent(timeoutDir, jsonl(record()))
  await assert.rejects(
    summarizeTrackEvents({
      logDir: timeoutDir,
      days: 1,
      project: null,
      now: FIXED_NOW,
      limits: { timeoutMs: 0 },
    }),
    TrackQueryTimeoutError,
  )

  const yieldDir = await createLogDir(t)
  const records = Array.from({ length: 20 }, (_, index) =>
    record({ request_id: requestId(60 + index) }),
  )
  await writeCurrent(yieldDir, jsonl(...records))

  let timerRan = false
  setTimeout(() => {
    timerRan = true
  }, 0)

  const result = await summarizeTrackEvents({
    logDir: yieldDir,
    days: 1,
    project: null,
    now: FIXED_NOW,
    limits: { yieldEveryLines: 1, readChunkBytes: 64 },
  })

  assert.equal(result.totals.events, 20)
  assert.equal(timerRan, true)
})
```

- [x] **Step 4：运行资源测试并确认 RED**

Run:

```bash
node --test --test-name-pattern='rejects oversized|rejects aggregation|times out and yields' backend/tools/track-query.test.mjs
```

Expected: FAIL，缺少至少一种明确资源保护行为；不能把无关 I/O 错误当作预期失败。

- [x] **Step 5：实现有界分行器和统一截止时间**

实现要求：

- 逐个 `Buffer` chunk 查找 `0x0a`，pending 行永远不超过 `maxLineBytes`，禁止 `readline` 和无界字符串拼接。
- 解压后每个 chunk 先累计 `maxDecodedBytes`，再进行分行。
- 当前 `events.jsonl` 的无换行尾部若 JSON 不完整，计入 `partial_lines`；完整 JSON 仍正常处理。
- 非当前轮转文件的损坏尾行按普通 invalid JSON 分类。
- 每处理 `yieldEveryLines` 行执行 `await yieldToEventLoop()`。
- 查询开始创建统一 deadline；每次 I/O、chunk 和逐行处理前检查。超时后销毁当前输入流与 gunzip 流，并抛 `TrackQueryTimeoutError`。
- `maxUniqueDevices` 检查最终纳入记录的全局设备集合；`maxDimensionKeys` 分别检查 event/page/button Map 的 key 数。
- 任何上限失败不返回部分统计。

- [x] **Step 6：运行完整聚合测试文件并确认 GREEN**

Run:

```bash
node --test backend/tools/track-query.test.mjs
```

Expected: 所有聚合测试 PASS；进程退出，没有悬挂 timer 或打开句柄。

- [x] **Step 7：提交资源保护**

```bash
git add backend/projects/track-query.js backend/tools/track-query.test.mjs
git commit -m 'feat: 增加埋点查询资源保护'
```

---

### Task 5：实现严格公开 HTTP 路由和单查询并发闸门

**Files:**

- Create: `backend/tools/track-route.test.mjs`
- Create: `backend/projects/track.js`

- [x] **Step 1：创建真实 Express 测试服务器夹具**

在 `backend/tools/track-route.test.mjs` 写入：

```js
import assert from 'node:assert/strict'
import test from 'node:test'

import express from 'express'

import {
  TrackLogTooLargeError,
  TrackLogUnavailableError,
  TrackQueryTimeoutError,
} from '../projects/track-query.js'
import { registerTrack } from '../projects/track.js'

const FIXED_NOW = new Date('2026-08-15T12:30:00.000Z')

const sampleSummary = {
  generated_at: '2026-08-15T12:30:01.000Z',
  range: {
    days: 30,
    from: '2026-07-17T00:00:00+08:00',
    to: '2026-08-15T20:30:00.000+08:00',
    timezone: 'Asia/Shanghai',
  },
  filter: { project: null },
  totals: { events: 0, devices: 0, earliest_received_at: null, latest_received_at: null },
  projects: [],
  event_breakdown: [],
  page_breakdown: [],
  button_breakdown: [],
  daily: [],
  diagnostics: {
    files_read: 0,
    compressed_files_read: 0,
    lines_read: 0,
    included_records: 0,
    empty_lines: 0,
    invalid_json_lines: 0,
    rejected_records: 0,
    duplicate_records: 0,
    out_of_range_records: 0,
    project_filtered_records: 0,
    ignored_dimensions: 0,
    partial_lines: 0,
  },
}

const startApp = async (t, options = {}) => {
  const app = express()
  app.get('/unrelated', (_req, res) => res.json({ ok: true }))
  registerTrack(app, {
    logDir: '/test/track',
    summarize: async () => sampleSummary,
    now: () => FIXED_NOW,
    ...options,
  })

  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })
  t.after(() => new Promise((resolve) => server.close(resolve)))

  const address = server.address()
  return `http://127.0.0.1:${address.port}`
}
```

- [x] **Step 2：写默认参数、合法参数和严格路径失败测试**

```js
test('accepts only the exact lowercase summary route and valid query values', async (t) => {
  const calls = []
  const origin = await startApp(t, {
    summarize: async (options) => {
      calls.push(options)
      return sampleSummary
    },
  })

  const defaultResponse = await fetch(`${origin}/api/track/summary`)
  assert.equal(defaultResponse.status, 200)
  assert.equal(defaultResponse.headers.get('cache-control'), 'no-store')
  assert.equal(defaultResponse.headers.get('content-type'), 'application/json; charset=utf-8')
  assert.equal(defaultResponse.headers.has('www-authenticate'), false)
  assert.equal(calls[0].days, 30)
  assert.equal(calls[0].project, null)
  assert.equal(calls[0].logDir, '/test/track')
  assert.equal(calls[0].now, FIXED_NOW)

  assert.equal((await fetch(`${origin}/api/track/summary?days=1&project=hub`)).status, 200)
  assert.equal((await fetch(`${origin}/api/track/summary?days=90&project=cardgame`)).status, 200)

  for (const pathname of [
    '/api/track/summary/',
    '/api/Track/summary',
    '/API/track/summary',
    '/api/track/other',
  ]) {
    assert.equal((await fetch(`${origin}${pathname}`)).status, 404, pathname)
  }
})
```

- [x] **Step 3：写 query 参数拒绝失败测试**

```js
test('rejects malformed duplicate and unknown query parameters before scanning', async (t) => {
  let calls = 0
  const origin = await startApp(t, {
    summarize: async () => {
      calls += 1
      return sampleSummary
    },
  })

  const cases = [
    ['?days=', 'invalid_days'],
    ['?days=0', 'invalid_days'],
    ['?days=91', 'invalid_days'],
    ['?days=1.5', 'invalid_days'],
    ['?days=1e1', 'invalid_days'],
    ['?days=%201', 'invalid_days'],
    ['?project=', 'invalid_project'],
    ['?project=all', 'invalid_project'],
    ['?days=1&days=2', 'duplicate_query_parameter'],
    ['?project=hub&project=hub', 'duplicate_query_parameter'],
    ['?unknown=1', 'unknown_query_parameter'],
  ]

  for (const [query, code] of cases) {
    const response = await fetch(`${origin}/api/track/summary${query}`)
    assert.equal(response.status, 400, query)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.equal((await response.json()).error.code, code, query)
  }
  assert.equal(calls, 0)
})
```

- [x] **Step 4：写并发和错误映射失败测试**

```js
test('allows one scan and rejects concurrent requests without leaking the counter', async (t) => {
  let releaseFirst
  let callCount = 0
  const firstScan = new Promise((resolve) => {
    releaseFirst = resolve
  })
  const origin = await startApp(t, {
    summarize: async () => {
      callCount += 1
      if (callCount === 1) await firstScan
      return sampleSummary
    },
  })

  const firstResponsePromise = fetch(`${origin}/api/track/summary`)
  while (callCount === 0) await new Promise((resolve) => setImmediate(resolve))

  const busyResponse = await fetch(`${origin}/api/track/summary`)
  assert.equal(busyResponse.status, 503)
  assert.equal(busyResponse.headers.get('retry-after'), '2')
  assert.equal((await busyResponse.json()).error.code, 'track_query_busy')

  releaseFirst()
  assert.equal((await firstResponsePromise).status, 200)
  assert.equal((await fetch(`${origin}/api/track/summary`)).status, 200)
})

test('maps known query errors and isolates unexpected errors', async (t) => {
  const cases = [
    [new TrackLogUnavailableError(), 'track_log_unavailable'],
    [new TrackLogTooLargeError(), 'track_log_too_large'],
    [new TrackQueryTimeoutError(), 'track_query_timeout'],
  ]

  for (const [error, code] of cases) {
    const origin = await startApp(t, { summarize: async () => { throw error } })
    const response = await fetch(`${origin}/api/track/summary`)
    assert.equal(response.status, 503)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.equal((await response.json()).error.code, code)
    assert.equal((await fetch(`${origin}/unrelated`)).status, 200)
  }
})

test('returns a sanitized internal error without logging raw exception content', async (t) => {
  const logged = []
  const originalError = console.error
  console.error = (...args) => logged.push(args)
  t.after(() => {
    console.error = originalError
  })

  const origin = await startApp(t, {
    summarize: async () => {
      throw new Error('/var/log/nginx/track Device000001 raw payload')
    },
  })
  const response = await fetch(`${origin}/api/track/summary`)

  assert.equal(response.status, 500)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal((await response.json()).error.code, 'internal_error')
  assert.doesNotMatch(JSON.stringify(logged), /\/var\/log\/nginx|Device000001|raw payload/)
})
```

- [x] **Step 5：运行路由测试并确认 RED**

Run:

```bash
node --test backend/tools/track-route.test.mjs
```

Expected: FAIL，原因是 `projects/track.js` 尚不存在。

- [x] **Step 6：实现严格 Router、校验和错误响应**

在 `backend/projects/track.js` 实现：

```js
import express from 'express'

import {
  summarizeTrackEvents,
  TrackLogTooLargeError,
  TrackLogUnavailableError,
  TrackQueryTimeoutError,
} from './track-query.js'

const SUMMARY_PATH = '/api/track/summary'
const PROJECTS = new Set(['hub', 'cardgame'])
const DAYS_PATTERN = /^(?:[1-9]|[1-8][0-9]|90)$/

const sendError = (res, status, code, message) =>
  res.status(status).json({ error: { code, message } })

export function registerTrack(app, {
  logDir,
  summarize = summarizeTrackEvents,
  now = () => new Date(),
}) {
  const router = express.Router({ caseSensitive: true, strict: true })
  let activeQueries = 0

  router.get(SUMMARY_PATH, async (req, res) => {
    res.set('Cache-Control', 'no-store')

    // 使用 new URL(req.originalUrl, 'http://localhost').searchParams，
    // 先拒绝未知 key 和重复 key，再严格解析 days/project。
    // 参数失败不增加 activeQueries。
    // activeQueries >= 1 时设置 Retry-After: 2 并返回 track_query_busy。
    // 捕获一次 queryNow = now() 后调用 summarize。
    // 在 try/finally 中无条件 activeQueries -= 1。
    // 只记录稳定错误码与 error.name，不记录 req、query 或底层 message。
  })

  app.use(router)
}
```

错误文案固定为：

```text
invalid_days: days must be an integer between 1 and 90
invalid_project: project must be hub or cardgame
duplicate_query_parameter: query parameters must not be repeated
unknown_query_parameter: unknown query parameter
track_log_unavailable: track log is unavailable
track_log_too_large: track log exceeds query limits
track_query_busy: another track query is already running
track_query_timeout: track query timed out
internal_error: internal server error
```

未知异常返回 `500 internal_error`；已知三个聚合异常返回 `503`。错误日志只能包含稳定 code 和异常类型，例如：

```js
console.error('track_query_failed', {
  code: 'track_log_unavailable',
  error_type: error?.name ?? 'Error',
})
```

- [x] **Step 7：运行路由和全部 Backend 测试并确认 GREEN**

Run:

```bash
node --test backend/tools/track-route.test.mjs
npm --prefix backend test
```

Expected: Track 路由测试和既有 Cardgame/发布测试全部 PASS。

- [x] **Step 8：提交 HTTP 路由**

```bash
git add backend/projects/track.js backend/tools/track-route.test.mjs
git commit -m 'feat: 添加埋点公开查询路由'
```

---

### Task 6：接入 Backend 启动流程并验证故障隔离

**Files:**

- Modify: `backend/server.js`
- Modify: `backend/tools/track-route.test.mjs`

- [x] **Step 1：写默认目录契约失败测试**

在 `track-route.test.mjs` 增加对生产入口源码的最小静态契约测试，避免启动真实长期监听进程：

```js
import { readFile } from 'node:fs/promises'

test('server registers Track with the configured read-only log directory', async () => {
  const source = await readFile(new URL('../server.js', import.meta.url), 'utf8')
  assert.match(source, /import \{ registerTrack \} from ['"]\.\/projects\/track\.js['"]/)
  assert.match(source, /process\.env\.TRACK_LOG_DIR/)
  assert.match(source, /\/var\/log\/nginx\/track/)
  assert.match(source, /registerTrack\(app,/)
})
```

- [x] **Step 2：运行测试并确认 RED**

Run:

```bash
node --test --test-name-pattern='server registers Track' backend/tools/track-route.test.mjs
```

Expected: FAIL，因为 `backend/server.js` 尚未导入或注册 Track。

- [x] **Step 3：修改 Backend 入口**

把 `backend/server.js` 调整为：

```js
import http from 'http'
import express from 'express'
import cors from 'cors'
import { registerCardGame } from './projects/cardgame.js'
import { registerTrack } from './projects/track.js'

const PORT = Number(process.env.PORT) || 3001
const TRACK_LOG_DIR = process.env.TRACK_LOG_DIR || '/var/log/nginx/track'

const app = express()
app.use(cors())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

registerTrack(app, { logDir: TRACK_LOG_DIR })

const server = http.createServer(app)
registerCardGame({ app, server })

server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})
```

Track 注册不能访问文件系统；目录缺失必须等到查询时才返回 `503`，Backend 启动、`/health` 和 Cardgame 注册不受影响。

- [x] **Step 4：运行 Backend 全部测试并确认 GREEN**

Run:

```bash
npm --prefix backend test
```

Expected: 全部 PASS，没有新增 npm 依赖或 lockfile 变化。

- [x] **Step 5：确认生产发布边界无需改动**

Run:

```bash
git diff -- backend/Dockerfile backend/package.json backend/package-lock.json backend/tools/publish-lib.mjs
```

Expected: 无输出。`Dockerfile` 已复制 `projects`，发布白名单已包含 `projects/***`。

- [x] **Step 6：提交 Backend 接入**

```bash
git add backend/server.js backend/tools/track-route.test.mjs
git commit -m 'feat: 接入埋点查询服务'
```

---

### Task 7：更新公开文档但不写入生产私有配置

**Files:**

- Modify: `frontend/docs/track.md`
- Modify: `docs/deploy/README.md`
- Modify: `RUNBOOK.md`

- [x] **Step 1：更新前端埋点数据边界**

在 `frontend/docs/track.md` 把“仓库中没有可确认的持久化”替换为以下事实：

````markdown
## 持久化与查询边界

生产 Nginx 对 `/track` 返回 `204`，并把每个请求按 schema v1 独立写入宿主机持久目录中的 JSONL。写入失败不会改变前端响应；读取端负责拒绝伪造或格式错误的记录。

Backend 通过只读挂载流式聚合日志，并公开提供：

```text
GET /api/track/summary?days=<1-90>&project=<hub|cardgame>
```

`days` 默认 30，`project` 可省略。响应只包含事件、浏览器设备数、项目、事件、页面、按钮和每日汇总，不返回原始 `device_id`、params、IP、User-Agent、Referer、Cookie 或文件路径。

该接口第一阶段无需鉴权，结果属于公开、低风险的产品观察数据。客户端事件和设备标识均可伪造，不能用于计费、风控、审计或强一致业务指标。
````

- [x] **Step 2：更新部署架构和服务器私有资产边界**

在 `docs/deploy/README.md`：

1. 在逻辑架构增加 `/track → Nginx JSONL` 和 `/api/track/summary → Backend 只读聚合`。
2. 在目标目录增加逻辑说明 `/opt/zhangrh-shop/data/track`，明确它和 Compose/Nginx/logrotate 一样由服务器私有维护，不提交仓库。
3. 增加 Backend 发布前必须先完成服务器挂载和 Nginx 专用限流 location 的顺序。
4. 增加公开只读验证：

```bash
curl --fail-with-body 'https://zhangrh.shop/api/track/summary?days=1'
```

5. 明确发布脚本不会修改服务器 Compose、Nginx 或 `/etc/logrotate.d`。

- [x] **Step 3：更新运行手册**

在 `RUNBOOK.md` 增加“埋点查询”章节，包含：

```bash
curl --fail-with-body \
  'https://zhangrh.shop/api/track/summary?days=30'

curl --fail-with-body \
  'https://zhangrh.shop/api/track/summary?days=90&project=hub' \
  --output track-summary.json
```

同时记录稳定错误处置：

```text
400：调用参数错误，修正 days/project 或删除未知、重复参数。
429：Nginx 公网限流，等待后重试。
503 track_query_busy：已有扫描，至少等待 Retry-After 秒数。
503 track_log_unavailable：只检查 Track 挂载、目录权限、gzip 和轮转竞争；不要重启整个站点作为第一动作。
503 track_log_too_large：JSONL 已超过第一阶段设计规模，停止重复查询并重新设计存储。
503 track_query_timeout：扫描超过 20 秒，检查文件规模、损坏 gzip 和主机 I/O。
```

文档不得包含真实 IP、访问日志、设备 ID、Token、证书内容、Compose 全文或 Nginx 私有配置全文。

- [x] **Step 4：检查公开仓库隐私边界**

Run:

```bash
rg -n -S 'BEGIN (RSA |OPENSSH )?PRIVATE KEY|Authorization:|Bearer [A-Za-z0-9._-]+' \
  frontend/docs/track.md docs/deploy/README.md RUNBOOK.md \
  backend/projects/track.js backend/projects/track-query.js \
  backend/tools/track-query.test.mjs backend/tools/track-route.test.mjs

rg -o -N 'Device[0-9]{6}' \
  backend/tools/track-query.test.mjs backend/tools/track-route.test.mjs |
  sort -u
```

Expected: 第一条命令无输出；第二条只列出 `Device` 前缀的明确合成测试值，不出现真实设备样本。

- [x] **Step 5：提交公开文档**

```bash
git add frontend/docs/track.md docs/deploy/README.md RUNBOOK.md
git commit -m 'docs: 更新埋点持久化与查询说明'
```

---

### Task 8：全量验证、计划闭环和交付检查

**Files:**

- Modify: `docs/superpowers/plans/2026-08-15-track-jsonl-query-api.md`（只勾选实际完成的步骤）

- [x] **Step 1：运行 Backend 目标测试**

```bash
node --test backend/tools/track-query.test.mjs
node --test backend/tools/track-route.test.mjs
```

Expected: 两个测试文件全部 PASS、0 FAIL。

- [x] **Step 2：运行 Backend 全部测试**

```bash
npm --prefix backend test
```

Expected: 新 Track 测试与既有 Cardgame/发布测试全部 PASS。

- [x] **Step 3：运行仓库级验证**

```bash
npm test
npm run check
```

Expected: 自动化、前端、Backend 测试、lint、类型检查和全部前端构建成功。

- [x] **Step 4：检查文件范围和格式**

```bash
git status --short
git diff --check
git diff --stat
git diff -- backend/package.json backend/package-lock.json backend/Dockerfile backend/tools/publish-lib.mjs
```

Expected:

- 只有计划声明的源码、测试和文档发生变化。
- `git diff --check` 无输出。
- 最后一条命令无输出。
- 不包含生产 Compose、Nginx 配置、logrotate 文件或真实数据。

- [x] **Step 5：核对 Spec 完成标准**

逐项确认：

```text
现有前端协议未修改。
聚合器只接受受控文件名并忽略符号链接。
普通、轮转中未压缩和 gzip 文件均流式读取。
同查询 request_id 去重，使用 received_at 和 Asia/Shanghai 自然日。
返回 totals/projects/event/page/button/daily/diagnostics。
不返回原始 device_id、params 或路径。
单扫描并发、20 秒、64 MiB、32 KiB、16 KiB、基数上限均存在测试。
严格路由和 query 参数错误码存在测试。
目录不可用只让 Track 路由返回 503。
未新增认证、Session、管理页面、npm 依赖或生产私有资产。
```

- [x] **Step 6：提交计划完成状态（仅在确有勾选变化时）**

```bash
git add docs/superpowers/plans/2026-08-15-track-jsonl-query-api.md
git commit -m 'docs: 完成埋点查询实现计划'
```

- [x] **Step 7：停止在本地实现边界**

不要执行以下服务器变更：

```text
/opt/zhangrh-shop/compose.yml
/opt/zhangrh-shop/nginx/conf.d/zhangrh.shop.conf
/opt/zhangrh-shop/data/track/
/etc/logrotate.d/zhangrh-track
```

交付时明确说明：代码和本地测试状态、分支/提交状态、服务器仍需用户按独立上线清单操作。
