import { spawn, spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'

import {
  NPM_BIN,
  STATE_FILE_RELATIVE_PATH,
  buildDevChoices,
  buildPublishChoices,
  listFrontendProjects,
  loadState,
  pickDefaultChoice,
  saveState,
} from './workspace-runner-lib.mjs'
import { buildMenuLines, getMenuRewindLineCount } from './terminal-menu-lib.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..')
const backendRoot = path.join(repoRoot, 'backend')
const frontendRoot = path.join(repoRoot, 'frontend')
const frontendProjectRoot = path.join(frontendRoot, 'project')
const stateFilePath = path.join(repoRoot, STATE_FILE_RELATIVE_PATH)

const frontendProjects = listFrontendProjects(frontendProjectRoot)

const printUsage = () => {
  const frontendList = frontendProjects.length ? frontendProjects.join(', ') : 'none'
  console.log('Usage: npm run dev')
  console.log('       npm run publish')
  console.log(`Available frontend projects: ${frontendList}`)
}

const askChoice = async ({ title, choices, defaultValue }) => {
  if (!choices.length) {
    return null
  }
  const defaultIndex = Math.max(
    0,
    choices.findIndex((choice) => choice.value === defaultValue),
  )
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return choices[defaultIndex].value
  }

  let currentIndex = defaultIndex
  let renderedLineCount = 0

  const renderMenu = () => {
    if (renderedLineCount > 0) {
      readline.moveCursor(process.stdout, 0, -getMenuRewindLineCount(renderedLineCount))
      readline.cursorTo(process.stdout, 0)
      readline.clearScreenDown(process.stdout)
    }

    const lines = buildMenuLines({ title, choices, currentIndex })
    process.stdout.write(lines.join('\n'))
    renderedLineCount = lines.length
  }

  process.stdout.write('\x1b[?25l')
  renderMenu()

  return await new Promise((resolve) => {
    const onKeypress = (_str, key = {}) => {
      if (key.ctrl && key.name === 'c') {
        cleanup()
        process.stdout.write('\n')
        process.exit(130)
      }
      if (key.name === 'up') {
        currentIndex = (currentIndex - 1 + choices.length) % choices.length
        renderMenu()
        return
      }
      if (key.name === 'down') {
        currentIndex = (currentIndex + 1) % choices.length
        renderMenu()
        return
      }
      if (key.name === 'return' || key.name === 'enter') {
        const selected = choices[currentIndex].value
        cleanup()
        process.stdout.write('\n')
        resolve(selected)
      }
    }

    const cleanup = () => {
      process.stdin.off('keypress', onKeypress)
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false)
      }
      process.stdin.pause()
      process.stdout.write('\x1b[?25h')
    }

    readline.emitKeypressEvents(process.stdin)
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.on('keypress', onKeypress)
  })
}

const runSync = (command, args, options) => {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const runLongLived = (command, args, options) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options })
    const onSigint = () => {
      if (!child.killed) {
        child.kill('SIGINT')
      }
    }
    const onSigterm = () => {
      if (!child.killed) {
        child.kill('SIGTERM')
      }
    }
    const cleanup = () => {
      process.off('SIGINT', onSigint)
      process.off('SIGTERM', onSigterm)
    }

    process.on('SIGINT', onSigint)
    process.on('SIGTERM', onSigterm)

    child.on('exit', (code, signal) => {
      cleanup()
      if (signal === 'SIGINT') {
        resolve(130)
        return
      }
      if (signal === 'SIGTERM') {
        resolve(143)
        return
      }
      resolve(code ?? 1)
    })
    child.on('error', (error) => {
      cleanup()
      reject(error)
    })
  })

const runDevFlow = async () => {
  const state = loadState(stateFilePath)
  const choices = buildDevChoices(frontendProjects)
  const defaultValue = pickDefaultChoice({
    choices,
    rememberedValue: state.lastDevTarget,
    fallbackValue: 'backend',
  })

  const target = await askChoice({
    title: '请选择要启动的服务',
    choices,
    defaultValue,
  })

  saveState(stateFilePath, {
    ...state,
    lastDevTarget: target,
  })

  if (target === 'backend') {
    const code = await runLongLived(NPM_BIN, ['run', 'dev'], {
      cwd: backendRoot,
    })
    process.exit(code)
  }

  const frontendProject = target.replace(/^frontend:/, '')
  const code = await runLongLived(NPM_BIN, ['run', 'dev', '--', frontendProject], {
    cwd: frontendRoot,
  })
  process.exit(code)
}

const runPublishFlow = async (extraArgs) => {
  const state = loadState(stateFilePath)
  const choices = buildPublishChoices(frontendProjects)
  const defaultValue = pickDefaultChoice({
    choices,
    rememberedValue: state.lastPublishTarget,
    fallbackValue: 'backend',
  })

  const target = await askChoice({
    title: '请选择要发布的项目',
    choices,
    defaultValue,
  })

  if (!target) {
    console.error('没有可发布的项目。')
    process.exit(1)
  }

  saveState(stateFilePath, {
    ...state,
    lastPublishTarget: target,
  })

  if (target === 'backend') {
    runSync(NPM_BIN, ['run', 'publish', ...extraArgs], { cwd: backendRoot })
    return
  }

  const frontendProject = target.replace(/^frontend:/, '')
  runSync(NPM_BIN, ['run', 'publish', '--', frontendProject, ...extraArgs], {
    cwd: frontendRoot,
  })
}

const [, , command, ...extraArgs] = process.argv

if (!command || !new Set(['dev', 'publish']).has(command)) {
  printUsage()
  process.exit(1)
}

const main = async () => {
  if (command === 'dev') {
    await runDevFlow()
  } else {
    await runPublishFlow(extraArgs)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
