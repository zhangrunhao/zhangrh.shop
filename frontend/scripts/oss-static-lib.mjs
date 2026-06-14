import path from 'node:path'

export const normalizeRelativePath = (value) =>
  String(value).replace(/\\/g, '/').replace(/^\/+/, '')

export const trimSlashes = (value) => String(value).replace(/^\/+|\/+$/g, '')

export const trimTrailingSlashes = (value) => String(value).replace(/\/+$/g, '')

export const buildStaticObjectKey = ({ config, projectName, relativeStaticPath }) => {
  const relativePath = normalizeRelativePath(relativeStaticPath)
  if (!relativePath.startsWith('static/')) {
    throw new Error(`Expected static asset path under static/: ${relativeStaticPath}`)
  }

  return [trimSlashes(config.uploadRoot), projectName, relativePath]
    .filter(Boolean)
    .join('/')
}

export const buildPublicUrl = ({ config, objectKey }) =>
  `${trimTrailingSlashes(config.publicBaseUrl)}/${normalizeRelativePath(objectKey)}`

export const buildPublicAssetUrl = ({ config, projectName, relativeStaticPath }) =>
  buildPublicUrl({
    config,
    objectKey: buildStaticObjectKey({ config, projectName, relativeStaticPath }),
  })

export const readOssCredentials = (env = process.env) => {
  const missing = []
  if (!env.OSS_ACCESS_KEY_ID) {
    missing.push('OSS_ACCESS_KEY_ID')
  }
  if (!env.OSS_ACCESS_KEY_SECRET) {
    missing.push('OSS_ACCESS_KEY_SECRET')
  }
  if (missing.length) {
    throw new Error(`Missing ${missing.join(' and ')}`)
  }

  return {
    accessKeyId: env.OSS_ACCESS_KEY_ID,
    accessKeySecret: env.OSS_ACCESS_KEY_SECRET,
  }
}

export const buildOssClientOptions = ({ config, credentials }) => ({
  region: config.region,
  bucket: config.bucket,
  accessKeyId: credentials.accessKeyId,
  accessKeySecret: credentials.accessKeySecret,
  authorizationV4: true,
})

export const relativePathFromDist = ({ distDir, filePath }) =>
  normalizeRelativePath(path.relative(distDir, filePath))
