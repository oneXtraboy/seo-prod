import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(rootDir, 'dist')
const serverEntry = path.join(rootDir, 'dist-ssr', 'entry-server.js')
const { publicRoutes, render } = await import(pathToFileURL(serverEntry).href)
const template = await fs.readFile(path.join(distDir, 'index.html'), 'utf8')

function escapeAttribute(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function buildDocument(result) {
  const robots = result.seo.noIndex ? 'noindex, follow' : 'index, follow, max-image-preview:large'
  const head = [
    `<meta name="robots" content="${robots}">`,
    `<link rel="canonical" href="${escapeAttribute(result.seo.canonical)}">`,
    `<meta property="og:locale" content="ru_RU">`,
    `<meta property="og:type" content="${result.seo.type}">`,
    `<meta property="og:site_name" content="Synapsee">`,
    `<meta property="og:title" content="${escapeAttribute((result.seo.ogTitle || result.seo.title))}">`,
    `<meta property="og:description" content="${escapeAttribute((result.seo.ogDescription || result.seo.description))}">`,
    `<meta property="og:url" content="${escapeAttribute(result.seo.canonical)}">`,
    '<meta property="og:image" content="https://synapsee.ru/og.png">',
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escapeAttribute((result.seo.ogTitle || result.seo.title))}">`,
    `<meta name="twitter:description" content="${escapeAttribute((result.seo.ogDescription || result.seo.description))}">`,
    '<meta name="twitter:image" content="https://synapsee.ru/og.png">',
    result.jsonLd ? `<script id="structured-data" type="application/ld+json">${escapeJson(result.jsonLd)}</script>` : '',
  ].filter(Boolean).join('\n    ')

  return template
    .replace(/<title>.*?<\/title>/s, `<title>${escapeAttribute(result.seo.title)}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?>/i, `<meta name="description" content="${escapeAttribute(result.seo.description)}">`)
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${result.html}</div>`)
}

for (const route of publicRoutes) {
  const result = render(route.path)
  const targetDir = route.path === '/' ? distDir : path.join(distDir, route.path.slice(1))
  await fs.mkdir(targetDir, { recursive: true })
  await fs.writeFile(path.join(targetDir, 'index.html'), buildDocument(result), 'utf8')
}

const notFound = render('/404-not-found/')
await fs.writeFile(path.join(distDir, '404.html'), buildDocument(notFound), 'utf8')

const lastmod = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicRoutes.map((route) => `  <url><loc>https://synapsee.ru${route.path}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`
await fs.writeFile(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8')
await fs.writeFile(path.join(distDir, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://synapsee.ru/sitemap.xml\n', 'utf8')
