import path from 'node:path'

const slashNormalize = (value) => String(value).replace(/\\/g, '/').replace(/^\/+/, '')

export const normalizeRelativePath = (value) =>
  path.posix.normalize(slashNormalize(value))

export const trimSlashes = (value) => String(value).replace(/^\/+|\/+$/g, '')

export const trimTrailingSlashes = (value) => String(value).replace(/\/+$/g, '')

const isTraversalPath = (relativePath) =>
  relativePath === '..' ||
  relativePath.startsWith('../') ||
  relativePath.split('/').includes('..')

const normalizeProjectName = (projectName) => {
  const value = String(projectName).trim()
  const normalized = path.posix.normalize(value.replace(/\\/g, '/'))
  if (
    !/^[A-Za-z0-9_-]+$/.test(value) ||
    value.includes('/') ||
    value.includes('\\') ||
    normalized === '.' ||
    normalized === '..'
  ) {
    throw new Error(`Invalid project name: ${projectName}`)
  }

  return normalized
}

export const buildStaticObjectKey = ({ config, projectName, relativeStaticPath }) => {
  if (slashNormalize(relativeStaticPath).split('/').includes('..')) {
    throw new Error(`Expected static asset path under static/: ${relativeStaticPath}`)
  }

  const relativePath = normalizeRelativePath(relativeStaticPath)
  if (isTraversalPath(relativePath) || !relativePath.startsWith('static/')) {
    throw new Error(`Expected static asset path under static/: ${relativeStaticPath}`)
  }

  return [trimSlashes(config.uploadRoot), normalizeProjectName(projectName), relativePath]
    .filter(Boolean)
    .join('/')
}

export const buildPublicUrl = ({ config, objectKey }) => {
  if (slashNormalize(objectKey).split('/').includes('..')) {
    throw new Error(`Invalid OSS object key: ${objectKey}`)
  }

  const normalizedObjectKey = normalizeRelativePath(objectKey)
  if (normalizedObjectKey === '.' || isTraversalPath(normalizedObjectKey)) {
    throw new Error(`Invalid OSS object key: ${objectKey}`)
  }

  return `${trimTrailingSlashes(config.publicBaseUrl)}/${normalizedObjectKey}`
}

export const buildPublicAssetUrl = ({ config, projectName, relativeStaticPath }) =>
  buildPublicUrl({
    config,
    objectKey: buildStaticObjectKey({ config, projectName, relativeStaticPath }),
  })

export const readOssCredentials = (env = process.env) => {
  const missing = []
  const accessKeyId = env.OSS_ACCESS_KEY_ID?.trim()
  const accessKeySecret = env.OSS_ACCESS_KEY_SECRET?.trim()
  if (!accessKeyId) {
    missing.push('OSS_ACCESS_KEY_ID')
  }
  if (!accessKeySecret) {
    missing.push('OSS_ACCESS_KEY_SECRET')
  }
  if (missing.length) {
    throw new Error(`Missing ${missing.join(' and ')}`)
  }
  if (/\s/.test(accessKeyId)) {
    throw new Error('Invalid OSS_ACCESS_KEY_ID')
  }
  if (/\s/.test(accessKeySecret)) {
    throw new Error('Invalid OSS_ACCESS_KEY_SECRET')
  }

  return {
    accessKeyId,
    accessKeySecret,
  }
}

export const buildOssClientOptions = ({ config, credentials }) => ({
  region: config.region,
  bucket: config.bucket,
  accessKeyId: credentials.accessKeyId,
  accessKeySecret: credentials.accessKeySecret,
  authorizationV4: true,
})

export const relativePathFromDist = ({ distDir, filePath }) => {
  const relativePath = normalizeRelativePath(path.relative(distDir, filePath))
  if (relativePath === '.' || isTraversalPath(relativePath)) {
    throw new Error(`Expected file path inside dist directory: ${filePath}`)
  }

  return relativePath
}
