import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildDevChoices,
  buildPublishChoices,
  pickDefaultChoice,
  sanitizeState,
} from './workspace-runner-lib.mjs'

test('buildDevChoices includes backend and all frontend projects', () => {
  const choices = buildDevChoices(['hub', 'cardgame'])

  assert.deepEqual(choices, [
    { value: 'backend', label: '后端' },
    { value: 'frontend:hub', label: '前端 (hub)' },
    { value: 'frontend:cardgame', label: '前端 (cardgame)' },
  ])
})

test('buildDevChoices keeps backend option when no frontend projects', () => {
  const choices = buildDevChoices([])

  assert.deepEqual(choices, [{ value: 'backend', label: '后端' }])
})

test('buildPublishChoices includes backend and all frontend projects', () => {
  const choices = buildPublishChoices(['hub', 'cardgame'])

  assert.deepEqual(choices, [
    { value: 'backend', label: '后端' },
    { value: 'frontend:hub', label: '前端 (hub)' },
    { value: 'frontend:cardgame', label: '前端 (cardgame)' },
  ])
})

test('pickDefaultChoice prefers last remembered value', () => {
  const choices = buildPublishChoices(['hub', 'cardgame'])

  const value = pickDefaultChoice({
    choices,
    rememberedValue: 'frontend:cardgame',
    fallbackValue: 'backend',
  })

  assert.equal(value, 'frontend:cardgame')
})

test('pickDefaultChoice falls back when remembered value is invalid', () => {
  const choices = buildPublishChoices(['hub'])

  const value = pickDefaultChoice({
    choices,
    rememberedValue: 'frontend:missing',
    fallbackValue: 'backend',
  })

  assert.equal(value, 'backend')
})

test('sanitizeState keeps only valid string fields', () => {
  const state = sanitizeState({
    lastDevTarget: 'frontend:hub',
    lastPublishTarget: 123,
  })

  assert.deepEqual(state, {
    lastDevTarget: 'frontend:hub',
    lastPublishTarget: null,
  })
})

test('sanitizeState migrates legacy lastDevFrontend', () => {
  const state = sanitizeState({
    lastDevFrontend: 'hub',
  })

  assert.deepEqual(state, {
    lastDevTarget: 'frontend:hub',
    lastPublishTarget: null,
  })
})
