#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { renderLayout, escapeHtml } = require('../templates/layout');

const rootDir = path.resolve(__dirname, '..');
const contentDir = path.join(rootDir, 'content');
const publicDir = path.join(rootDir, 'public');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function cleanPublicDir() {
  fs.rmSync(publicDir, { recursive: true, force: true });
  fs.mkdirSync(publicDir, { recursive: true });
}

function outputPathForSlug(slug) {
  if (!slug || slug === '/') {
    return path.join(publicDir, 'index.html');
  }

  const normalized = slug.replace(/^\/+|\/+$/g, '');
  return path.join(publicDir, normalized, 'index.html');
}

function renderPageContent(page) {
  const heading = page.heading || page.title || 'Untitled';
  const body = Array.isArray(page.body) ? page.body : [];
  const paragraphs = body.map((line) => `<p>${escapeHtml(line)}</p>`).join('\n');

  return `<h1>${escapeHtml(heading)}</h1>\n${paragraphs}`;
}
function writeText(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text, 'utf8');
}

function writeHtml(filePath, html) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html, 'utf8');
}

function validatePage(page, index) {
  if (!page || typeof page !== 'object') {
    throw new Error(`pages.json item #${index} must be an object`);
  }
function normalizeBaseUrl(site) {
  const raw = (site && typeof site.baseUrl === 'string') ? site.baseUrl.trim() : '';
  if (!raw) return '';
  return raw.replace(/\/+$/, '');
}

function buildCanonical(baseUrl, slug) {
  if (!baseUrl) return '';
  if (!slug || slug === '/') return `${baseUrl}/`;
  const normalized = slug.startsWith('/') ? slug : `/${slug}`;
  return `${baseUrl}${normalized.endsWith('/') ? normalized : normalized + '/'}`;
}

function writeRobotsTxt(baseUrl) {
  const lines = [
    'User-agent: *',
    'Allow: /'
  ];
  if (baseUrl) lines.push(`Sitemap: ${baseUrl}/sitemap.xml`);
  lines.push('');
  writeText(path.join(publicDir, 'robots.txt'), lines.join('\n'));
  console.log('Generated: public/robots.txt');
}

function writeSitemapXml(baseUrl, pages) {
  const urls = pages.map((p) => buildCanonical(baseUrl, p.slug)).filter(Boolean);

  const xml =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(loc => `  <url>\n    <loc>${loc}</loc>\n  </url>`).join('\n')}
</urlset>
`;

  writeText(path.join(publicDir, 'sitemap.xml'), xml);
  console.log('Generated: public/sitemap.xml');
}

  if (typeof page.slug !== 'string' || !page.slug.startsWith('/')) {
    throw new Error(`pages.json item #${index} must include slug starting with "/"`);
  }
}

function generate() {
  const site = readJson(path.join(contentDir, 'site.json'));
  const pages = readJson(path.join(contentDir, 'pages.json'));

  if (!Array.isArray(pages)) {
    throw new Error('pages.json must contain an array');
  }

  cleanPublicDir();
  const baseUrl = normalizeBaseUrl(site);


  pages.forEach((page, index) => {
    validatePage(page, index);

const contentHtml = renderPageContent(page);
const canonical = buildCanonical(baseUrl, page.slug);
const html = renderLayout({ site, page, contentHtml, canonical });
const filePath = outputPathForSlug(page.slug);

writeHtml(filePath, html);
    console.log(`Generated: ${path.relative(rootDir, filePath)}`);
  });
}

generate();
