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
function section(id, title, body, containerClass = 'container') { return `<section id="${id}" class="section"><div class="${containerClass}"><h2>${escapeHtml(title)}</h2>${body}</div></section>`; }

function renderTextCard(text) {
  return `<div class="cards-grid grid-1-2-3"><article class="card"><p class="card-text">${escapeHtml(text || '')}</p></article></div>`;
}

function renderCardItems(items, kind) {
  return items.map((item) => {
    if (kind === 'client') {
      return `<article class="card card--client"><h3 class="card-title">${escapeHtml(item.title || '')}</h3><p class="card-text">${escapeHtml(item.text || '')}</p></article>`;
    }
    if (kind === 'video') {
      return `<article class="card card--video"><h3 class="card-title">Видео</h3><p class="card-text">${escapeHtml(item.text || '')}</p></article>`;
    }
    if (kind === 'quote') {
      return `<article class="card card--quote"><blockquote class="quote">${escapeHtml(item.quote || '')}</blockquote><footer class="quote-meta">${escapeHtml(item.name || '')}${item.role ? ` — ${escapeHtml(item.role)}` : ''}</footer></article>`;
    }
    if (kind === 'team') {
      return `<article class="card card--team"><h3 class="card-title">${escapeHtml(item.name || '')}</h3><p class="muted card-text">${escapeHtml(item.role || '')}</p><p class="card-text">${escapeHtml(item.text || '')}</p></article>`;
    }
    return `<article class="card"><p class="card-text">${escapeHtml(item.text || '')}</p></article>`;
  }).join('');
}

function renderCardsGrid(items, kind) {
  return `<div class="cards-grid grid-1-2-3">${renderCardItems(items, kind)}</div>`;
}

function renderClients(data) {
  if (Array.isArray(data.items) && data.items.length) {
    return renderCardsGrid(data.items, 'client');
  }
  return renderTextCard(data.text);
}

function renderReviews(data) {
  const videos = Array.isArray(data.videos) ? data.videos : [];
  const quotes = Array.isArray(data.quotes) ? data.quotes : [];
  if (videos.length || quotes.length) {
    return `<div class="cards-grid grid-1-2-3">${renderCardItems(videos, 'video')}${renderCardItems(quotes, 'quote')}</div>`;
  }
  return renderTextCard(data.text);
}

function renderTeam(data) {
  if (Array.isArray(data.members) && data.members.length) {
    return renderCardsGrid(data.members, 'team');
  }
  return renderTextCard(data.text);
}

