import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import {
  DEFAULT_COMPOSE_ROOT,
  DEFAULT_RSYNC_DEST,
  DEFAULT_RSYNC_HOST,
  DEFAULT_RSYNC_USER,
  buildRemoteComposeCommand,
  buildRsyncArgs,
  ensureTrailingSlash,
  shellEscape,
} from './publish-lib.mjs'

const findBackendRoot = (start) => {
  let current = start
  while (true) {
    const pkgPath = path.join(current, 'package.json')
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
        if (pkg?.name === 'backend') {
          return current
        }
      } catch {
        // ignore invalid package.json
      }
    }
    const parent = path.dirname(current)
    if (parent === current) {
      return null
    }
    current = parent
  }
}

const parseArgs = (args) => {
  const options = {}
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '--user') {
      options.user = args[i + 1]
      i += 1
      continue
    }
    if (arg === '--host') {
      options.host = args[i + 1]
      i += 1
      continue
    }
    if (arg === '--dest') {
      options.dest = args[i + 1]
      i += 1
      continue
    }
    if (arg === '--compose-root') {
      options.composeRoot = args[i + 1]
      i += 1
    }
  }
  return options
}

const usage = () => {
  console.log('Usage: npm run publish [-- --host <host> --dest <path> --user <user> --compose-root <path>]')
  console.log(`Default target: ${DEFAULT_RSYNC_USER}@${DEFAULT_RSYNC_HOST}:${DEFAULT_RSYNC_DEST}`)
}

const run = (command, args, options) => {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const backendRoot = findBackendRoot(process.cwd())
if (!backendRoot) {
  console.error('Unable to locate backend root (package.json name: backend).')
  process.exit(1)
}

const cliOptions = parseArgs(process.argv.slice(2))
const rsyncUser = cliOptions.user ?? DEFAULT_RSYNC_USER
const rsyncHost = cliOptions.host ?? DEFAULT_RSYNC_HOST
const rsyncDest = cliOptions.dest ?? DEFAULT_RSYNC_DEST
const composeRoot = cliOptions.composeRoot ?? DEFAULT_COMPOSE_ROOT

const remote = `${rsyncUser}@${rsyncHost}`
const remoteDest = ensureTrailingSlash(rsyncDest)

run('ssh', [remote, `mkdir -p ${shellEscape(rsyncDest)}`])
run('rsync', buildRsyncArgs({ remote, remoteDest }), { cwd: backendRoot })
run('ssh', [remote, buildRemoteComposeCommand(composeRoot)])
