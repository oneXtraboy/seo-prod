const fs = require('fs');
const path = require('path');
const { SITE_URL } = require('../config');
const { renderLayout, escapeHtml } = require('../templates/layout');

const site = require('../content/site.json');
const pages = require('../content/pages.json');
const blog = require('../content/blog.json');
const authors = require('../content/authors.json');

const outDir = path.join(__dirname, '..', 'public');
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function writeFile(file, html) { ensureDir(path.dirname(file)); fs.writeFileSync(file, html, 'utf8'); }
function norm(u) { return String(u || '').replace(/\/+$/, ''); }
function routeToFile(slug) { return slug === '/' ? path.join(outDir, 'index.html') : path.join(outDir, slug.replace(/^\//, ''), 'index.html'); }
function section(id, title, body) { return `<section id="${id}" class="section"><div class="container"><h2>${escapeHtml(title)}</h2>${body}</div></section>`; }

function renderLanding(page) {
  const data = page.landing;
  const hero = `<section id="hero" class="section hero"><div class="container"><h1>${escapeHtml(data.hero.title)}</h1><p class="lead">${escapeHtml(data.hero.lead)}</p><p><a class="btn btn-primary" href="#contact">${escapeHtml(data.hero.ctaPrimary)}</a> <a class="btn" href="#packages">${escapeHtml(data.hero.ctaSecondary)}</a></p></div></section>`;
  const packages = section('packages', 'Пакеты и состав работ', `<div class="grid">${data.packages.map((p) => `<article class="card"><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.includes)}</p><p class="muted"><strong>Не входит:</strong> ${escapeHtml(p.excludes)}</p></article>`).join('')}</div>`);
  const cases = section('cases', 'Кейсы и метод', `<div class="grid">${data.cases.map((c) => `<article class="card"><p class="kpi">${escapeHtml(c.metric)}</p><h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.method)}</p><p class="muted">TODO: добавить подтверждённые цифры/пруфы после согласования.</p></article>`).join('')}</div>`);
  const process = section('process', 'Как работаем', `<div class="grid">${data.process.map((p, i) => `<article class="card"><p class="muted">Шаг ${i + 1}</p><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.text)}</p></article>`).join('')}</div>`);
  const trust = section('trust', 'Доверие и социальное доказательство', `<div class="card"><ul>${data.trust.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul><p class="muted">TODO: добавить реальные отзывы/логотипы после юридического согласования.</p></div>`);
  const faq = section('faq', 'FAQ: риски и ожидания', `<div class="grid">${data.faq.map((f) => `<article class="card"><h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p></article>`).join('')}</div>`);
  const contact = section('contact', 'Контакт и бриф', `<div class="card"><p>${escapeHtml(data.contact.text)}</p><p><a class="btn btn-primary" href="${escapeHtml(site.telegram)}" target="_blank" rel="noopener">Telegram</a> <a class="btn" href="tel:${escapeHtml(site.phone)}">${escapeHtml(site.phone)}</a></p></div>`);
  const extras = section('extras', 'Усилители роста', `<div class="grid">${data.extras.map((e) => `<article class="card"><h3>${escapeHtml(e.title)}</h3><p>${escapeHtml(e.text)}</p></article>`).join('')}</div>`);
  return hero + packages + cases + process + trust + faq + contact + extras;
}
function renderBlogIndex(page) { return `<section class="section"><div class="container"><h1>${escapeHtml(page.h1)}</h1><p class="lead">${escapeHtml(page.lead)}</p><div class="grid">${blog.map((post) => `<article class="card"><p class="muted">${escapeHtml(post.category)} · ${escapeHtml(post.date)}</p><h2><a href="/blog/${escapeHtml(post.slug)}/">${escapeHtml(post.title)}</a></h2><p>${escapeHtml(post.lead)}</p></article>`).join('')}</div></div></section>`; }
function renderAuthorCard(person) { return `<div class="author-card"><div class="author-avatar">${escapeHtml(person.initials)}</div><div><strong><a href="/authors/${escapeHtml(person.slug)}/">${escapeHtml(person.name)}</a></strong><div class="muted">${escapeHtml(person.role)}</div><p>${escapeHtml(person.expertise)}</p></div></div>`; }
function renderPost(post) {
  const toc = `<nav class="toc"><strong>Содержание</strong><ol>${post.sections.map((s) => `<li><a href="#${escapeHtml(s.id)}">${escapeHtml(s.heading)}</a></li>`).join('')}</ol></nav>`;
  const author = authors.find((a) => a.slug === post.author);
  const expert = authors.find((a) => a.slug === post.expert);
  const body = post.sections.map((s) => `<h2 id="${escapeHtml(s.id)}">${escapeHtml(s.heading)}</h2><p>${escapeHtml(s.text)}</p>`).join('');
  return `<section class="section"><div class="container"><p class="muted">${escapeHtml(post.category)} · ${escapeHtml(post.date)}</p><h1>${escapeHtml(post.title)}</h1><p class="lead">${escapeHtml(post.lead)}</p>${toc}<article>${body}</article>${author ? `<h3>Автор</h3>${renderAuthorCard(author)}` : ''}${expert ? `<h3>Эксперт</h3>${renderAuthorCard(expert)}` : ''}</div></section>`;
}
function renderAuthorPage(person) {
  const authored = blog.filter((p) => p.author === person.slug || p.expert === person.slug);
  return `<section class="section"><div class="container"><h1>${escapeHtml(person.name)}</h1><p class="lead">${escapeHtml(person.role)}</p><div class="card"><p><strong>Опыт:</strong> ${escapeHtml(person.experience)}</p><p><strong>Специализация:</strong> ${escapeHtml(person.expertise)}</p></div><h2>Материалы и кейсы</h2><ul>${authored.map((p) => `<li><a href="/blog/${escapeHtml(p.slug)}/">${escapeHtml(p.title)}</a></li>`).join('')}</ul></div></section>`;
}
function writePage(page, html, railSections = []) {
  const canonical = `${norm(SITE_URL)}${page.slug}`;
  const out = renderLayout({ site, page, contentHtml: html, canonical, railSections });
  writeFile(routeToFile(page.slug), out);
  console.log('generated:', routeToFile(page.slug));
}
function writeUtilities() {
  const robots = `User-agent: *\nAllow: /\nSitemap: ${norm(SITE_URL)}/sitemap.xml\n`;
  writeFile(path.join(outDir, 'robots.txt'), robots);
  const urls = ['/', '/blog/', ...blog.map((p) => `/blog/${p.slug}/`), ...authors.map((a) => `/authors/${a.slug}/`), '/contact/'];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${norm(SITE_URL)}${u}</loc></url>`).join('\n')}\n</urlset>\n`;
  writeFile(path.join(outDir, 'sitemap.xml'), sitemap);
  writeFile(path.join(outDir, '404.html'), '<!doctype html><meta charset="utf-8"><title>404</title><h1>404</h1><p>Страница не найдена</p>');
}
function main() {
  const landing = pages.find((p) => p.template === 'landing');
  const blogIndex = pages.find((p) => p.template === 'blog-index');
  const contact = pages.find((p) => p.slug === '/contact/');
  if (!landing || !blogIndex || !contact) throw new Error('Missing required pages');
  writePage(landing, renderLanding(landing), landing.railSections);
  writePage(blogIndex, renderBlogIndex(blogIndex));
  writePage(contact, `<section class="section"><div class="container"><h1>${escapeHtml(contact.h1)}</h1><p class="lead">${escapeHtml(contact.lead)}</p><div class="card"><p>Telegram: <a href="${escapeHtml(site.telegram)}">${escapeHtml(site.telegram)}</a></p><p>Телефон: <a href="tel:${escapeHtml(site.phone)}">${escapeHtml(site.phone)}</a></p></div></div></section>`);
  blog.forEach((post) => writePage({ slug: `/blog/${post.slug}/`, title: post.title, description: post.lead }, renderPost(post)));
  authors.forEach((a) => writePage({ slug: `/authors/${a.slug}/`, title: `${a.name} — автор`, description: a.expertise }, renderAuthorPage(a)));
  writeUtilities();
}
main();
