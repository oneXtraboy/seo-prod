import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { articles } from '../src/data/articles'
import { cases } from '../src/data/cases'
import { allKnownPaths, footerNavigation, normalizePath, primaryNavigation, prototypeRoutes, publicRoutes } from '../src/data/routes'
import { services } from '../src/data/services'

const errors: string[] = []

function check(condition: boolean, message: string) {
  if (!condition) errors.push(message)
}

check(publicRoutes.length === 45, `Ожидалось 45 публичных маршрутов, найдено ${publicRoutes.length}.`)
check(prototypeRoutes.length === 1 && prototypeRoutes[0].path === '/_prototype/variants/', 'Служебный маршрут A/B-вариантов отсутствует или изменён.')

const routePaths = publicRoutes.map((route) => route.path)
check(new Set(routePaths).size === routePaths.length, 'В публичном реестре есть дубли маршрутов.')
for (const path of routePaths) check(path === '/' || path.endsWith('/'), `Маршрут должен заканчиваться слэшем: ${path}`)

const declaredLinks = [
  ...primaryNavigation.map((item) => item.path),
  ...footerNavigation.map((item) => item.path),
  ...services.map((item) => item.path),
  ...services.map((service) => cases.find((item) => item.id === service.caseId)?.path || ''),
  ...cases.map((item) => item.path),
  ...cases.map((item) => item.servicePath),
  ...articles.map((item) => item.path),
  ...articles.map((item) => item.servicePath),
  '/contacts/',
  '/report-example/',
  '/results/',
  '/authors/synapsee/',
]

for (const link of declaredLinks) check(allKnownPaths.has(normalizePath(link)), `Структурированная ссылка ведёт на отсутствующий маршрут: ${link}`)
check(routePaths.includes('/contacts/'), 'Публичный маршрут /contacts/ отсутствует.')
check(!routePaths.includes('/contact/'), 'Устаревший маршрут /contact/ не должен публиковаться.')
check(!routePaths.some((path) => /^\/cases\/\d+\/$/.test(path)), 'Числовые URL кейсов не должны публиковаться.')

for (const service of services) {
  const route = publicRoutes.find((item) => item.path === service.path)
  check(Boolean(route && route.kind === 'service' && route.dataId === service.id), `Услуга ${service.id} не связана с корректным маршрутом.`)
}
for (const item of cases) {
  const route = publicRoutes.find((entry) => entry.path === item.path)
  check(Boolean(route && route.kind === 'case' && route.dataId === item.id), `Кейс ${item.id} не связан с корректным маршрутом.`)
}
for (const article of articles) {
  const route = publicRoutes.find((item) => item.path === article.path)
  check(Boolean(route && route.kind === 'article' && route.dataId === article.id), `Статья ${article.id} не связана с корректным маршрутом.`)
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    return statSync(path).isDirectory() ? sourceFiles(path) : /\.(ts|tsx)$/.test(name) ? [path] : []
  })
}

const staticLinkPattern = /(?:to|href)\s*=\s*["'](\/[^"'#?]*)["']/g
for (const file of sourceFiles('src')) {
  const source = readFileSync(file, 'utf8')
  for (const match of source.matchAll(staticLinkPattern)) {
    const link = normalizePath(match[1])
    check(allKnownPaths.has(link), `Статическая ссылка ${match[1]} в ${file} ведёт на отсутствующий маршрут.`)
  }
}

if (errors.length) {
  console.error(`Проверка внутренних ссылок: ошибок ${errors.length}`)
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

console.log(`Проверка внутренних ссылок пройдена: 45 публичных + ${prototypeRoutes.length} служебный маршрут, ${declaredLinks.length} структурированных ссылок.`)
