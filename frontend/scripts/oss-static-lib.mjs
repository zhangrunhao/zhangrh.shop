import fs from 'node:fs'
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

export const listFilesRecursive = (rootDir) => {
  const rootPath = path.resolve(rootDir)
  const entries = fs.readdirSync(rootPath, { withFileTypes: true })
  const files = entries.flatMap((entry) => {
    const entryPath = path.join(rootPath, entry.name)
    if (entry.isDirectory()) {
      return listFilesRecursive(entryPath)
    }
    if (entry.isFile()) {
      return [entryPath]
    }
    return []
  })

  return files.sort()
}

export const listStaticAssetEntries = ({ distDir, config, projectName }) => {
  const staticDir = path.join(distDir, 'static')
  if (!fs.existsSync(staticDir) || !fs.statSync(staticDir).isDirectory()) {
    throw new Error(`Build static output not found: ${staticDir}`)
  }

  return listFilesRecursive(staticDir).map((localPath) => {
    const relativeStaticPath = relativePathFromDist({ distDir, filePath: localPath })
    const objectKey = buildStaticObjectKey({ config, projectName, relativeStaticPath })
    return {
      localPath,
      relativeStaticPath,
      objectKey,
      publicUrl: buildPublicUrl({ config, objectKey }),
    }
  })
}

export const listHtmlFiles = ({ distDir }) => {
  if (!fs.existsSync(distDir) || !fs.statSync(distDir).isDirectory()) {
    throw new Error(`Build output not found: ${distDir}`)
  }

  return listFilesRecursive(distDir)
    .filter((localPath) => path.extname(localPath) === '.html')
    .map((localPath) => ({
      localPath,
      relativeHtmlPath: relativePathFromDist({ distDir, filePath: localPath }),
    }))
}

export const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const rewriteHtmlAssetUrls = ({ html, config, projectName }) => {
  const projectPath = escapeRegExp(normalizeProjectName(projectName))
  const assetUrlPattern = new RegExp(`(["'(=])(/${projectPath}/static/[^"'()\\s<>]+)`, 'g')

  return html.replace(assetUrlPattern, (match, prefix, assetPath) => {
    const relativeStaticPath = assetPath.replace(new RegExp(`^/${projectPath}/`), '')
    return `${prefix}${buildPublicAssetUrl({ config, projectName, relativeStaticPath })}`
  })
}

export const rewriteHtmlFile = ({ htmlPath, config, projectName }) => {
  const html = fs.readFileSync(htmlPath, 'utf8')
  const rewrittenHtml = rewriteHtmlAssetUrls({ html, config, projectName })
  const changed = rewrittenHtml !== html
  if (changed) {
    fs.writeFileSync(htmlPath, rewrittenHtml)
  }

  return {
    changed,
    htmlPath,
  }
}
