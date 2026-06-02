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
  'components/toast-context.ts',
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

const rx = (...parts) => new RegExp(parts.join(''))

const forbiddenPatterns = [
  /\/api\//,
  rx('trackA', 'Gif'),
  rx('trackH5', 'Gif'),
  /\btrace\(/,
  rx('wx', 'Config'),
  rx('callUp', 'App'),
  rx('tools', 'Api'),
  rx('news', 'Api'),
  rx('view', 'Api'),
  rx('common', 'Api'),
  new RegExp(['cap', 'tcha'].join(''), 'i'),
  /share:\/\//,
  /fastshare:\/\//,
  /window\.location\.href\s*=/,
  /location\.replace/,
  /openUrl/,
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

const extractImportSpecifiers = (content) => {
  const specifiers = []
  const patterns = [
    /\bimport\s+(?:type\s+)?[\s\S]*?\bfrom\s*(['"])([^'"]+)\1/g,
    /\bimport\s*(['"])([^'"]+)\1/g,
    /\bexport\s+(?:type\s+)?[\s\S]*?\bfrom\s*(['"])([^'"]+)\1/g,
    /\bimport\s*\(\s*(['"])([^'"]+)\1\s*\)/g,
    /\brequire\s*\(\s*(['"])([^'"]+)\1\s*\)/g,
  ]

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      specifiers.push(match[2])
    }
  }

  return specifiers
}

const isRelativeSpecifier = (specifier) => specifier.startsWith('./') || specifier.startsWith('../')

const hasPathSegment = (specifier, segment) => specifier.split('/').includes(segment)

const isForbiddenImportSpecifier = (specifier, file) => {
  if (isRelativeSpecifier(specifier)) {
    const resolvedPath = path.resolve(path.dirname(file), specifier)
    if (!path.relative(projectRoot, resolvedPath).startsWith('..')) {
      return false
    }

    const normalizedPath = path.normalize(resolvedPath)
    return (
      normalizedPath.includes('re-activity') ||
      hasPathSegment(normalizedPath, 'common') ||
      hasPathSegment(normalizedPath, 'components')
    )
  }

  if (
    specifier.includes('re-activity') ||
    specifier === 'axios' ||
    specifier.startsWith('axios/') ||
    specifier === '@sohu' ||
    specifier.startsWith('@sohu/')
  ) {
    return true
  }

  return specifier === 'common' || specifier.startsWith('common/') || specifier === 'components' || specifier.startsWith('components/')
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

for (const file of listFiles(projectRoot)) {
  if (!/\.(ts|tsx|js|jsx)$/.test(file)) {
    continue
  }
  const content = fs.readFileSync(file, 'utf8')
  for (const specifier of extractImportSpecifiers(content)) {
    if (isForbiddenImportSpecifier(specifier, file)) {
      failures.push(`Forbidden import "${specifier}" found in ${path.relative(projectRoot, file)}`)
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('hidden-object-game audit passed')
