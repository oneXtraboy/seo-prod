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

function writeHtml(filePath, html) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html, 'utf8');
}

function validatePage(page, index) {
  if (!page || typeof page !== 'object') {
    throw new Error(`pages.json item #${index} must be an object`);
  }

  if (typeof page.slug !== 'string' || !page.slug.startsWith('/')) {
    throw new Error(`pages.json item #${index} must include slug starting with "/"`);
  }
}



function writeRobotsTxt(baseUrl) {
  const origin = (baseUrl || '').replace(/\/+$/, '');
  const sitemapLine = origin ? ('Sitemap: ' + origin + '/sitemap.xml') : 'Sitemap: /sitemap.xml';
  const robots = [
    'User-agent: *',
    'Allow: /',
    sitemapLine,
    ''
  ].join('\n');

  writeHtml(path.join(publicDir, 'robots.txt'), robots);
  console.log('Generated: public/robots.txt');
}

function writeSitemapXml(baseUrl, pages) {
  const origin = (baseUrl || '').replace(/\/+$/, '');

  const slugs = pages.map(p => p.slug).filter(Boolean);
  if (!slugs.includes('/')) slugs.unshift('/');

  const locs = slugs.map(slug => {
    if (!origin) return slug;
    if (slug === '/') return origin + '/';
    return origin + slug + '/';
  });

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    locs.map(loc => '  <url>\n    <loc>' + loc + '</loc>\n  </url>').join('\n') + '\n' +
    '</urlset>\n';

  writeHtml(path.join(publicDir, 'sitemap.xml'), xml);
  console.log('Generated: public/sitemap.xml');
}

function write404Page(site, baseUrl) {
  const slug = "/404";
  const page = {
    slug,
    title: "404 — Страница не найдена",
    description: "Похоже, такой страницы нет. Проверьте адрес или вернитесь на главную.",
  };
  const contentHtml = [
    "<h1>Страница не найдена</h1>",
    "<p>Похоже, такой страницы нет. Проверьте адрес или вернитесь на главную.</p>",
    "<p><a href=\"/\">На главную</a></p>",
  ].join("\n");

  const html = renderLayout({ site, page, contentHtml });
  writeHtml(path.join(publicDir, "404.html"), html);
  console.log("Generated: public/404.html");
}

function generate() {
  const site = readJson(path.join(contentDir, 'site.json'));
  const baseUrl = (site && site.baseUrl) ? site.baseUrl : '';
  const pages = readJson(path.join(contentDir, 'pages.json'));

  if (!Array.isArray(pages)) {
    throw new Error('pages.json must contain an array');
  }

  cleanPublicDir();

  pages.forEach((page, index) => {
    validatePage(page, index);

    const contentHtml = renderPageContent(page);
    const html = renderLayout({ site, page, contentHtml });
    const filePath = outputPathForSlug(page.slug);

    writeHtml(filePath, html);
    console.log(`Generated: ${path.relative(rootDir, filePath)}`);
  });
  write404Page(site, baseUrl);
  writeRobotsTxt(baseUrl);
  writeSitemapXml(baseUrl, pages);
}

generate();