function renderLanding(page) {
  const data = page.landing;
  const hero = `<section id="hero" class="section hero"><div class="section-container"><h1>${escapeHtml(data.hero.title)}</h1><p class="lead">${escapeHtml(data.hero.lead)}</p><div class="cards-grid grid-1-2-3">${(data.hero.stats || []).map((stat) => `<article class="card"><p class="kpi">${escapeHtml(stat)}</p></article>`).join('')}</div><p><a class="btn btn-primary" href="${escapeHtml(data.hero.ctaPrimary.href)}">${escapeHtml(data.hero.ctaPrimary.text)}</a> <a class="btn" href="${escapeHtml(data.hero.ctaSecondary.href)}">${escapeHtml(data.hero.ctaSecondary.text)}</a></p><p class="muted">${escapeHtml(data.hero.micro)}</p></div></section>`;
  const eeat = section('eeat', data.eeat.title, `<div class="cards-grid grid-1-2-3">${data.eeat.cards.map((item) => `<article class="card"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join('')}</div><p><a href="${escapeHtml(data.eeat.cta.href)}">${escapeHtml(data.eeat.cta.text)}</a></p>`, 'section-container');
  const results = section('results', data.results.title, `<div class="cards-grid grid-1-2-3">${data.results.cards.map((item) => `<article class="card"><h3>${escapeHtml(item.title)}</h3><p class="kpi">${escapeHtml(item.text)}</p></article>`).join('')}</div><p><a href="${escapeHtml(data.results.cta.href)}">${escapeHtml(data.results.cta.text)}</a></p>`, 'section-container');
  const process = section('process', data.process.title, `<div class="cards-grid grid-1-2-4">${data.process.steps.map((step, i) => `<article class="card"><p class="muted">Этап ${i + 1}</p><p>${escapeHtml(step)}</p></article>`).join('')}</div><p><a href="${escapeHtml(data.process.cta.href)}">${escapeHtml(data.process.cta.text)}</a></p>`, 'section-container');
  const pricing = section('pricing', data.pricing.title, `<div class="cards-grid grid-1-2-3">${data.pricing.cards.map((item) => `<article class="card"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join('')}</div><p><a href="${escapeHtml(data.pricing.cta.href)}">${escapeHtml(data.pricing.cta.text)}</a></p>`, 'section-container');
  const clients = section('clients', data.clients.title, renderClients(data.clients), 'section-container');
  const reviews = section('reviews', data.reviews.title, renderReviews(data.reviews), 'section-container');
  const team = section('team', data.team.title, renderTeam(data.team), 'section-container');
  const faq = section('faq', 'FAQ', `<div class="cards-grid grid-1-2-3">${data.faq.map((item) => `<article class="card"><details><summary>${escapeHtml(item.q)}</summary><p>${escapeHtml(item.a)}</p></details></article>`).join('')}</div>`, 'section-container');
  const contact = section('contact', data.finalCta.title, `<div class="card"><ul>${data.finalCta.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul><p><a class="btn btn-primary" href="${escapeHtml(data.finalCta.cta.href)}">${escapeHtml(data.finalCta.cta.text)}</a></p></div>`, 'section-container');
  return hero + eeat + results + process + pricing + clients + reviews + team + faq + contact;
}
function renderBlogIndex(page) { return `<section class="section"><div class="section-container"><h1>${escapeHtml(page.h1)}</h1><p class="lead">${escapeHtml(page.lead)}</p><div class="cards-grid grid-1-2-3">${blog.map((post) => `<article class="card"><p class="muted">${escapeHtml(post.category)} · ${escapeHtml(post.date)}</p><h2><a href="/blog/${escapeHtml(post.slug)}/">${escapeHtml(post.title)}</a></h2><p>${escapeHtml(post.lead)}</p></article>`).join('')}</div></div></section>`; }
function renderSimplePage(page) {
  const cards = Array.isArray(page.cards) ? page.cards : [];
  return `<section class="section"><div class="section-container"><h1>${escapeHtml(page.h1 || page.title || '')}</h1><p class="lead">${escapeHtml(page.lead || '')}</p>${cards.length ? `<div class="cards-grid grid-1-2-3">${cards.map((c) => `<article class="card"><h3>${escapeHtml(c.title || '')}</h3><p>${escapeHtml(c.text || '')}</p>${c.href ? `<p><a href="${escapeHtml(c.href)}">Подробнее</a></p>` : ''}</article>`).join('')}</div>` : ''}</div></section>`;
}
function renderJournalIndex(page) {
  const posts = page.journal && Array.isArray(page.journal.posts) ? page.journal.posts : [];
  const ctaHref = page.journal && page.journal.ctaHref ? page.journal.ctaHref : '/contact';
  const ctaText = page.journal && page.journal.ctaText ? page.journal.ctaText : 'Связаться';
  const hero = `<section class="section hero"><div class="section-container"><h1>${escapeHtml(page.h1 || 'Журнал')}</h1><p class="lead">${escapeHtml(page.lead || '')}</p></div></section>`;
  const cards = section('journal-list', 'Свежие материалы', `<div class="cards-grid grid-1-2-3">${posts.map((p) => `<article class="card"><h3>${escapeHtml(p.title || '')}</h3><p>${escapeHtml(p.text || '')}</p><p><a href="${escapeHtml(p.href || '#')}">Читать →</a></p></article>`).join('')}</div>`, 'section-container');
  const cta = section('journal-cta', 'Обсудим вашу задачу?', `<div class="card"><p><a class="btn btn-primary" href="${escapeHtml(ctaHref)}">${escapeHtml(ctaText)}</a></p></div>`, 'section-container');
  return hero + cards + cta;
}
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
  const pageUrls = pages.map((p) => p.slug);
  const urls = [...new Set([...pageUrls, ...blog.map((p) => `/blog/${p.slug}/`), ...authors.map((a) => `/authors/${a.slug}/`)])];
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
  pages.filter((p) => p.template === 'simple' && p.slug !== '/contact/').forEach((p) => writePage(p, renderSimplePage(p)));
  pages.filter((p) => p.template === 'journal-index').forEach((p) => writePage(p, renderJournalIndex(p)));
  blog.forEach((post) => writePage({ slug: `/blog/${post.slug}/`, title: post.title, description: post.lead }, renderPost(post)));
  authors.forEach((a) => writePage({ slug: `/authors/${a.slug}/`, title: `${a.name} — автор`, description: a.expertise }, renderAuthorPage(a)));
  writeUtilities();
}
main();
