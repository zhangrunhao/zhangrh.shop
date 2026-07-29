import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const cwd = process.cwd()
const projectRoot = path.join(cwd, 'project')

const listProjects = () => {
  if (!fs.existsSync(projectRoot)) {
    return []
  }
  return fs
    .readdirSync(projectRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

const projects = listProjects()

const usage = () => {
  const available = projects.length ? projects.join(', ') : 'none'
  console.log('Usage: npm run dev <project-name>')
  console.log('       npm run build <project-name>')
  console.log(`Available projects: ${available}`)
}

const parseProjectFromNpm = (command) => {
  const raw = process.env.npm_config_argv
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw)
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

const extractProjectArg = (args) => {
  let project = null
  const rest = []
  for (const arg of args) {
    if (!project && projects.includes(arg)) {
      project = arg
      continue
    }
    rest.push(arg)
  }
  return { project, rest }
}

const [command, ...rawArgs] = process.argv.slice(2)
const supportedCommands = new Set(['dev', 'build', 'preview'])

if (!command || !supportedCommands.has(command)) {
  usage()
  process.exit(1)
}

const { project: projectFromArgs, rest } = extractProjectArg(rawArgs)
const project = projectFromArgs ?? parseProjectFromNpm(command)

if (!project) {
  console.error('Missing project name.')
  usage()
  process.exit(1)
}

const configPath = path.join(projectRoot, project, 'vite.config.ts')
if (!fs.existsSync(configPath)) {
  console.error(`Missing Vite config: ${configPath}`)
  process.exit(1)
}

if (project === 'hub' && (command === 'dev' || command === 'build')) {
  const preparationScript = path.join(
    projectRoot,
    project,
    'scripts',
    'prepare-articles.mjs',
  )
  const preparationMode = command === 'build' ? 'production' : 'development'
  const preparation = spawnSync(
    process.execPath,
    [preparationScript, preparationMode],
    { stdio: 'inherit' },
  )
  if (preparation.status !== 0) {
    process.exit(preparation.status ?? 1)
  }
}

const viteBin = path.join(
  cwd,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'vite.cmd' : 'vite',
)
const viteScript = path.join(cwd, 'node_modules', 'vite', 'bin', 'vite.js')

const viteArgs = command === 'build' || command === 'preview' ? [command] : []
viteArgs.push('--config', configPath, ...rest)

let spawnCommand = viteBin
let spawnArgs = viteArgs

if (!fs.existsSync(viteBin)) {
  if (!fs.existsSync(viteScript)) {
    console.error('Vite is not installed. Run "npm install" inside frontend.')
    process.exit(1)
  }
  spawnCommand = process.execPath
  spawnArgs = [viteScript, ...viteArgs]
}

const child = spawn(spawnCommand, spawnArgs, { stdio: 'inherit' })
child.on('exit', (code) => {
  process.exit(code ?? 1)
})
