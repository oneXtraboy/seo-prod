const fs = require('fs');
const path = require('path');
const { SITE_URL } = require('../config');
const { renderLayout, escapeHtml } = require('../templates/layout');

const site = require('../content/site.json');
const pages = require('../content/pages.json');
const blog = require('../content/blog.json');
const authors = require('../content/authors.json');
const journalPosts = require('../content/journal-posts.json');
const casesData = require('../content/cases.json');

const outDir = path.join(__dirname, '..', 'public');
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function writeFile(file, html) { ensureDir(path.dirname(file)); fs.writeFileSync(file, html, 'utf8'); }
function norm(u) { return String(u || '').replace(/\/+$/, ''); }
function routeToFile(slug) { return slug === '/' ? path.join(outDir, 'index.html') : path.join(outDir, slug.replace(/^\//, ''), 'index.html'); }
function section(id, title, body, containerClass = 'container') { return `<section id="${id}" class="section"><div class="${containerClass} content-flow"><h2>${escapeHtml(title)}</h2>${body}</div></section>`; }

function getCasesCollection(page) {
  const legacyCases = Array.isArray(page.casesProof && page.casesProof.cases) ? page.casesProof.cases : [];
  return Array.isArray(casesData) && casesData.length ? casesData : legacyCases;
}

function normalizeCaseAnchor(item, index) {
  const raw = item.caseAnchor || item.id || item.slug || `case-${index + 1}`;
  return String(raw).trim().toLowerCase().replace(/[^a-z0-9-_]+/g, '-');
}

function renderCaseVisual(item) {
  if (item.topvisorImage) {
    return `<img class="clients-card-image" src="${escapeHtml(item.topvisorImage)}" alt="${escapeHtml(item.topvisorImageAlt || item.shortTitle || item.title || 'Визуал кейса')}" loading="lazy" decoding="async" />`;
  }
  return `<div class="clients-card-image-placeholder" role="img" aria-label="${escapeHtml(item.topvisorImageAlt || item.shortTitle || item.title || 'Слот под визуал кейса')}">Слот под реальный скрин Topvisor</div>`;
}

function renderLanding(page) {
  const data = page.landing;
  const hero = `<section id="hero" class="section hero"><div class="section-container content-flow"><h1>${escapeHtml(data.hero.title)}</h1><p class="lead">${escapeHtml(data.hero.lead)}</p><div class="cards-grid grid-1-2-3">${(data.hero.stats || []).map((stat) => `<article class="card"><p class="kpi">${escapeHtml(stat)}</p></article>`).join('')}</div><p><a class="btn btn-primary" href="${escapeHtml(data.hero.ctaPrimary.href)}">${escapeHtml(data.hero.ctaPrimary.text)}</a> <a class="btn" href="${escapeHtml(data.hero.ctaSecondary.href)}">${escapeHtml(data.hero.ctaSecondary.text)}</a></p><p class="muted">${escapeHtml(data.hero.micro)}</p></div></section>`;
  const eeat = section('eeat', data.eeat.title, `<div class="cards-grid grid-1-2-3">${data.eeat.cards.map((item) => `<article class="card"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join('')}</div><p><a href="${escapeHtml(data.eeat.cta.href)}">${escapeHtml(data.eeat.cta.text)}</a></p>`, 'section-container');
  const results = section('results', data.results.title, `<div class="cards-grid grid-1-2-3">${data.results.cards.map((item) => `<article class="card"><h3>${escapeHtml(item.title)}</h3><p class="kpi">${escapeHtml(item.text)}</p></article>`).join('')}</div><p><a href="${escapeHtml(data.results.cta.href)}">${escapeHtml(data.results.cta.text)}</a></p>`, 'section-container');
  const process = section('process', data.process.title, `<div class="cards-grid grid-1-2-4">${data.process.steps.map((step, i) => `<article class="card"><p class="muted">Этап ${i + 1}</p><p>${escapeHtml(step)}</p></article>`).join('')}</div><p><a href="${escapeHtml(data.process.cta.href)}">${escapeHtml(data.process.cta.text)}</a></p>`, 'section-container');
  const pricing = section('pricing', data.pricing.title, `<div class="cards-grid grid-1-2-3">${data.pricing.cards.map((item) => `<article class="card"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join('')}</div><p><a href="${escapeHtml(data.pricing.cta.href)}">${escapeHtml(data.pricing.cta.text)}</a></p>`, 'section-container');
  const featuredCases = getCasesCollection(page)
    .filter((item) => item.featuredOnHome)
    .sort((a, b) => (a.orderOnHome || Number.MAX_SAFE_INTEGER) - (b.orderOnHome || Number.MAX_SAFE_INTEGER))
    .slice(0, 6);
  const clients = `<section id="clients" class="section"><div class="section-container section-container-wide section-container-clients content-flow clients-section-flow"><div class="clients-intro"><h2>${escapeHtml(data.clients.title)}</h2><p class="lead">${escapeHtml(data.clients.lead || '')}</p></div>
    <div class="clients-carousel-wrap">
      <button class="clients-carousel-nav" type="button" data-dir="prev" aria-label="Предыдущие кейсы">←</button>
      <div class="clients-carousel-track" data-clients-carousel tabindex="0" aria-label="Карусель кейсов клиентов">
        ${featuredCases.map((item, index) => {
    const anchor = normalizeCaseAnchor(item, index);
    const href = `/cases/#${anchor}`;
    const metrics = Array.isArray(item.metricsPreview) ? item.metricsPreview.slice(0, 3) : [];
    return `<article class="card clients-card" id="home-case-${escapeHtml(anchor)}">
              <div class="clients-card-copy">
                <p class="clients-card-category">${escapeHtml(item.category || item.niche || '')}</p>
                <h3>${escapeHtml(item.shortTitle || item.title || '')}</h3>
                <p>${escapeHtml(item.shortSummary || item.context || '')}</p>
                ${metrics.length ? `<ul class="clients-card-metrics">${metrics.map((metric) => `<li>${escapeHtml(metric)}</li>`).join('')}</ul>` : ''}
                <p><a href="${escapeHtml(href)}">Смотреть кейс</a></p>
              </div>
              <div class="clients-card-visual">${renderCaseVisual(item)}</div>
            </article>`;
  }).join('')}
      </div>
      <button class="clients-carousel-nav" type="button" data-dir="next" aria-label="Следующие кейсы">→</button>
    </div>
    <p class="clients-cta-wrap"><a class="btn btn-primary clients-cta-btn" href="${escapeHtml((data.clients.cta && data.clients.cta.href) || '/cases/')}">${escapeHtml((data.clients.cta && data.clients.cta.text) || 'Смотреть все кейсы')}</a></p>
    <script>
      (() => {
        const root = document.querySelector('[data-clients-carousel]');
        if (!root) return;
        const navButtons = document.querySelectorAll('.clients-carousel-nav');
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const getStep = () => {
          const card = root.querySelector('.clients-card');
          if (!card) return root.clientWidth;
          const styles = window.getComputedStyle(root);
          const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
          return card.getBoundingClientRect().width + gap;
        };
        navButtons.forEach((button) => {
          button.addEventListener('click', () => {
            const dir = button.dataset.dir === 'next' ? 1 : -1;
            root.scrollBy({ left: getStep() * dir, behavior: prefersReduced ? 'auto' : 'smooth' });
          });
        });
        root.addEventListener('keydown', (event) => {
          if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
          event.preventDefault();
          const dir = event.key === 'ArrowRight' ? 1 : -1;
          root.scrollBy({ left: getStep() * dir, behavior: prefersReduced ? 'auto' : 'smooth' });
        });
      })();
    </script></div></section>`;
  const reviews = section('reviews', data.reviews.title, `<div class="cards-grid grid-1-2-3"><article class="card"><p>${escapeHtml(data.reviews.text)}</p></article></div>`, 'section-container');
  const team = section('team', data.team.title, `<div class="cards-grid grid-1-2-3"><article class="card"><p>${escapeHtml(data.team.text)}</p></article></div>`, 'section-container');
  const faq = section('faq', 'FAQ', `<div class="cards-grid grid-1-2-3">${data.faq.map((item) => `<article class="card"><details><summary>${escapeHtml(item.q)}</summary><p>${escapeHtml(item.a)}</p></details></article>`).join('')}</div>`, 'section-container');
  const contact = section('contact', data.finalCta.title, `<div class="card"><ul>${data.finalCta.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul><p><a class="btn btn-primary" href="${escapeHtml(data.finalCta.cta.href)}">${escapeHtml(data.finalCta.cta.text)}</a></p></div>`, 'section-container');
  return hero + eeat + results + process + pricing + clients + reviews + team + faq + contact;
}
function renderBlogIndex(page) { return `<section class="section"><div class="section-container content-flow"><h1>${escapeHtml(page.h1)}</h1><p class="lead">${escapeHtml(page.lead)}</p><div class="cards-grid grid-1-2-3">${blog.map((post) => `<article class="card"><p class="muted">${escapeHtml(post.category)} · ${escapeHtml(post.date)}</p><h2><a href="/blog/${escapeHtml(post.slug)}/">${escapeHtml(post.title)}</a></h2><p>${escapeHtml(post.lead)}</p></article>`).join('')}</div></div></section>`; }
function renderSimplePage(page) {
  const cards = Array.isArray(page.cards) ? page.cards : [];
  return `<section class="section"><div class="section-container content-flow"><h1>${escapeHtml(page.h1 || page.title || '')}</h1><p class="lead">${escapeHtml(page.lead || '')}</p>${cards.length ? `<div class="cards-grid grid-1-2-3">${cards.map((c) => `<article class="card"><h3>${escapeHtml(c.title || '')}</h3><p>${escapeHtml(c.text || '')}</p>${c.href ? `<p><a href="${escapeHtml(c.href)}">Подробнее</a></p>` : ''}</article>`).join('')}</div>` : ''}</div></section>`;
}
function renderContactPage(page) {
  const data = page.contact || {};
  const hero = data.hero || {};
  const firstMessage = data.firstMessage || {};
  const briefCards = data.briefCards || {};
  const startFlow = data.startFlow || {};
  const fit = data.fit || {};
  const finalCta = data.finalCta || {};

  const firstItems = Array.isArray(firstMessage.items) ? firstMessage.items : [];
  const briefItems = Array.isArray(briefCards.cards) ? briefCards.cards : [];
  const flowSteps = Array.isArray(startFlow.steps) ? startFlow.steps : [];
  const fitGood = Array.isArray(fit.good) ? fit.good : [];
  const fitBad = Array.isArray(fit.bad) ? fit.bad : [];

  return `<section class="section hero"><div class="section-container content-flow"><h1>${escapeHtml(page.h1 || page.title || '')}</h1><p class="lead">${escapeHtml(page.lead || '')}</p><p><a class="btn btn-primary" href="${escapeHtml((hero.primaryCta && hero.primaryCta.href) || site.telegram)}">${escapeHtml((hero.primaryCta && hero.primaryCta.text) || 'Написать в Telegram')}</a> <a class="btn" href="${escapeHtml((hero.secondaryCta && hero.secondaryCta.href) || `mailto:${site.email}`)}">${escapeHtml((hero.secondaryCta && hero.secondaryCta.text) || site.email || 'Email')}</a></p><p class="muted">${escapeHtml(hero.micro || '')}</p></div></section>
  ${section('first-message', firstMessage.title || 'Что прислать в первом сообщении', `<div class="card"><ul>${firstItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`, 'section-container')}
  ${section('short-brief', briefCards.title || 'Короткий brief', `<div class="cards-grid grid-1-2-3">${briefItems.map((item) => `<article class="card"><h3>${escapeHtml(item.title || '')}</h3><p>${escapeHtml(item.text || '')}</p></article>`).join('')}</div>`, 'section-container')}
  ${section('start', startFlow.title || 'Как проходит старт', `<div class="cards-grid grid-1-2-4">${flowSteps.map((step, index) => `<article class="card"><p class="muted">Шаг ${index + 1}</p><p>${escapeHtml(step)}</p></article>`).join('')}</div>`, 'section-container')}
  ${section('fit', fit.title || 'Когда лучше писать', `<div class="cards-grid grid-1-2-3"><article class="card"><h3>${escapeHtml(fit.goodTitle || 'Подходит, если')}</h3><ul>${fitGood.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article><article class="card"><h3>${escapeHtml(fit.badTitle || 'Не подходит, если')}</h3><ul>${fitBad.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article></div>`, 'section-container')}
  ${section('contact-cta', finalCta.title || 'Обсудить проект', `<div class="card"><p>${escapeHtml(finalCta.text || '')}</p><p><a class="btn btn-primary" href="${escapeHtml((finalCta.primaryCta && finalCta.primaryCta.href) || site.telegram)}">${escapeHtml((finalCta.primaryCta && finalCta.primaryCta.text) || 'Telegram')}</a> <a class="btn" href="${escapeHtml((finalCta.secondaryCta && finalCta.secondaryCta.href) || `mailto:${site.email}`)}">${escapeHtml((finalCta.secondaryCta && finalCta.secondaryCta.text) || site.email || 'Email')}</a></p></div>`, 'section-container')}`;
}
function renderServicesOfferPage(page) {
  const data = page.servicesOffer || {};
  const hero = data.hero || {};
  const pillars = Array.isArray(data.pillars) ? data.pillars : [];
  const packages = Array.isArray(data.packages) ? data.packages : [];
  const included = data.included || {};
  const processSteps = Array.isArray(data.process && data.process.steps) ? data.process.steps : [];
  const fit = data.fit || {};
  const finalCta = data.finalCta || {};

  return `<section id="services-hero" class="section hero"><div class="section-container content-flow"><h1>${escapeHtml(hero.title || page.h1 || page.title || '')}</h1><p class="lead">${escapeHtml(hero.lead || page.lead || '')}</p><p><a class="btn btn-primary" href="${escapeHtml((hero.primaryCta && hero.primaryCta.href) || site.telegram)}">${escapeHtml((hero.primaryCta && hero.primaryCta.text) || 'Написать в Telegram')}</a> <a class="btn" href="${escapeHtml((hero.secondaryCta && hero.secondaryCta.href) || '/contact/')}">${escapeHtml((hero.secondaryCta && hero.secondaryCta.text) || 'Перейти в контакты')}</a></p><p class="muted">${escapeHtml(hero.micro || '')}</p></div></section>
  ${section('service-pillars', data.pillarsTitle || 'Ключевые направления', `<div class="cards-grid grid-1-2-3">${pillars.map((item) => `<article class="card"><h3>${escapeHtml(item.title || '')}</h3><p>${escapeHtml(item.text || '')}</p></article>`).join('')}</div>`, 'section-container')}
  ${section('engagement-models', data.packagesTitle || 'Форматы сотрудничества', `<div class="cards-grid grid-1-2-4">${packages.map((item) => `<article class="card"><h3>${escapeHtml(item.title || '')}</h3><p>${escapeHtml(item.text || '')}</p></article>`).join('')}</div>`, 'section-container')}
  ${section('scope', data.scopeTitle || 'Что входит / не входит', `<div class="cards-grid grid-1-2-2"><article class="card"><h3>${escapeHtml(included.inTitle || 'Входит в работу')}</h3><ul>${(included.in || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article><article class="card"><h3>${escapeHtml(included.outTitle || 'Не входит')}</h3><ul>${(included.out || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article></div>`, 'section-container')}
  ${section('process', (data.process && data.process.title) || 'Процесс запуска', `<div class="cards-grid grid-1-2-3">${processSteps.map((item, index) => `<article class="card"><p class="muted">Шаг ${index + 1}</p><p>${escapeHtml(item)}</p></article>`).join('')}</div>`, 'section-container')}
  ${section('fit-filter', fit.title || 'Кому подходит', `<div class="cards-grid grid-1-2-2"><article class="card"><h3>${escapeHtml(fit.goodTitle || 'Подходит, если')}</h3><ul>${(fit.good || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article><article class="card"><h3>${escapeHtml(fit.badTitle || 'Не подходит, если')}</h3><ul>${(fit.bad || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article></div>`, 'section-container')}
  ${section('final-cta', finalCta.title || 'Следующий шаг', `<div class="card"><p>${escapeHtml(finalCta.text || '')}</p><p><a class="btn btn-primary" href="${escapeHtml((finalCta.primaryCta && finalCta.primaryCta.href) || site.telegram)}">${escapeHtml((finalCta.primaryCta && finalCta.primaryCta.text) || 'Написать в Telegram')}</a> <a class="btn" href="${escapeHtml((finalCta.secondaryCta && finalCta.secondaryCta.href) || '/contact/')}">${escapeHtml((finalCta.secondaryCta && finalCta.secondaryCta.text) || 'Перейти в контакт')}</a></p></div>`, 'section-container')}`;
}
function renderCasesProofPage(page) {
  const data = page.casesProof || {};
  const hero = data.hero || {};
  const cases = getCasesCollection(page);
  const proof = data.proof || {};
  const evaluation = data.evaluation || {};
  const patterns = Array.isArray(data.patterns) ? data.patterns : [];
  const fit = data.fit || {};
  const finalCta = data.finalCta || {};

  const casesSection = section('cases-list', data.casesTitle || 'Кейсы', `<div class="cards-grid grid-1-2-3">${cases.map((item, index) => {
    const context = item.context || item.start || '';
    const task = item.task || '';
    const actions = Array.isArray(item.actionsList) ? item.actionsList : (item.actions ? [item.actions] : []);
    const implementation = Array.isArray(item.implementation) ? item.implementation : [];
    const result = item.result || '';
    const metrics = Array.isArray(item.metrics) ? item.metrics : [];
    const evidence = item.evidence || {};
    const summary = item.takeaway || item.summary || '';

    const anchor = normalizeCaseAnchor(item, index);
    const fallbackMetrics = Array.isArray(item.metricsPreview) ? item.metricsPreview : [];
    const renderedMetrics = metrics.length
      ? metrics.map((metric) => `<li><strong>${escapeHtml(metric.label || '')}:</strong> ${escapeHtml(metric.value || 'Доступно в рабочей отчётности')} ${metric.period ? `(${escapeHtml(metric.period)})` : ''}${metric.note ? ` — ${escapeHtml(metric.note)}` : ''}</li>`).join('')
      : fallbackMetrics.map((metric) => `<li>${escapeHtml(metric)}</li>`).join('');
    return `<article class="card" id="${escapeHtml(anchor)}"><p class="muted">${escapeHtml(item.category || item.niche || '')}</p><h3>${escapeHtml(item.shortTitle || item.title || '')}</h3><p><strong>Клиент:</strong> ${escapeHtml(item.clientName || 'Под NDA')}</p><p><strong>Контекст:</strong> ${escapeHtml(context || item.shortSummary || '')}</p>${task ? `<p><strong>Задача:</strong> ${escapeHtml(task)}</p>` : ''}${actions.length ? `<p><strong>Что делали:</strong></p><ul>${actions.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>` : ''}${implementation.length ? `<p><strong>Что внедряли:</strong></p><ul>${implementation.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>` : ''}<p><strong>Результат:</strong> ${escapeHtml(result || item.result || '')}</p>${renderedMetrics ? `<p><strong>Метрики:</strong></p><ul>${renderedMetrics}</ul>` : '<p class="muted"><strong>Метрики:</strong> Публичные цифры не раскрываются; фиксируются в рабочей аналитике проекта.</p>'}<p><strong>Срок / формат:</strong> ${escapeHtml(item.duration || '')}</p>${evidence.note ? `<p class="muted"><strong>Пруф:</strong> ${escapeHtml(evidence.note)}</p>` : ''}${summary ? `<p class="muted">${escapeHtml(summary)}</p>` : ''}</article>`;
  }).join('')}</div>`, 'section-container');

  const evaluationSection = section('cases-evaluation', evaluation.title || 'Как оцениваем результат', `<div class="card"><p>${escapeHtml(evaluation.lead || 'Оцениваем не по одной метрике, а по связке продуктовых и коммерческих сигналов.')}</p><div class="cards-grid grid-1-2-3">${(evaluation.dimensions || []).map((item) => `<article class="card"><h3>${escapeHtml(item.title || '')}</h3><p>${escapeHtml(item.text || '')}</p></article>`).join('')}</div></div>`, 'section-container');

  return `<section id="cases-hero" class="section hero"><div class="section-container content-flow"><h1>${escapeHtml(hero.title || page.h1 || page.title || '')}</h1><p class="lead">${escapeHtml(hero.lead || page.lead || '')}</p><p><a class="btn btn-primary" href="${escapeHtml((hero.primaryCta && hero.primaryCta.href) || site.telegram)}">${escapeHtml((hero.primaryCta && hero.primaryCta.text) || 'Написать в Telegram')}</a> <a class="btn" href="${escapeHtml((hero.secondaryCta && hero.secondaryCta.href) || '/contact/')}">${escapeHtml((hero.secondaryCta && hero.secondaryCta.text) || 'Перейти в /contact/')}</a></p></div></section>
  ${casesSection}
  ${evaluationSection}
  ${section('proof-style', proof.title || 'Как читать эти кейсы', `<div class="card"><ul>${(proof.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`, 'section-container')}
  ${section('approach-patterns', data.patternsTitle || 'Повторяющиеся подходы', `<div class="cards-grid grid-1-2-3">${patterns.map((item) => `<article class="card"><h3>${escapeHtml(item.title || '')}</h3><p>${escapeHtml(item.text || '')}</p></article>`).join('')}</div>`, 'section-container')}
  ${section('fit-filter', fit.title || 'Кому релевантны кейсы', `<div class="cards-grid grid-1-2-2"><article class="card"><h3>${escapeHtml(fit.goodTitle || 'Релевантно, если')}</h3><ul>${(fit.good || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article><article class="card"><h3>${escapeHtml(fit.badTitle || 'Не стоит переносить напрямую, если')}</h3><ul>${(fit.bad || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article></div>`, 'section-container')}
  ${section('final-cta', finalCta.title || 'Следующий шаг', `<div class="card"><p>${escapeHtml(finalCta.text || '')}</p><p><a class="btn btn-primary" href="${escapeHtml((finalCta.primaryCta && finalCta.primaryCta.href) || site.telegram)}">${escapeHtml((finalCta.primaryCta && finalCta.primaryCta.text) || 'Написать в Telegram')}</a> <a class="btn" href="${escapeHtml((finalCta.secondaryCta && finalCta.secondaryCta.href) || '/contact/')}">${escapeHtml((finalCta.secondaryCta && finalCta.secondaryCta.text) || 'Перейти в /contact/')}</a></p></div>`, 'section-container')}`;
}
function renderJournalIndex(page) {
  const data = page.journal || {};
  const heroData = data.hero || {};
  const topics = Array.isArray(data.topics) ? data.topics : [];
  const readingPaths = Array.isArray(data.readingPaths) ? data.readingPaths : [];
  const principles = Array.isArray(data.principles) ? data.principles : [];
  const finalCta = data.finalCta || {};
  const posts = Array.isArray(journalPosts) ? journalPosts : [];
  const hero = `<section class="section hero"><div class="section-container content-flow"><h1>${escapeHtml(page.h1 || 'Журнал')}</h1><p class="lead">${escapeHtml(page.lead || '')}</p><p>${escapeHtml(heroData.text || '')}</p><p><a class="btn btn-primary" href="${escapeHtml((heroData.primaryCta && heroData.primaryCta.href) || site.telegram)}">${escapeHtml((heroData.primaryCta && heroData.primaryCta.text) || 'Написать в Telegram')}</a> <a class="btn" href="${escapeHtml((heroData.secondaryCta && heroData.secondaryCta.href) || '/contact/')}">${escapeHtml((heroData.secondaryCta && heroData.secondaryCta.text) || 'Перейти в /contact/')}</a></p></div></section>`;
  const postsSection = section('journal-posts', data.archiveTitle || 'Материалы', `<div class="cards-grid grid-1-2-3">${posts.map((post) => `<article class="card"><p class="muted">${escapeHtml(post.date || '')}</p><h3><a href="/journal/${escapeHtml(post.slug || '')}/">${escapeHtml(post.title || '')}</a></h3><p>${escapeHtml(post.excerpt || '')}</p><p><a href="/journal/${escapeHtml(post.slug || '')}/">Читать статью</a></p></article>`).join('')}</div>`, 'section-container');
  const topicsSection = section('topics', data.topicsTitle || 'Ключевые направления', `<div class="cards-grid grid-1-2-3">${topics.map((topic) => `<article class="card"><h3>${escapeHtml(topic.title || '')}</h3><p>${escapeHtml(topic.text || '')}</p><p class="muted">${escapeHtml(topic.stage || '')}</p></article>`).join('')}</div>`, 'section-container');
  const readingPathsSection = section('reading-paths', data.readingPathsTitle || 'С чего начать чтение', `<div class="cards-grid grid-1-2-3">${readingPaths.map((item) => `<article class="card"><h3>${escapeHtml(item.title || '')}</h3><p>${escapeHtml(item.text || '')}</p><p class="muted">${escapeHtml(item.audience || '')}</p></article>`).join('')}</div>`, 'section-container');
  const principlesSection = section('principles', data.principlesTitle || 'Принципы редакции', `<div class="card"><ul>${principles.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`, 'section-container');
  const finalCtaSection = section('journal-cta', finalCta.title || 'Обсудить вашу ситуацию', `<div class="card"><p>${escapeHtml(finalCta.text || '')}</p><p><a class="btn btn-primary" href="${escapeHtml((finalCta.primaryCta && finalCta.primaryCta.href) || site.telegram)}">${escapeHtml((finalCta.primaryCta && finalCta.primaryCta.text) || 'Написать в Telegram')}</a> <a class="btn" href="${escapeHtml((finalCta.secondaryCta && finalCta.secondaryCta.href) || '/contact/')}">${escapeHtml((finalCta.secondaryCta && finalCta.secondaryCta.text) || 'Перейти в /contact/')}</a></p></div>`, 'section-container');

  return hero + postsSection + topicsSection + readingPathsSection + principlesSection + finalCtaSection;
}
function renderJournalPost(post) {
  const blocks = Array.isArray(post.content) ? post.content : [];
  const body = blocks.map((block) => {
    if (block.type === 'heading') return `<h2>${escapeHtml(block.text || '')}</h2>`;
    if (block.type === 'list') return `<ul>${(block.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
    return `<p>${escapeHtml(block.text || '')}</p>`;
  }).join('');

  return `<section class="section"><div class="section-container content-flow"><p class="muted">${escapeHtml(post.date || '')}</p><h1>${escapeHtml(post.title || '')}</h1><p class="lead">${escapeHtml(post.excerpt || '')}</p><article class="card">${body}</article><p><a href="/journal/">← Вернуться в журнал</a></p></div></section>`;
}
function renderPricingOfferPage(page) {
  const data = page.pricingOffer || {};
  const hero = data.hero || {};
  const model = data.model || {};
  const packages = Array.isArray(data.packages) ? data.packages : [];
  const scope = data.scope || {};
  const steps = Array.isArray(data.steps) ? data.steps : [];
  const faq = Array.isArray(data.faq) ? data.faq : [];
  const finalCta = data.finalCta || {};

  const heroSection = `<section id="pricing-hero" class="section hero"><div class="section-container content-flow"><h1>${escapeHtml(hero.title || page.h1 || page.title || '')}</h1><p class="lead">${escapeHtml(hero.lead || page.lead || '')}</p><p><a class="btn btn-primary" href="${escapeHtml((hero.primaryCta && hero.primaryCta.href) || '/contact/')}">${escapeHtml((hero.primaryCta && hero.primaryCta.text) || 'Перейти в /contact/')}</a> <a class="btn" href="${escapeHtml((hero.secondaryCta && hero.secondaryCta.href) || site.telegram)}">${escapeHtml((hero.secondaryCta && hero.secondaryCta.text) || 'Написать в Telegram')}</a></p><p class="muted">${escapeHtml(hero.micro || '')}</p></div></section>`;
  const modelSection = section('pricing-model', model.title || 'Как формируется стоимость', `<div class="card"><p>${escapeHtml(model.text || '')}</p><ul>${(model.points || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`, 'section-container');
  const packagesSection = section('pricing-formats', data.packagesTitle || 'Форматы работы', `<div class="cards-grid grid-1-2-4">${packages.map((item) => `<article class="card"><h3>${escapeHtml(item.title || '')}</h3><p>${escapeHtml(item.text || '')}</p><p class="muted">${escapeHtml(item.fit || '')}</p></article>`).join('')}</div>`, 'section-container');
  const scopeSection = section('pricing-scope', data.scopeTitle || 'Что входит и что считается отдельно', `<div class="cards-grid grid-1-2-3"><article class="card"><h3>${escapeHtml(scope.inTitle || 'Входит')}</h3><ul>${(scope.in || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article><article class="card"><h3>${escapeHtml(scope.outTitle || 'Отдельно')}</h3><ul>${(scope.out || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article></div>`, 'section-container');
  const stepsSection = section('pricing-steps', data.stepsTitle || 'Этапы работы', `<div class="cards-grid grid-1-2-4">${steps.map((item, index) => `<article class="card"><p class="muted">Этап ${index + 1}</p><p>${escapeHtml(item)}</p></article>`).join('')}</div>`, 'section-container');
  const faqSection = section('pricing-faq', data.faqTitle || 'FAQ', `<div class="cards-grid grid-1-2-3">${faq.map((item) => `<article class="card"><details><summary>${escapeHtml(item.q || '')}</summary><p>${escapeHtml(item.a || '')}</p></details></article>`).join('')}</div>`, 'section-container');
  const finalCtaSection = section('pricing-cta', finalCta.title || 'Обсудить проект', `<div class="card"><p>${escapeHtml(finalCta.text || '')}</p><p><a class="btn btn-primary" href="${escapeHtml((finalCta.primaryCta && finalCta.primaryCta.href) || '/contact/')}">${escapeHtml((finalCta.primaryCta && finalCta.primaryCta.text) || 'Перейти в /contact/')}</a> <a class="btn" href="${escapeHtml((finalCta.secondaryCta && finalCta.secondaryCta.href) || site.telegram)}">${escapeHtml((finalCta.secondaryCta && finalCta.secondaryCta.text) || 'Написать в Telegram')}</a></p></div>`, 'section-container');

  return heroSection + modelSection + packagesSection + scopeSection + stepsSection + faqSection + finalCtaSection;
}
function renderAuthorCard(person) { return `<div class="author-card"><div class="author-avatar">${escapeHtml(person.initials)}</div><div><strong><a href="/authors/${escapeHtml(person.slug)}/">${escapeHtml(person.name)}</a></strong><div class="muted">${escapeHtml(person.role)}</div><p>${escapeHtml(person.expertise)}</p></div></div>`; }
function renderPost(post) {
  const toc = `<nav class="toc"><strong>Содержание</strong><ol>${post.sections.map((s) => `<li><a href="#${escapeHtml(s.id)}">${escapeHtml(s.heading)}</a></li>`).join('')}</ol></nav>`;
  const author = authors.find((a) => a.slug === post.author);
  const expert = authors.find((a) => a.slug === post.expert);
  const body = post.sections.map((s) => `<h2 id="${escapeHtml(s.id)}">${escapeHtml(s.heading)}</h2><p>${escapeHtml(s.text)}</p>`).join('');
  return `<section class="section"><div class="container content-flow"><p class="muted">${escapeHtml(post.category)} · ${escapeHtml(post.date)}</p><h1>${escapeHtml(post.title)}</h1><p class="lead">${escapeHtml(post.lead)}</p>${toc}<article>${body}</article>${author ? `<h3>Автор</h3>${renderAuthorCard(author)}` : ''}${expert ? `<h3>Эксперт</h3>${renderAuthorCard(expert)}` : ''}</div></section>`;
}
function renderAuthorPage(person) {
  const authored = blog.filter((p) => p.author === person.slug || p.expert === person.slug);
  return `<section class="section"><div class="container content-flow"><h1>${escapeHtml(person.name)}</h1><p class="lead">${escapeHtml(person.role)}</p><div class="card"><p><strong>Опыт:</strong> ${escapeHtml(person.experience)}</p><p><strong>Специализация:</strong> ${escapeHtml(person.expertise)}</p></div><h2>Материалы и кейсы</h2><ul>${authored.map((p) => `<li><a href="/blog/${escapeHtml(p.slug)}/">${escapeHtml(p.title)}</a></li>`).join('')}</ul></div></section>`;
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
  const urls = [...new Set([...pageUrls, ...blog.map((p) => `/blog/${p.slug}/`), ...authors.map((a) => `/authors/${a.slug}/`), ...journalPosts.map((p) => `/journal/${p.slug}/`)])];
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
  writePage(contact, renderContactPage(contact));
  pages.filter((p) => p.template === 'services-offer').forEach((p) => writePage(p, renderServicesOfferPage(p)));
  pages.filter((p) => p.template === 'cases-proof').forEach((p) => writePage(p, renderCasesProofPage(p)));
  pages.filter((p) => p.template === 'pricing-offer').forEach((p) => writePage(p, renderPricingOfferPage(p)));
  pages.filter((p) => p.template === 'simple' && p.slug !== '/contact/').forEach((p) => writePage(p, renderSimplePage(p)));
  pages.filter((p) => p.template === 'journal-index').forEach((p) => writePage(p, renderJournalIndex(p)));
  blog.forEach((post) => writePage({ slug: `/blog/${post.slug}/`, title: post.title, description: post.lead }, renderPost(post)));
  authors.forEach((a) => writePage({ slug: `/authors/${a.slug}/`, title: `${a.name} — автор`, description: a.expertise }, renderAuthorPage(a)));
  journalPosts.forEach((post) => writePage({ slug: `/journal/${post.slug}/`, title: post.title, description: post.description || post.excerpt }, renderJournalPost(post)));
  writeUtilities();
}
main();
