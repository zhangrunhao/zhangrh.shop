export const DEFAULT_RSYNC_USER = 'root'
export const DEFAULT_RSYNC_HOST = '101.200.185.29'
export const DEFAULT_RSYNC_DEST = '/opt/zhangrh-shop/backend'
export const DEFAULT_COMPOSE_ROOT = '/opt/zhangrh-shop'

export const ensureTrailingSlash = (value) => (value.endsWith('/') ? value : `${value}/`)

export const shellEscape = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`

export const buildRsyncArgs = ({ remote, remoteDest }) => [
  '-avz',
  '--delete',
  '--include',
  '.dockerignore',
  '--include',
  'Dockerfile',
  '--include',
  'server.js',
  '--include',
  'package.json',
  '--include',
  'package-lock.json',
  '--include',
  'projects/',
  '--include',
  'projects/***',
  '--exclude',
  '*',
  './',
  `${remote}:${ensureTrailingSlash(remoteDest)}`,
]

export const buildRemoteComposeCommand = (composeRoot = DEFAULT_COMPOSE_ROOT) =>
  `cd ${shellEscape(composeRoot)} && docker compose up -d --build backend`
