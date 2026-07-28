import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, mergeConfig } from 'vite'
import { buildProjectPublicBase } from './scripts/oss-static-lib.mjs'
import { OSS_STATIC_CONFIG } from './scripts/oss-static.config.mjs'

const PUBLISH_OSS_ASSETS_ENV = 'ZHANGRH_SHOP_PUBLISH_OSS_ASSETS'

const sharedConfig = defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})

export const createProjectConfig = ({
  projectRoot,
}: {
  projectRoot: string
}) => {
  const projectName = path.basename(projectRoot)
  const distRoot = path.resolve(projectRoot, '../../dist', projectName)
  const basePath = `/${projectName}/`

  return defineConfig(({ command, isPreview }) => {
    const publicAssetBase =
      command === 'build' && process.env[PUBLISH_OSS_ASSETS_ENV] === '1'
        ? buildProjectPublicBase({
            config: OSS_STATIC_CONFIG,
            projectName,
          })
        : null

    return mergeConfig(sharedConfig, {
      root: projectRoot,
      base: command === 'build' || isPreview ? basePath : '/',
      appType: 'spa',
      experimental: publicAssetBase
        ? {
            renderBuiltUrl: (filename: string) =>
              `${publicAssetBase}${filename.replace(/^\/+/, '')}`,
          }
        : undefined,
      build: {
        outDir: distRoot,
        assetsDir: 'static',
        emptyOutDir: true,
      },
    })
  })
}

export default sharedConfig
