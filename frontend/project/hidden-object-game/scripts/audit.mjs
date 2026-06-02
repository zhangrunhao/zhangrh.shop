import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const projectRoot = path.resolve(import.meta.dirname, '..')

const requiredFiles = [
  'index.html',
  'vite.config.ts',
  'main.tsx',
  'app.tsx',
  'styles.css',
  'mock/types.ts',
  'mock/mock-service.ts',
  'mock/fixtures/api-home.json',
  'mock/fixtures/api-venue-trial.json',
  'mock/fixtures/api-submit-win.json',
  'mock/fixtures/api-reduce.json',
  'mock/fixtures/api-add-tip.json',
  'mock/fixtures/api-prize-lot.json',
  'mock/fixtures/api-lottery.json',
  'mock/fixtures/api-reward.json',
  'mock/fixtures/api-user.json',
  'utils/query.ts',
  'utils/rem.ts',
  'utils/storage.ts',
  'components/popup.tsx',
  'components/toast.tsx',
  'components/loading.tsx',
  'pages/home/home-page.tsx',
  'pages/home/home-page.css',
  'pages/home/rule-dialog.tsx',
  'pages/home/prize-dialog.tsx',
  'pages/home/lottery-dialog.tsx',
  'pages/venue/venue-page.tsx',
  'pages/venue/stage.tsx',
  'pages/venue/touch-mask.tsx',
  'pages/venue/reward-dialog.tsx',
  'pages/venue/venue-page.css',
]

const forbiddenPatterns = [
  /\/api\//,
  /trackAGif/,
  /trackH5Gif/,
  /\btrace\(/,
  /wxConfig/,
  /callUpApp/,
  /toolsApi/,
  /newsApi/,
  /viewApi/,
  /commonApi/,
  /captcha/i,
  /share:\/\//,
  /fastshare:\/\//,
]

const listFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') {
        return []
      }
      return listFiles(fullPath)
    }
    return [fullPath]
  })
}

const failures = []

for (const file of requiredFiles) {
  const fullPath = path.join(projectRoot, file)
  if (!fs.existsSync(fullPath)) {
    failures.push(`Missing required file: ${file}`)
  }
}

for (const file of listFiles(projectRoot)) {
  if (!/\.(ts|tsx|js|jsx|html|css|json)$/.test(file)) {
    continue
  }
  const content = fs.readFileSync(file, 'utf8')
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      failures.push(`Forbidden pattern ${pattern} found in ${path.relative(projectRoot, file)}`)
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('hidden-object-game audit passed')
