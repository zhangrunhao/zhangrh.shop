import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import {
  STATE_FILE_RELATIVE_PATH,
  listProjects,
  loadState,
  resolvePublishProject,
  saveState,
} from './publish-lib.mjs'

const cwd = process.cwd()
const projectRoot = path.join(cwd, 'project')
const projects = listProjects(projectRoot)
const stateFilePath = path.join(cwd, STATE_FILE_RELATIVE_PATH)

const usage = () => {
  const available = projects.length ? projects.join(', ') : 'none'
  console.log('Usage: npm run publish [project-name]')
  console.log(`Available projects: ${available}`)
  console.log('Tip: 在终端中可直接上下键选择项目')
  console.log('Publish flow: git pull -> build -> upload to 101.200.185.29')
}

const findRepoRoot = (start) => {
  let current = start
  while (true) {
    if (fs.existsSync(path.join(current, '.git'))) {
      return current
    }
    const parent = path.dirname(current)
    if (parent === current) {
      return null
    }
    current = parent
  }
}

const run = (commandName, args, options) => {
  const result = spawnSync(commandName, args, { stdio: 'inherit', ...options })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const main = async () => {
  const state = loadState(stateFilePath)
  const project = await resolvePublishProject({
    projects,
    argv: process.argv.slice(2),
    npmConfigArgvRaw: process.env.npm_config_argv,
    isInteractive: process.stdin.isTTY && process.stdout.isTTY,
    lastProject: state.lastPublishProject,
  })

  if (!project) {
    console.error('Missing project name.')
    usage()
    process.exit(1)
  }

  saveState(stateFilePath, {
    ...state,
    lastPublishProject: project,
  })

  const repoRoot = findRepoRoot(cwd) ?? path.resolve(cwd, '..')
  run('git', ['pull'], { cwd: repoRoot })
  run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build', '--', project], { cwd })
  run(process.execPath, [path.join(cwd, 'scripts', 'deploy-static.mjs'), project], { cwd })
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
