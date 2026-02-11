import test from 'node:test'
import assert from 'node:assert/strict'

import { buildMenuLines, getMenuRewindLineCount } from '../tools/terminal-menu-lib.mjs'

test('getMenuRewindLineCount rewinds one less than rendered lines', () => {
  assert.equal(getMenuRewindLineCount(0), 0)
  assert.equal(getMenuRewindLineCount(1), 0)
  assert.equal(getMenuRewindLineCount(4), 3)
})

test('buildMenuLines renders a stable selectable list', () => {
  const lines = buildMenuLines({
    title: '请选择要发布的项目',
    choices: [{ label: '后端' }, { label: '前端 (hub)' }],
    currentIndex: 1,
  })

  assert.equal(lines.length, 3)
  assert.equal(lines[0], '? 请选择要发布的项目:')
  assert.equal(lines[1].includes('后端'), true)
  assert.equal(lines[2].includes('前端 (hub)'), true)
  assert.equal(lines[2].includes('❯'), true)
})
