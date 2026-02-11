import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import readline from 'node:readline'
import { buildMenuLines, getMenuRewindLineCount } from '../../tools/terminal-menu-lib.mjs'

export const STATE_FILE_RELATIVE_PATH = path.join('.cache', 'frontend-publish-state.json')

export const listProjects = (projectRoot) => {
  if (!fs.existsSync(projectRoot)) {
    return []
  }
  return fs
    .readdirSync(projectRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

export const sanitizeState = (state) => {
  if (!state || typeof state !== 'object') {
    return { lastPublishProject: null }
  }
  return {
    lastPublishProject:
      typeof state.lastPublishProject === 'string' ? state.lastPublishProject : null,
  }
}

export const loadState = (stateFilePath) => {
  if (!fs.existsSync(stateFilePath)) {
    return sanitizeState(null)
  }
  try {
    return sanitizeState(JSON.parse(fs.readFileSync(stateFilePath, 'utf8')))
  } catch {
    return sanitizeState(null)
  }
}

export const saveState = (stateFilePath, state) => {
  const normalized = sanitizeState(state)
  fs.mkdirSync(path.dirname(stateFilePath), { recursive: true })
  fs.writeFileSync(stateFilePath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
}

export const parseProjectFromNpm = ({ command, projects, npmConfigArgvRaw }) => {
  if (!npmConfigArgvRaw) {
    return null
  }
  try {
    const parsed = JSON.parse(npmConfigArgvRaw)
    const original = Array.isArray(parsed.original) ? parsed.original : parsed.cooked
    if (!Array.isArray(original)) {
      return null
    }
    const commandIndex = original.findIndex((arg) => arg === command)
    if (commandIndex === -1) {
      return null
    }
    const candidate = original[commandIndex + 1]
    if (typeof candidate !== 'string' || candidate.startsWith('-')) {
      return null
    }
    return projects.includes(candidate) ? candidate : null
  } catch {
    return null
  }
}

export const extractProjectArg = ({ args, projects }) => {
  let project = null
  for (const arg of args) {
    if (!project && projects.includes(arg)) {
      project = arg
    }
  }
  return project
}

export const pickDefaultProject = ({ projects, lastProject }) => {
  if (lastProject && projects.includes(lastProject)) {
    return lastProject
  }
  return projects[0] ?? null
}

export const askChoice = async ({ title, choices, defaultValue }) => {
  if (!choices.length) {
    return null
  }

  const defaultIndex = Math.max(
    0,
    choices.findIndex((choice) => choice.value === defaultValue),
  )
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
    const cleanup = () => {
      process.stdin.off('keypress', onKeypress)
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false)
      }
      process.stdin.pause()
      process.stdout.write('\x1b[?25h')
    }

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

    readline.emitKeypressEvents(process.stdin)
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.on('keypress', onKeypress)
  })
}

export const resolvePublishProject = async ({
  projects,
  argv,
  npmConfigArgvRaw,
  isInteractive,
  lastProject,
  askChoice: askChoiceOverride,
}) => {
  const [command, ...rawArgs] = argv
  const directProject = typeof command === 'string' && projects.includes(command) ? command : null
  const projectFromArgs = extractProjectArg({ args: rawArgs, projects })
  const projectFromNpm = parseProjectFromNpm({
    command: command ?? 'publish',
    projects,
    npmConfigArgvRaw,
  })
  const project = directProject ?? projectFromArgs ?? projectFromNpm
  if (project) {
    return project
  }
  if (!projects.length || !isInteractive) {
    return null
  }

  const choices = projects.map((projectName) => ({
    value: projectName,
    label: `前端 (${projectName})`,
  }))
  const defaultValue = pickDefaultProject({ projects, lastProject })
  const chooser = askChoiceOverride ?? askChoice
  return chooser({
    title: '请选择要发布的项目',
    choices,
    defaultValue,
  })
}
