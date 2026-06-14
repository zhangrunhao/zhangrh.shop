import OSS from 'ali-oss'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { OSS_STATIC_CONFIG } from './oss-static.config.mjs'
import {
  buildOssClientOptions,
  listHtmlFiles,
  listStaticAssetEntries,
  readOssCredentials,
  rewriteHtmlFile,
} from './oss-static-lib.mjs'

const usage = () => {
  console.log('Usage: node scripts/publish-oss-assets.mjs <project-name>')
  console.log('Requires: OSS_ACCESS_KEY_ID and OSS_ACCESS_KEY_SECRET')
}

export const publishOssAssets = async ({
  projectName,
  cwd = process.cwd(),
  config = OSS_STATIC_CONFIG,
  env = process.env,
  createClient = (options) => new OSS(options),
}) => {
  if (!projectName) {
    throw new Error('Missing project name.')
  }

  const distDir = path.resolve(cwd, 'dist', projectName)
  const credentials = readOssCredentials(env)
  const client = createClient(buildOssClientOptions({ config, credentials }))
  const assetEntries = listStaticAssetEntries({ distDir, config, projectName })
  const htmlEntries = listHtmlFiles({ distDir })

  for (const entry of assetEntries) {
    await client.put(entry.objectKey, entry.localPath)
    console.log(`Uploaded OSS asset: ${entry.relativeStaticPath} -> ${entry.publicUrl}`)
  }

  const rewrites = htmlEntries.map((entry) =>
    rewriteHtmlFile({
      htmlPath: entry.localPath,
      config,
      projectName,
    }),
  )

  for (const rewrite of rewrites) {
    console.log(
      `${rewrite.changed ? 'Rewrote' : 'Checked'} HTML: ${path.relative(distDir, rewrite.htmlPath)}`,
    )
  }

  return {
    uploadedCount: assetEntries.length,
    htmlCount: htmlEntries.length,
  }
}

export async function main() {
  const projectName = process.argv[2]
  if (!projectName) {
    usage()
    process.exit(1)
  }

  const result = await publishOssAssets({ projectName })
  console.log(
    `Published OSS assets for ${projectName}: ${result.uploadedCount} assets, ${result.htmlCount} HTML files`,
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error('OSS publish failed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
