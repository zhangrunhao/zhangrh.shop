import fs from 'node:fs'
import path from 'node:path'

export const STATE_FILE_RELATIVE_PATH = path.join('.cache', 'workspace-runner-state.json')
export const NPM_BIN = process.platform === 'win32' ? 'npm.cmd' : 'npm'

export const sanitizeState = (state) => {
  if (!state || typeof state !== 'object') {
    return {
      lastDevTarget: null,
      lastPublishTarget: null,
    }
  }
  const rawLastDevTarget =
    typeof state.lastDevTarget === 'string'
      ? state.lastDevTarget
      : typeof state.lastDevFrontend === 'string'
        ? `frontend:${state.lastDevFrontend}`
        : null
  return {
    lastDevTarget: rawLastDevTarget,
    lastPublishTarget:
      typeof state.lastPublishTarget === 'string' ? state.lastPublishTarget : null,
  }
}

export const loadState = (stateFilePath) => {
  if (!fs.existsSync(stateFilePath)) {
    return sanitizeState(null)
  }
  try {
    const raw = fs.readFileSync(stateFilePath, 'utf8')
    return sanitizeState(JSON.parse(raw))
  } catch {
    return sanitizeState(null)
  }
}

export const saveState = (stateFilePath, state) => {
  const normalized = sanitizeState(state)
  fs.mkdirSync(path.dirname(stateFilePath), { recursive: true })
  fs.writeFileSync(stateFilePath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
}

export const listFrontendProjects = (projectRoot) => {
  if (!fs.existsSync(projectRoot)) {
    return []
  }
  return fs
    .readdirSync(projectRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

export const buildDevChoices = (projects) => [
  { value: 'backend', label: '后端' },
  ...projects.map((project) => ({
    value: `frontend:${project}`,
    label: `前端 (${project})`,
  })),
]

export const buildPublishChoices = (projects) => [
  { value: 'backend', label: '后端' },
  ...projects.map((project) => ({
    value: `frontend:${project}`,
    label: `前端 (${project})`,
  })),
]

export const pickDefaultChoice = ({ choices, rememberedValue, fallbackValue }) => {
  const values = new Set(choices.map((choice) => choice.value))
  if (rememberedValue && values.has(rememberedValue)) {
    return rememberedValue
  }
  if (fallbackValue && values.has(fallbackValue)) {
    return fallbackValue
  }
  return choices[0]?.value ?? null
}
