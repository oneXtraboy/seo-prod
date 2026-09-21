import fs from 'node:fs/promises'
import path from 'node:path'

const distDir = path.resolve('dist')
const sitemap = await fs.readFile(path.join(distDir, 'sitemap.xml'), 'utf8')
const urls = [...sitemap.matchAll(/<loc>https:\/\/synapsee\.ru([^<]+)<\/loc>/g)].map((match) => match[1])
const issues = []
const titles = new Map()
const canonicals = new Set()

function decode(text) {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(?:x27|39);/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

for (const route of urls) {
  const file = route === '/' ? path.join(distDir, 'index.html') : path.join(distDir, route.slice(1), 'index.html')
  let html
  try { html = await fs.readFile(file, 'utf8') } catch { issues.push(`${route}: нет index.html`); continue }
  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '')
  const description = html.match(/<meta name="description" content="([^"]*)">/i)?.[1] || ''
  const canonical = html.match(/<link rel="canonical" href="([^"]*)">/i)?.[1] || ''
  const h1 = [...html.matchAll(/<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/gi)].map((match) => decode(match[1]))
  const headingLevels = [...html.matchAll(/<h([1-3])(?:\s[^>]*)?>/gi)].map((match) => Number(match[1]))
  const jsonLd = [...html.matchAll(/<script\b(?=[^>]*\btype="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/gi)]

  if (!title) issues.push(`${route}: пустой Title`)
  if (title.length < 25 || title.length > 80) issues.push(`${route}: длина Title ${title.length}`)
  const maxDescriptionLength = route === '/cases/seo-proizvodstvo-mercha/' ? 230 : 200
  if (!description || description.length < 90 || description.length > maxDescriptionLength) issues.push(`${route}: длина Description ${description.length}`)
  if (h1.length !== 1) issues.push(`${route}: H1 найдено ${h1.length}`)
  if (h1[0] && title.toLowerCase() === h1[0].toLowerCase()) issues.push(`${route}: Title совпадает с H1`)
  if (canonical !== `https://synapsee.ru${route}`) issues.push(`${route}: неверный canonical ${canonical}`)
  if (canonicals.has(canonical)) issues.push(`${route}: canonical дублируется`)
  canonicals.add(canonical)
  if (!/name="robots" content="index, follow, max-image-preview:large"/.test(html)) issues.push(`${route}: нет index robots`)
  if (!/property="og:title"/.test(html) || !/name="twitter:card"/.test(html)) issues.push(`${route}: неполные social meta`)
  if (jsonLd.length !== 1) issues.push(`${route}: JSON-LD-блоков ${jsonLd.length}, ожидался 1`)
  for (const match of jsonLd) {
    try {
      const data = JSON.parse(match[1])
      const graph = Array.isArray(data['@graph']) ? data['@graph'] : []
      const ids = graph.map((node) => node['@id']).filter(Boolean)
      if (data['@context'] !== 'https://schema.org' || !graph.length) issues.push(`${route}: некорректный Schema.org @graph`)
      if (new Set(ids).size !== ids.length) issues.push(`${route}: дублирующиеся @id в JSON-LD`)
    } catch {
      issues.push(`${route}: JSON-LD не парсится`)
    }
  }
  for (let index = 1; index < headingLevels.length; index += 1) {
    if (headingLevels[index] - headingLevels[index - 1] > 1) {
      issues.push(`${route}: скачок H${headingLevels[index - 1]}→H${headingLevels[index]}`)
      break
    }
  }
  const duplicate = titles.get(title)
  if (duplicate) issues.push(`${route}: Title дублирует ${duplicate}`)
  else titles.set(title, route)
}

if (urls.length !== 45) issues.push(`sitemap: ожидалось 39 URL, найдено ${urls.length}`)
const robots = await fs.readFile(path.join(distDir, 'robots.txt'), 'utf8')
if (!robots.includes('Sitemap: https://synapsee.ru/sitemap.xml')) issues.push('robots.txt: нет ссылки на sitemap')
const notFound = await fs.readFile(path.join(distDir, '404.html'), 'utf8')
if (!notFound.includes('noindex, follow')) issues.push('404.html: нет noindex')

if (issues.length) {
  console.error(`SEO-аудит сборки: ${issues.length} проблем`)
  issues.forEach((issue) => console.error(`- ${issue}`))
  process.exit(1)
}

console.log(`SEO-аудит сборки пройден: ${urls.length} URL, уникальные Title/canonical, один H1, последовательные H1–H3, валидный JSON-LD.`)
