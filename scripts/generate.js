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

function generate() {
  const site = readJson(path.join(contentDir, 'site.json'));
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
}

generate();
