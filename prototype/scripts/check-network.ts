import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const forbiddenPatterns = [
  { label: 'внешний fetch()', pattern: /\bfetch\s*\(/ },
  { label: 'XMLHttpRequest', pattern: /\bXMLHttpRequest\b/ },
  { label: 'WebSocket', pattern: /\bnew\s+WebSocket\b/ },
  { label: 'EventSource', pattern: /\bnew\s+EventSource\b/ },
  { label: 'axios', pattern: /\baxios\b/ },
]

const allowedExternalRuntimeResources = [
  'https://mc.yandex.ru/metrika/tag.js?id=112847372',
  'https://mc.yandex.ru/watch/112847372',
]

function files(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    return statSync(path).isDirectory() ? files(path) : /\.(ts|tsx|css|html)$/.test(name) ? [path] : []
  })
}

const violations: string[] = []
for (const file of [...files('src'), 'index.html']) {
  let source = readFileSync(file, 'utf8')
  source = allowedExternalRuntimeResources.reduce(
    (result, resource) => result.replaceAll(resource, ''),
    source,
  )
  const checkedSource = source.replace(/\bfetch\s*\(\s*['"]\/api\/[^'"]*['"]/g, 'internalApiFetch(')
  for (const item of forbiddenPatterns) if (item.pattern.test(checkedSource)) violations.push(`${file}: найден ${item.label}`)
  if (/(?:src|url)\s*[:=(]\s*["']https?:\/\//i.test(source)) violations.push(`${file}: найден внешний runtime-ресурс`)
}

if (violations.length) {
  console.error('Найдены потенциальные внешние runtime-запросы:')
  violations.forEach((violation) => console.error(`- ${violation}`))
  process.exit(1)
}

console.log('Проверка сети пройдена: разрешены внутренние /api/ запросы формы и ресурсы счётчика Яндекс Метрики.')
