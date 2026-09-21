const fs = require('fs');
const path = require('path');
const { SITE_URL } = require('../config');
const { renderLayout, escapeHtml } = require('../templates/layout');
const { canonicalUrl, normalizeGeneratedHtmlLinks, normalizeHref, normalizeInternalHtmlPath, normalizeStructuredDataUrls, siteBaseUrl } = require('../lib/url-contract');

const site = require('../content/site.json');
const pages = require('../content/pages.json');
const blog = require('../content/blog.json');
const authors = require('../content/authors.json');
const journalPosts = require('../content/journal-posts.json');
const casesData = require('../content/cases.json');
const privacyPolicyText = fs.readFileSync(path.join(__dirname, '..', 'content', 'privacy-policy.txt'), 'utf8').trim();

const finalOutDir = path.join(__dirname, '..', 'public');
const outDir = path.join(__dirname, '..', '.public-build-tmp');
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function writeFile(file, html) { ensureDir(path.dirname(file)); const clean = String(html).replace(/[ \\t]+$/gm, ''); fs.writeFileSync(file, clean, 'utf8'); }
function copyStaticCaseAssets() {
  const roots = [path.join(finalOutDir, "cases"), path.join(__dirname, "..", "cases")];
  const copied = new Set();
  for (const casesRoot of roots) {
    if (!fs.existsSync(casesRoot)) continue;
    for (const caseId of fs.readdirSync(casesRoot)) {
      if (copied.has(caseId)) continue;
      const source = path.join(casesRoot, caseId, "screenshots");
      if (!fs.existsSync(source)) continue;
      const target = path.join(outDir, "cases", caseId, "screenshots");
      fs.cpSync(source, target, { recursive: true });
      copied.add(caseId);
    }
  }
}
function copyStaticAssets() {
  const source = path.join(__dirname, '..', 'assets');
  if (!fs.existsSync(source)) return;
  const target = path.join(outDir, 'assets');
  fs.cpSync(source, target, { recursive: true });
}
function routeToFile(slug) {
  const route = normalizeInternalHtmlPath(slug);
  return route === '/' ? path.join(outDir, 'index.html') : path.join(outDir, route.replace(/^\//, ''), 'index.html');
}
function htmlHref(value) { return escapeHtml(normalizeHref(value, SITE_URL)); }
function section(id, title, body, containerClass = 'container') { return `<section id="${id}" class="section"><div class="${containerClass} content-flow"><h2>${escapeHtml(title)}</h2>${body}</div></section>`; }


const BUILD_DATE = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);
const BASE_URL = siteBaseUrl(SITE_URL);
const ORGANIZATION_ID = `${BASE_URL}/#organization`;
const WEBSITE_ID = `${BASE_URL}/#website`;

function isEmptyObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0;
}

function compact(value) {
  if (Array.isArray(value)) {
    const items = value.map(compact).filter((item) => item !== undefined && item !== null && item !== '' && !(Array.isArray(item) && !item.length) && !isEmptyObject(item));
    return items.length ? items : undefined;
  }
  if (value && typeof value === 'object') {
    const next = {};
    for (const [key, child] of Object.entries(value)) {
      const normalized = compact(child);
      if (normalized !== undefined && normalized !== null && normalized !== '' && !(Array.isArray(normalized) && !normalized.length) && !isEmptyObject(normalized)) {
        next[key] = normalized;
      }
    }
    return Object.keys(next).length ? next : undefined;
  }
  return value;
}

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function stripInlineMarkup(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateText(value, maxLength = 170) {
  const text = stripInlineMarkup(value);
  if (text.length <= maxLength) return text;
  const shortened = text.slice(0, Math.max(0, maxLength - 1)).replace(/\s+\S*$/, '').trim();
  return `${shortened || text.slice(0, maxLength - 1)}…`;
}

function cleanPageTitle(value) {
  return stripInlineMarkup(value).replace(/\s+—\s+Synapsee$/i, '').trim();
}

function absoluteSiteUrl(value = '/') {
  return canonicalUrl(SITE_URL, value || '/');
}

function getAreaServedSchema() {
  const areas = asArray(site.areaServed).length ? asArray(site.areaServed) : ['Санкт-Петербург', 'Ленинградская область', 'Россия'];
  return areas.map((name) => ({ '@type': 'AdministrativeArea', name }));
}

function organizationSchema() {
  return compact({
    '@context': 'https://schema.org',
    '@type': ['Organization', 'ProfessionalService'],
    '@id': ORGANIZATION_ID,
    name: site.brandName || 'Synapsee',
    url: `${BASE_URL}/`,
    logo: absoluteSiteUrl(site.logo || '/og.png'),
    image: absoluteSiteUrl(site.ogImage || '/og.png'),
    description: site.brandTagline || site.defaultDescription,
    email: site.email,
    telephone: site.phone,
    founder: site.founder ? {
      '@type': 'Person',
      name: site.founder.name,
      jobTitle: site.founder.jobTitle,
      url: site.founder.url ? absoluteSiteUrl(site.founder.url) : undefined,
      knowsAbout: asArray(site.founder.knowsAbout).length ? site.founder.knowsAbout : asArray(site.knowsAbout),
      sameAs: asArray(site.founder.sameAs).length ? site.founder.sameAs : asArray(site.sameAs)
    } : undefined,
    foundingLocation: site.foundingLocation ? { '@type': 'Place', name: site.foundingLocation } : undefined,
    areaServed: getAreaServedSchema(),
    sameAs: asArray(site.sameAs).length ? site.sameAs : [site.telegram].filter(Boolean),
    knowsAbout: asArray(site.knowsAbout),
    contactPoint: [{
      '@type': 'ContactPoint',
      contactType: 'customer support',
      telephone: site.phone,
      email: site.email,
      availableLanguage: ['ru'],
      areaServed: getAreaServedSchema()
    }]
  });
}

function webSiteSchema() {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: site.brandName || 'Synapsee',
    url: `${BASE_URL}/`,
    inLanguage: site.language || 'ru-RU',
    publisher: { '@id': ORGANIZATION_ID }
  });
}

function getWebPageType(page) {
  if (page.template === 'contact') return 'ContactPage';
  if (page.template === 'blog-index' || page.template === 'journal-index' || page.template === 'cases-proof') return 'CollectionPage';
  if (page.template === 'author') return 'ProfilePage';
  if (normalizeInternalHtmlPath(page.slug) === '/about/') return 'AboutPage';
  return 'WebPage';
}

function webPageSchema(page, canonical) {
  return compact({
    '@context': 'https://schema.org',
    '@type': getWebPageType(page),
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: cleanPageTitle(page.title || site.defaultTitle),
    description: page.description || site.defaultDescription,
    inLanguage: site.language || 'ru-RU',
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORGANIZATION_ID },
    primaryImageOfPage: { '@type': 'ImageObject', url: absoluteSiteUrl(page.ogImage || site.ogImage || '/og.png') }
  });
}

function breadcrumbLabelFor(pathname, page) {
  const route = normalizeInternalHtmlPath(pathname);
  const labels = {
    '/services/': 'Услуги',
    '/cases/': 'Кейсы',
    '/pricing/': 'Цены',
    '/contact/': 'Контакты',
    '/about/': 'О подходе',
    '/journal/': 'Журнал',
    '/blog/': 'Блог',
    '/privacy/': 'Политика конфиденциальности',
    '/terms/': 'Условия использования',
    '/authors/synapsee/': 'Автор Synapsee'
  };
  return labels[route] || cleanPageTitle(page.title || page.h1 || site.brandName || 'Страница');
}

function breadcrumbSchema(page, slug) {
  const route = normalizeInternalHtmlPath(slug);
  if (route === '/') return null;
  const items = [{ name: 'Главная', item: `${BASE_URL}/` }];
  if (route.startsWith('/cases/') && route !== '/cases/') items.push({ name: 'Кейсы', item: absoluteSiteUrl('/cases/') });
  if (route.startsWith('/services/') && route !== '/services/') items.push({ name: 'Услуги', item: absoluteSiteUrl('/services/') });
  if (route.startsWith('/journal/') && route !== '/journal/') items.push({ name: 'Журнал', item: absoluteSiteUrl('/journal/') });
  if (route.startsWith('/blog/') && route !== '/blog/') items.push({ name: 'Блог', item: absoluteSiteUrl('/blog/') });
  if (route.startsWith('/authors/') && route !== '/authors/') items.push({ name: 'Авторы', item: absoluteSiteUrl('/authors/synapsee/') });
  items.push({ name: breadcrumbLabelFor(route, page), item: absoluteSiteUrl(route) });
  return compact({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${absoluteSiteUrl(route)}#breadcrumbs`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.item
    }))
  });
}

function faqSchema(items, canonical) {
  const questions = asArray(items).filter((item) => item && item.q && item.a);
  if (!questions.length) return null;
  return compact({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${canonical}#faq`,
    mainEntity: questions.map((item) => ({
      '@type': 'Question',
      name: stripInlineMarkup(item.q),
      acceptedAnswer: { '@type': 'Answer', text: stripInlineMarkup(item.a) }
    }))
  });
}

function serviceSchema(page, canonical) {
  const data = page.servicesOffer || page.pricingOffer || {};
  const packages = asArray(data.packages || (page.landing && page.landing.pricing && page.landing.pricing.cards));
  const pageServiceTypes = asArray(data.serviceTypes || page.serviceTypes);
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${canonical}#service`,
    name: cleanPageTitle(page.h1 || page.title || 'SEO-услуги Synapsee'),
    description: page.description || data.lead || site.defaultDescription,
    provider: { '@id': ORGANIZATION_ID },
    areaServed: getAreaServedSchema(),
    serviceType: pageServiceTypes.length ? pageServiceTypes : (asArray(site.serviceTypes).length ? site.serviceTypes : ['SEO-продвижение', 'Техническое SEO', 'Локальное SEO', 'ИИ-видимость']),
    hasOfferCatalog: packages.length ? {
      '@type': 'OfferCatalog',
      name: 'Форматы работы Synapsee',
      itemListElement: packages.map((item) => compact({
        '@type': 'Offer',
        name: item.title,
        description: item.text || item.fit,
        priceSpecification: item.price ? {
          '@type': 'PriceSpecification',
          priceCurrency: 'RUB',
          description: item.price
        } : undefined
      }))
    } : undefined
  });
}

function getCaseItemForPage(page) {
  if (page.caseItem) return page.caseItem;
  const caseIndexRaw = Number(page.caseIndex);
  const caseIndex = Number.isInteger(caseIndexRaw) && caseIndexRaw >= 0 ? caseIndexRaw : 0;
  return Array.isArray(casesData) && casesData.length ? casesData[caseIndex] : null;
}

function getCaseHeroTitle(caseItem, page = {}) {
  const detail = (caseItem && caseItem.caseDetail) || {};
  const hero = detail.hero || {};
  return stripInlineMarkup(hero.title || (caseItem && caseItem.shortTitle) || page.h1 || page.title || 'Кейс Synapsee');
}

function getCaseSeoTitle(caseItem, page = {}) {
  if (caseItem && caseItem.seoTitle) return caseItem.seoTitle;
  const subject = stripInlineMarkup((caseItem && (caseItem.category || caseItem.clientName || caseItem.shortTitle)) || page.h1 || 'SEO-кейс');
  return `Кейс: ${truncateText(subject, 52)} — Synapsee`;
}

function getCaseDescription(caseItem, page = {}) {
  if (caseItem && caseItem.seoDescription) return caseItem.seoDescription;
  return truncateText((caseItem && (caseItem.shortSummary || caseItem.result || caseItem.takeaway)) || page.description || site.defaultDescription, 175);
}

function enrichCasePage(page) {
  const caseItem = getCaseItemForPage(page);
  if (!caseItem) return page;
  const description = getCaseDescription(caseItem, page);
  const heroTitle = getCaseHeroTitle(caseItem, page);
  return {
    ...page,
    caseItem,
    h1: heroTitle,
    title: getCaseSeoTitle(caseItem, page),
    description,
    ogTitle: heroTitle,
    ogDescription: description,
    ogType: 'article'
  };
}

function caseSchema(page, canonical) {
  const caseItem = getCaseItemForPage(page);
  if (!caseItem) return null;
  const metrics = asArray(caseItem.metricsPreview).concat(asArray(caseItem.metrics)).slice(0, 8);
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${canonical}#case`,
    headline: getCaseHeroTitle(caseItem, page),
    name: getCaseHeroTitle(caseItem, page),
    description: getCaseDescription(caseItem, page),
    genre: 'Кейс',
    inLanguage: site.language || 'ru-RU',
    author: { '@id': ORGANIZATION_ID },
    publisher: { '@id': ORGANIZATION_ID },
    mainEntityOfPage: canonical,
    about: [caseItem.category, caseItem.clientName].filter(Boolean).map((name) => ({ '@type': 'Thing', name })),
    mentions: metrics.map((name) => ({ '@type': 'Thing', name: stripInlineMarkup(name) })),
    image: absoluteSiteUrl(page.ogImage || site.ogImage || '/og.png')
  });
}

function articleSchema(page, canonical) {
  const post = page.post || {};
  return compact({
    '@context': 'https://schema.org',
    '@type': page.template === 'blog-post' ? 'BlogPosting' : 'Article',
    '@id': `${canonical}#article`,
    headline: post.title || cleanPageTitle(page.title),
    description: post.description || post.excerpt || post.lead || page.description,
    datePublished: post.date,
    dateModified: post.modified || post.date,
    inLanguage: site.language || 'ru-RU',
    author: post.author ? { '@id': `${BASE_URL}/authors/${post.author}/#author` } : { '@id': ORGANIZATION_ID },
    publisher: { '@id': ORGANIZATION_ID },
    mainEntityOfPage: canonical,
    image: absoluteSiteUrl(page.ogImage || site.ogImage || '/og.png')
  });
}

function authorSchema(page, canonical) {
  const person = page.author || {};
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${canonical}#author`,
    name: person.name,
    description: person.expertise || person.experience,
    url: canonical,
    knowsAbout: asArray(person.knowsAbout).length ? person.knowsAbout : asArray(site.knowsAbout),
    sameAs: asArray(person.sameAs).length ? person.sameAs : asArray(site.sameAs)
  });
}

function buildPageSchema(page, slug, canonical) {
  const schemas = [organizationSchema(), webSiteSchema(), webPageSchema(page, canonical), breadcrumbSchema(page, slug)];
  if (page.template === 'landing') {
    schemas.push(serviceSchema(page, canonical));
    schemas.push(faqSchema(page.landing && page.landing.faq, canonical));
  }
  if (page.template === 'services-offer' || page.template === 'pricing-offer') {
    schemas.push(serviceSchema(page, canonical));
    schemas.push(faqSchema(((page.servicesOffer && page.servicesOffer.faq) || (page.pricingOffer && page.pricingOffer.faq)), canonical));
  }
  if (page.template === 'case-detail') schemas.push(caseSchema(page, canonical));
  if (page.template === 'journal-post' || page.template === 'blog-post') schemas.push(articleSchema(page, canonical));
  if (page.template === 'author') schemas.push(authorSchema(page, canonical));
  const manual = Array.isArray(page.schema) ? page.schema.filter((item) => !['Organization', 'WebSite'].includes(item && item['@type'])) : (page.schema ? [page.schema] : []);
  return compact([...schemas, ...manual]) || [];
}

function getStaticCaseScreenshotsDir(caseId) {
  const roots = [finalOutDir, path.join(__dirname, '..')];
  for (const root of roots) {
    const dir = path.join(root, 'cases', String(caseId), 'screenshots');
    if (fs.existsSync(dir)) return dir;
  }
  return '';
}

function discoverCaseScreenshots(caseIndex, caseItem) {
  const caseId = caseIndex + 1;
  const dir = getStaticCaseScreenshotsDir(caseId);
  if (!dir) return [];
  return fs.readdirSync(dir)
    .filter((file) => /\.(?:png|jpe?g|webp)$/i.test(file))
    .sort((a, b) => a.localeCompare(b, 'ru', { numeric: true }))
    .map((file, index) => ({
      src: `/cases/${caseId}/screenshots/${encodeURIComponent(file)}`,
      alt: `${caseItem.topvisorImageAlt || caseItem.shortTitle || 'Скриншот проекта'} — ${index + 1}`
    }));
}

function renderGrowthSystemSvg() {
  return `<figure class="growth-system" aria-label="Search Growth System: SEO, техническая база и GEO + AI соединяются в заявки из поиска">
    <svg class="growth-system-svg" viewBox="0 0 520 520" role="img" aria-labelledby="growth-system-title growth-system-desc" xmlns="http://www.w3.org/2000/svg">
      <title id="growth-system-title">Search Growth System</title>
      <desc id="growth-system-desc">Треугольник системы роста: SEO и спрос, техническая база и ИИ-видимость сходятся в заявки из поиска.</desc>
      <defs>
        <filter id="growth-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#1D1D1F" flood-opacity="0.12"/>
        </filter>
        <linearGradient id="growth-node" x1="175" y1="172" x2="345" y2="350" gradientUnits="userSpaceOnUse">
          <stop stop-color="#0F7DE6"/>
          <stop offset="1" stop-color="#0066CC"/>
        </linearGradient>
      </defs>

      <rect x="22" y="22" width="476" height="476" rx="42" fill="#FFFFFF" opacity="0.62"/>
      <path class="growth-flow growth-flow-a" d="M260 94 L103 342 L260 286 Z" fill="#0066CC" opacity="0.035"/>
      <path class="growth-flow growth-flow-b" d="M260 94 L417 342 L260 286 Z" fill="#0066CC" opacity="0.028"/>
      <path class="growth-flow growth-flow-c" d="M103 342 L417 342 L260 286 Z" fill="#1D1D1F" opacity="0.025"/>

      <g class="growth-lines" fill="none" stroke="#8E8E93" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M260 132 L126 306"/>
        <path d="M260 132 L394 306"/>
        <path d="M137 342 L383 342"/>
        <path d="M154 322 L231 277"/>
        <path d="M366 322 L289 277"/>
        <path d="M260 155 L260 239"/>
      </g>

      <g class="growth-card growth-card-top" filter="url(#growth-shadow)">
        <rect x="150" y="58" width="220" height="78" rx="18" fill="#FFFFFF" fill-opacity="0.86" stroke="#D2D2D7"/>
        <text x="260" y="91" text-anchor="middle" class="growth-card-title">SEO / спрос</text>
        <text x="260" y="116" text-anchor="middle" class="growth-card-text growth-text-desktop">Интенты · структура · страницы</text><text x="260" y="116" text-anchor="middle" class="growth-card-text growth-text-mobile">Спрос · страницы</text>
      </g>

      <g class="growth-card growth-card-left" filter="url(#growth-shadow)">
        <rect x="32" y="304" width="214" height="82" rx="18" fill="#FFFFFF" fill-opacity="0.86" stroke="#D2D2D7"/>
        <text x="139" y="337" text-anchor="middle" class="growth-card-title">Тех. база</text>
        <text x="139" y="362" text-anchor="middle" class="growth-card-text growth-text-desktop">Индексация · скорость · релизы</text><text x="139" y="362" text-anchor="middle" class="growth-card-text growth-text-mobile">Индекс · скорость</text>
      </g>

      <g class="growth-card growth-card-right" filter="url(#growth-shadow)">
        <rect x="274" y="304" width="214" height="82" rx="18" fill="#FFFFFF" fill-opacity="0.86" stroke="#D2D2D7"/>
        <text x="381" y="337" text-anchor="middle" class="growth-card-title">GEO + AI</text>
        <text x="381" y="362" text-anchor="middle" class="growth-card-text growth-text-desktop">Доверие · сущности · ответы</text><text x="381" y="362" text-anchor="middle" class="growth-card-text growth-text-mobile">Доверие · ответы</text>
      </g>

      <g class="growth-center" filter="url(#growth-shadow)">
        <circle cx="260" cy="266" r="62" fill="url(#growth-node)"/>
        <path d="M223 267 C240 244 258 292 277 265 S306 252 318 274" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.82"/>
        <g fill="#FFFFFF" opacity="0.58">
          <circle cx="228" cy="241" r="3"/><circle cx="251" cy="229" r="2.4"/><circle cx="285" cy="238" r="2.8"/>
          <circle cx="231" cy="291" r="2.5"/><circle cx="263" cy="303" r="3"/><circle cx="297" cy="288" r="2.4"/>
        </g>
        <text x="260" y="260" text-anchor="middle" class="growth-center-title">Заявки</text>
        <text x="260" y="284" text-anchor="middle" class="growth-center-text">из поиска</text>
      </g>

      <g class="growth-cycle" transform="translate(58 430)">
        <text x="0" y="0" class="growth-cycle-item">Позиции</text>
        <text x="84" y="0" class="growth-cycle-arrow">→</text>
        <text x="112" y="0" class="growth-cycle-item">Трафик</text>
        <text x="190" y="0" class="growth-cycle-arrow">→</text>
        <text x="218" y="0" class="growth-cycle-item">Обращения</text>
        <text x="322" y="0" class="growth-cycle-arrow">→</text>
        <text x="350" y="0" class="growth-cycle-item">Цикл</text>
      </g>
    </svg>
  </figure>`;
}

function getCasesCollection(page) {
  const legacyCases = Array.isArray(page.casesProof && page.casesProof.cases) ? page.casesProof.cases : [];
  return Array.isArray(casesData) && casesData.length ? casesData : legacyCases;
}

function normalizeCaseAnchor(item, index) {
  const raw = item.caseAnchor || item.id || item.slug || `case-${index + 1}`;
  return String(raw).trim().toLowerCase().replace(/[^a-z0-9-_]+/g, '-');
}

function getCaseHref(item, index) {
  if (Number.isInteger(index) && index >= 0 && index < 6) {
    return `/cases/${index + 1}/`;
  }
  return `/cases/#${normalizeCaseAnchor(item, index)}`;
}

function buildCaseEvidenceText(caseItem) {
  const base = 'Данные подтверждены web-аналитикой и CRM-статусами. В кейсе показаны реальные рабочие значения и фактическая динамика; название компании, домен и идентифицирующие признаки проекта скрыты по модели обезличенного кейса.';
  const specific = String(caseItem.evidence || '').trim();
  if (!specific) return base;
  return `${base} ${specific}`;
}

function renderFreeAuditForm({ source = 'Сайт', service = 'Бесплатный аудит сайта' } = {}) {
  return `<form class="audit-form" action="/api/audit" method="POST" data-audit-form>
    <input type="hidden" name="source" value="${escapeHtml(source)}">
    <input type="hidden" name="service" value="${escapeHtml(service)}">
    <input type="hidden" name="started_at" value="">
    <input type="hidden" name="challenge_token" value="">
    <label class="audit-form-field">Имя<input name="name" autocomplete="name" minlength="2" maxlength="100" required placeholder="Как к вам обращаться"></label>
    <label class="audit-form-field">Телефон<input name="phone" type="tel" autocomplete="tel" inputmode="tel" minlength="10" maxlength="24" pattern="[+0-9 ()-]{10,24}" required placeholder="+7 999 000-00-00"></label>
    <label class="audit-form-field audit-form-email">Email для получения аудита<input name="email" type="email" autocomplete="email" maxlength="254" required placeholder="name@example.ru"></label>
    <label class="audit-form-field audit-form-wide">Сайт<input name="website" type="url" autocomplete="url" maxlength="500" required placeholder="https://example.ru"></label>
    <div class="audit-form-challenge">
      <label class="audit-form-field">Проверка: сколько будет <span data-audit-challenge-question>…</span>?<input name="challenge_answer" inputmode="numeric" pattern="[0-9]{1,3}" maxlength="3" required disabled placeholder="Ответ"></label>
      <button class="audit-challenge-refresh" type="button" data-audit-challenge-refresh aria-label="Обновить проверочный вопрос">↻</button>
    </div>
    <label class="audit-form-honey" aria-hidden="true">Компания<input name="company" tabindex="-1" autocomplete="off"></label>
    <label class="audit-form-consent"><input type="checkbox" name="privacy_consent" value="yes" required><span>Согласен на обработку данных по <a href="/privacy/">политике конфиденциальности</a>.</span></label>
    <button class="btn btn-primary audit-form-submit" type="submit">Получить бесплатный аудит</button>
    <p class="audit-form-status" data-audit-form-status role="status" aria-live="polite"></p>
    <p class="audit-form-note">Аудит отправлю на указанный email. Телефон нужен для уточняющих вопросов; повторные и подозрительные заявки автоматически ограничиваются.</p>
  </form>`;
}
function renderAuditCtaSection({
  id,
  eyebrow = 'Бесплатный аудит',
  title,
  text,
  bullets = [],
  service,
  source,
  secondaryHref = site.telegram,
  secondaryText = 'Написать в Telegram'
}) {
  const bulletHtml = bullets.length ? `<ul class="audit-cta-list">${bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '';
  const secondary = secondaryHref ? `<a class="audit-cta-link" href="${htmlHref(secondaryHref)}">${escapeHtml(secondaryText)}</a>` : '';
  return section(id, title, `<div class="audit-cta-card">
    <div class="audit-cta-copy">
      <p class="tag">${escapeHtml(eyebrow)}</p>
      <p class="lead">${escapeHtml(text)}</p>
      ${bulletHtml}
      ${secondary ? `<p class="audit-cta-secondary">${secondary}</p>` : ''}
    </div>
    ${renderFreeAuditForm({ source, service })}
  </div>`, 'section-container');
}


function renderProofMetricsSection(id, title, metrics, lead = '') {
  const items = (Array.isArray(metrics) ? metrics : []).filter(Boolean).slice(0, 4);
  if (!items.length) return '';
  const cards = items.map((item, index) => {
    const value = typeof item === 'string' ? item : item.value;
    const label = typeof item === 'string' ? '' : item.label;
    return `<article class="proof-item infographic-metric"><span class="infographic-index">${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(value || '')}</strong>${label ? `<span>${escapeHtml(label)}</span>` : ''}</article>`;
  }).join('');
  return section(id, title, `${lead ? `<p class="lead">${escapeHtml(lead)}</p>` : ''}<div class="proof-strip infographic-proof-strip">${cards}</div>`, 'section-container');
}

function renderInfographicTimeline({ id, title, lead = '', items = [], cta = null, variant = 'default' }) {
  const normalized = (Array.isArray(items) ? items : []).filter(Boolean).slice(0, 4).map((item, index) => {
    if (typeof item === 'string') return { title: `Шаг ${index + 1}`, text: item };
    return { title: item.title || item.label || `Шаг ${index + 1}`, text: item.text || item.fit || item.period || '' };
  });
  if (!normalized.length) return '';
  const steps = normalized.map((item, index) => `<article class="visual-step" data-step="${String(index + 1).padStart(2, '0')}"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join('');
  const ctaHtml = cta && cta.href && cta.text ? `<p><a class="btn btn-primary" href="${htmlHref(cta.href)}">${escapeHtml(cta.text)}</a></p>` : '';
  return section(id, title, `${lead ? `<p class="lead">${escapeHtml(lead)}</p>` : ''}<div class="visual-timeline visual-timeline-${escapeHtml(variant)}">${steps}</div>${ctaHtml}`, 'section-container');
}


function renderInlineInfographic(item) {
  if (!item || !item.src) return '';
  const width = Number(item.width) || 720;
  const height = Number(item.height) || 520;
  return `<figure class="inline-infographic"><img src="${htmlHref(item.src)}" width="${width}" height="${height}" loading="lazy" alt="${escapeHtml(item.alt || '')}">${item.caption ? `<figcaption>${escapeHtml(item.caption)}</figcaption>` : ''}</figure>`;
}

const PAGE_VISUALS = {
  services: {
    src: '/assets/images/seo-services-system-v2.webp',
    alt: 'Визуальная система SEO-услуг: техническая база, структура спроса, локальная видимость, аналитика и конверсия'
  },
  cases: {
    src: '/assets/images/seo-case-evidence-v2.webp',
    alt: 'Сравнение состояния сайта до и после SEO-работ: от разрозненных сигналов к измеримой системе роста'
  },
  journal: {
    src: '/assets/images/seo-journal-research-v2.webp',
    alt: 'Система SEO-исследования: вопрос, сбор данных, анализ связей, вывод и практическое внедрение'
  },
  strategy: {
    src: '/assets/images/seo-strategy-roadmap-v2.webp',
    alt: 'Карта SEO-стратегии: диагностика, приоритеты, ресурсы, внедрение и измеримый результат'
  }
};

function renderEditorialVisual({ id, eyebrow, title, text, visual, steps = [], outcome = '', tone = 'dark' }) {
  if (!visual || !visual.src) return '';
  const normalizedSteps = (Array.isArray(steps) ? steps : [])
    .map((item) => typeof item === 'string' ? item : item && (item.title || item.label || item.heading || item.text))
    .filter(Boolean)
    .slice(0, 4);
  const flow = normalizedSteps.length
    ? `<div class="editorial-visual-flow">${normalizedSteps.map((step, index) => `<span><b>${String(index + 1).padStart(2, '0')}</b>${escapeHtml(truncateText(step, 52))}</span>`).join('')}</div>`
    : '';
  const outcomeHtml = outcome ? `<div class="editorial-visual-outcome"><small>Выход системы</small><strong>${escapeHtml(outcome)}</strong></div>` : '';
  return `<section id="${escapeHtml(id)}" class="section page-visual-section"><div class="section-container"><div class="editorial-visual editorial-visual-${escapeHtml(tone)}"><figure><img src="${htmlHref(visual.src)}" width="1536" height="1024" loading="lazy" decoding="async" alt="${escapeHtml(visual.alt || '')}"><figcaption>${escapeHtml(eyebrow || 'Визуальная карта')}</figcaption></figure><div class="editorial-visual-copy"><p class="tag">${escapeHtml(eyebrow || 'Визуальная карта')}</p><h2>${escapeHtml(title || '')}</h2>${text ? `<p>${escapeHtml(text)}</p>` : ''}${flow}${outcomeHtml}</div></div></div></section>`;
}

function getServiceVisualOutcome(slug) {
  const route = normalizeInternalHtmlPath(slug || '');
  if (route === '/services/') return 'Понятный приоритет работ';
  if (route.includes('internet-magazina')) return 'Заказы из каталога';
  if (route.includes('novogo-sayta')) return 'Первые поисковые сигналы';
  if (route.includes('technical-seo-audit')) return 'Чистая индексация';
  if (route.includes('seo-audit')) return 'Приоритетный план';
  if (route.includes('seo-strategy')) return 'Roadmap на 60–90 дней';
  if (route.includes('seo-consulting')) return 'Проверенное решение';
  if (route.includes('geo-aeo-ai-seo')) return 'Видимость в нейроответах';
  if (route.includes('local-seo-spb')) return 'Локальные обращения';
  if (route.includes('seo-for-b2b')) return 'Квалифицированные лиды';
  if (route.includes('seo-for-small-business')) return 'Заявки в рамках бюджета';
  return 'Заявки из поиска';
}

function renderServiceEditorialVisual(page, pillars, processSteps) {
  const steps = pillars.length ? pillars : processSteps.map((text, index) => ({ title: `Этап ${index + 1}`, text }));
  return renderEditorialVisual({
    id: 'service-visual-system',
    eyebrow: 'Система услуги',
    title: 'Как отдельные работы складываются в результат',
    text: 'Не набор разрозненных действий, а последовательность: открыть сайт поиску, связать страницы со спросом, усилить доверие и измерить влияние на обращения.',
    visual: PAGE_VISUALS.services,
    steps,
    outcome: getServiceVisualOutcome(page.slug)
  });
}

function renderCaseBeforeAfter(caseItem) {
  const detailTables = caseItem && caseItem.caseDetail && caseItem.caseDetail.tables && Array.isArray(caseItem.caseDetail.tables.items)
    ? caseItem.caseDetail.tables.items
    : [];
  const sourceTables = [
    ...(Array.isArray(caseItem && caseItem.resultTables) ? caseItem.resultTables : []),
    ...detailTables
  ];
  const table = sourceTables.find((item) => Array.isArray(item && item.columns) && item.columns.length >= 3 && Array.isArray(item.rows) && item.rows.length);
  if (!table) return '';
  const columns = table.columns.map((item) => String(item || '').toLowerCase());
  const beforeFound = columns.findIndex((item) => item.includes('было'));
  const beforeIndex = beforeFound >= 0 ? beforeFound : 1;
  const afterFound = columns.findIndex((item) => item.includes('стало'));
  const afterIndex = afterFound >= 0 ? afterFound : 2;
  const rows = table.rows.filter((row) => Array.isArray(row) && row[beforeIndex] && row[afterIndex]).slice(0, 4);
  if (!rows.length) return '';
  const cards = rows.map((row, index) => `<article class="qual-before-after-card"><span class="qual-before-after-index">${String(index + 1).padStart(2, '0')}</span><h3>${escapeHtml(row[0] || 'Изменение')}</h3><div class="qual-before-after-pair"><div><small>До</small><p>${escapeHtml(row[beforeIndex])}</p></div><i aria-hidden="true">→</i><div><small>После</small><p>${escapeHtml(row[afterIndex])}</p></div></div></article>`).join('');
  return section('case-before-after', 'До и после: что изменилось', `<p class="lead">Сравнение показывает не только итоговую цифру, но и переход от исходного ограничения к новой рабочей системе.</p><div class="qual-before-after-grid">${cards}</div>`, 'section-container');
}

function renderCaseEditorialVisual(caseItem) {
  const metrics = (Array.isArray(caseItem.metricsPreview) && caseItem.metricsPreview.length ? caseItem.metricsPreview : (Array.isArray(caseItem.metrics) ? caseItem.metrics : [])).slice(0, 3);
  return renderEditorialVisual({
    id: 'case-editorial-visual',
    eyebrow: 'Логика трансформации',
    title: 'От исходной точки к подтверждённому эффекту',
    text: 'Визуальная карта помогает быстро увидеть логику кейса до погружения в подробности и длинные списки внедрений.',
    visual: PAGE_VISUALS.cases,
    steps: ['Стартовая точка', 'Диагностика', 'Внедрение', 'Измерение'],
    outcome: metrics[0] || caseItem.duration || 'Зафиксированный результат'
  });
}

function renderSimpleEditorialVisual(page, cards, blocks) {
  const route = normalizeInternalHtmlPath(page.slug || '');
  if (route === '/privacy/' || route === '/terms/') return '';
  const cardSteps = (Array.isArray(cards) ? cards : []).map((item) => item.title).filter(Boolean);
  const blockSteps = (Array.isArray(blocks) ? blocks : []).map((item) => item.title).filter(Boolean);
  const configs = {
    '/about/': {
      eyebrow: 'Экспертная система',
      title: 'Как опыт превращается в решения для проекта',
      text: 'Контекст бизнеса, профессиональная диагностика и контроль внедрения остаются в одной связке.',
      visual: PAGE_VISUALS.strategy,
      outcome: 'Один ответственный за логику роста'
    },
    '/process/': {
      eyebrow: 'Рабочий цикл',
      title: 'От диагностики до следующего цикла роста',
      text: 'Этапы собраны в повторяемую систему, где каждое внедрение проходит проверку качества и измерение.',
      visual: PAGE_VISUALS.strategy,
      outcome: 'Управляемый процесс без хаоса'
    },
    '/report-example/': {
      eyebrow: 'Карта отчёта',
      title: 'Сигнал превращается в вывод и задачу',
      text: 'Отчёт нужен не для объёма, а чтобы быстро понять причину, приоритет и следующее действие.',
      visual: PAGE_VISUALS.cases,
      outcome: 'План внедрений с приоритетами'
    },
    '/results/': {
      eyebrow: 'Система измерения',
      title: 'Видимость — только начало цепочки результата',
      text: 'Позиции и трафик связываются с качеством переходов, обращениями и бизнес-ограничениями.',
      visual: PAGE_VISUALS.cases,
      outcome: 'Проверяемая бизнес-метрика'
    }
  };
  const config = configs[route];
  if (!config) return '';
  return renderEditorialVisual({
    id: 'page-editorial-visual',
    ...config,
    steps: [...cardSteps, ...blockSteps]
  });
}


function formatCaseMetrics(metrics) {
  return (Array.isArray(metrics) ? metrics : []).filter(Boolean).slice(0, 3);
}

function parseEvidenceMetric(value) {
  const text = String(value || '')
    .replace(/по ЛО/gi, 'по Ленинградской области')
    .replace(/в первых 3 позициях выдачи/gi, 'в топ-3 поисковой выдачи')
    .replace(/в первой позиции выдачи/gi, 'на первой позиции выдачи')
    .replace(/\s+/g, ' ')
    .trim();

  const dual = text.match(/^(\d+)%\s+в топ-3 поисковой выдачи\s+и\s+(\d+)%\s+на первой позиции выдачи$/i);
  if (dual) {
    return {
      type: 'dual',
      values: [
        { value: Number(dual[1]), display: dual[1] + '%', label: 'в топ-3 выдачи' },
        { value: Number(dual[2]), display: dual[2] + '%', label: 'на 1-й позиции' }
      ]
    };
  }

  const trend = text.match(/^(.*?)(\d[\d\s.,]*)\s*(₽)?\s*→\s*(\d[\d\s.,]*)\s*(₽)?(.*)$/);
  if (trend) {
    const from = Number(trend[2].replace(/\s/g, '').replace(',', '.')) || 0;
    const to = Number(trend[4].replace(/\s/g, '').replace(',', '.')) || 0;
    const max = Math.max(from, to, 1);
    const unit = trend[3] || trend[5] || '';
    return {
      type: 'trend',
      label: (trend[1] + trend[6]).trim() || 'Изменение показателя',
      values: [
        { display: trend[2].trim() + (unit ? ' ' + unit : ''), label: 'До', width: Math.max(8, Math.round(from / max * 100)) },
        { display: trend[4].trim() + (unit ? ' ' + unit : ''), label: 'После', width: Math.max(8, Math.round(to / max * 100)) }
      ]
    };
  }

  const percent = text.match(/^([+\-]?\d+)%\s*(.*)$/);
  if (percent) {
    const numeric = Math.abs(Number(percent[1])) || 0;
    return { type: numeric <= 100 ? 'share' : 'number', display: percent[1] + '%', label: percent[2].trim() || 'зафиксированный результат', width: Math.min(100, numeric) };
  }

  const number = text.match(/^([+\-]?\d[\d\s.,]*)\s+(.*)$/);
  if (number) return { type: 'number', display: number[1].trim(), label: number[2].trim() };
  return { type: 'text', display: 'Результат', label: text };
}

function metricBar(width, className = '') {
  const safeWidth = Math.max(0, Math.min(100, Number(width) || 0));
  return '<span class="evidence-bar ' + className + '" aria-hidden="true"><i style="--evidence-width:' + safeWidth + '%"></i></span>';
}

function renderHomeCaseMetric(metric, index) {
  const item = parseEvidenceMetric(metric);
  const indexLabel = String(index + 1).padStart(2, '0');
  if (item.type === 'dual') {
    return '<article class="home-case-kpi home-case-kpi-dual"><span class="home-case-kpi-index">' + indexLabel + '</span><div class="home-case-kpi-split">' + item.values.map((entry) => '<div><strong>' + escapeHtml(entry.display) + '</strong><p>' + escapeHtml(entry.label) + '</p>' + metricBar(entry.value) + '</div>').join('') + '</div></article>';
  }
  const chart = item.type === 'share' ? metricBar(item.width) : '';
  return '<article class="home-case-kpi"><span class="home-case-kpi-index">' + indexLabel + '</span><strong class="home-case-kpi-value">' + escapeHtml(item.display) + '</strong><p class="home-case-kpi-label">' + escapeHtml(item.label) + '</p>' + chart + '</article>';
}

function renderCaseEvidence(metrics) {
  const cards = (Array.isArray(metrics) ? metrics : []).filter(Boolean).slice(0, 4).map((metric, index) => {
    const item = parseEvidenceMetric(metric);
    const indexLabel = String(index + 1).padStart(2, '0');
    if (item.type === 'trend') {
      return '<article class="case-evidence-card case-evidence-before-after"><span class="case-evidence-index">' + indexLabel + '</span><p class="case-evidence-title">' + escapeHtml(item.label) + '</p><div class="before-after-chart">' + item.values.map((entry) => '<div><span><small>' + escapeHtml(entry.label) + '</small><strong>' + escapeHtml(entry.display) + '</strong></span>' + metricBar(entry.width, entry.label === 'После' ? 'is-after' : 'is-before') + '</div>').join('') + '</div></article>';
    }
    if (item.type === 'dual') {
      return '<article class="case-evidence-card"><span class="case-evidence-index">' + indexLabel + '</span><p class="case-evidence-title">Распределение запросов</p><div class="before-after-chart">' + item.values.map((entry) => '<div><span><small>' + escapeHtml(entry.label) + '</small><strong>' + escapeHtml(entry.display) + '</strong></span>' + metricBar(entry.value, 'is-after') + '</div>').join('') + '</div></article>';
    }
    const chart = item.type === 'share' ? metricBar(item.width, 'is-after') : '';
    return '<article class="case-evidence-card"><span class="case-evidence-index">' + indexLabel + '</span><strong class="case-evidence-value">' + escapeHtml(item.display) + '</strong><p class="case-evidence-title">' + escapeHtml(item.label) + '</p>' + chart + '</article>';
  }).join('');
  return cards ? '<div class="case-evidence-grid" aria-label="Измеримые результаты кейса">' + cards + '</div>' : '';
}

function renderHomeCaseShowcase(data) {
  const clients = data.clients || {};
  const indexes = Array.isArray(data.featuredCaseIndexes) && data.featuredCaseIndexes.length ? data.featuredCaseIndexes : [0];
  const caseIndex = Number.isInteger(indexes[0]) ? indexes[0] : 0;
  const item = Array.isArray(casesData) && casesData.length ? (casesData[caseIndex] || casesData[0]) : null;
  if (!item) return '';
  const metrics = formatCaseMetrics(Array.isArray(item.metricsPreview) && item.metricsPreview.length ? item.metricsPreview : item.metrics);
  const href = getCaseHref(item, caseIndex);
  const summary = truncateText(item.shortSummary || item.summary || item.context || item.result || clients.lead || '', 220);
  return section('clients', clients.title || 'Кейс в цифрах', `<div class="home-case-showcase"><div class="home-case-copy content-flow"><p class="tag">Реальный проект</p><h3>${escapeHtml(item.shortTitle || item.title || 'Кейс')}</h3><p>${escapeHtml(summary)}</p><p><a class="btn btn-primary" href="${htmlHref(href)}">Смотреть кейс</a> <a class="btn" href="/cases/">Все кейсы</a></p></div><div class="home-case-metrics" aria-label="Ключевые цифры кейса">${metrics.map(renderHomeCaseMetric).join('')}</div></div>`, 'section-container');
}
function renderHomeProcessSection(data) {
  const process = data.process || {};
  const steps = (Array.isArray(process.steps) ? process.steps : []).filter(Boolean).slice(0, 4).map((item, index) => typeof item === 'string' ? { title: `Шаг ${index + 1}`, text: item } : { title: item.title || `Шаг ${index + 1}`, text: item.text || '' });
  const stepsHtml = steps.map((item, index) => `<article class="visual-step" data-step="${String(index + 1).padStart(2, '0')}"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join('');
  const lead = process.lead || 'Работа идёт по четырём этапам: сначала находим потери, затем внедряем только то, что влияет на спрос, доверие и заявки. Здесь же можно оставить сайт на разбор.';
  return section('process', process.title || 'Цикл работы', `<p class="lead">${escapeHtml(lead)}</p>${renderInlineInfographic(process.infographic)}<div class="home-process-layout"><div class="visual-timeline visual-timeline-process">${stepsHtml}</div><aside class="home-process-form content-flow"><p class="tag">Старт без длинного брифа</p><h3>Получить разбор сайта</h3><p>Проверю индексацию, структуру спроса, коммерческие страницы, Яндекс-сервисы и точки, где сайт теряет обращения.</p>${renderFreeAuditForm({ source: 'Главная: цикл работы', service: 'Бесплатный аудит после блока процесса' })}</aside></div>`, 'section-container');
}
function renderSignalArchitecture() {
  return '<div class="signal-architecture" aria-label="Архитектура поисковых сигналов: спрос, техника, контент и GEO/AI сходятся в единую систему роста"><div class="signal-grid"></div><svg class="signal-routes" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="signal-violet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#dbff65"/></linearGradient><filter id="signal-glow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M160 135 C310 135 330 270 500 310"/><path d="M155 485 C310 485 335 360 500 310"/><path d="M840 135 C690 135 670 270 500 310"/><path d="M845 485 C690 485 665 360 500 310"/><path class="signal-output" d="M500 310 C500 425 500 455 500 555"/></svg><div class="signal-node signal-node-demand"><span>01</span><strong>Спрос</strong><small>Что и зачем ищут</small></div><div class="signal-node signal-node-tech"><span>02</span><strong>Техника</strong><small>Доступность и скорость</small></div><div class="signal-node signal-node-content"><span>03</span><strong>Контент</strong><small>Факты и экспертность</small></div><div class="signal-node signal-node-ai"><span>04</span><strong>GEO / AI</strong><small>Ответы и рекомендации</small></div><div class="signal-core"><i></i><span>SYNAPSEE</span><strong>Signal<br>Core</strong><small>единая система</small></div><div class="signal-result"><span>05</span><div><small>Выход системы</small><strong>Выбор → доверие → заявка</strong></div></div><div class="signal-particle p1"></div><div class="signal-particle p2"></div><div class="signal-particle p3"></div><div class="signal-particle p4"></div></div>';
}
function renderHomeAiSearchSection(data) {
  const source = data.aiSearch || {};
  const fallback = ['Яндекс Бизнес: проверяем заполнение услуг, категорий и контактов, а также наличие фото и отзывов.','Яндекс Вебмастер: индексация, региональность, ошибки обхода, качество сниппетов и страницы в поиске.','Карты и справочники: единые адреса, телефоны, график, маршруты и локальные страницы.','Микроразметка: организация, услуги, статьи, вопросы и ответы, хлебные крошки и контакты.','Коммерческие факторы: цены, документы, кейсы, команда, сроки и понятные условия старта.','Страницы под намерения: услуга, регион, стоимость, сравнение, пример результата и следующий шаг.','Материалы для нейроответов: определения, экспертные ответы и источники.','Контроль выдачи: сниппеты, карточки, внешние профили, отзывы и изменения после внедрений.'];
  const items = (Array.isArray(source.items) && source.items.length >= 6 ? source.items : fallback).slice(0, 8);
  const cards = items.map((item, index) => `<article class="geo-check-card"><span>${String(index + 1).padStart(2, '0')}</span><p>${escapeHtml(item)}</p></article>`).join('');
  return section('ai-search', source.title || 'ИИ-видимость, Яндекс и нейроответы на практике', `<p class="lead">${escapeHtml(source.text || 'Готовлю сайт к понятному выбору в поиске: Яндекс, Google, карты, справочники и нейроответы должны видеть одни и те же факты о компании.')}</p>${source.intro ? `<p>${escapeHtml(source.intro)}</p>` : ''}${renderSignalArchitecture()}<div class="geo-checklist content-flow"><h3>Что проверяем и усиливаем</h3><div class="geo-check-grid">${cards}</div></div>${source.final ? `<p>${escapeHtml(source.final)}</p>` : ''}${source.cta ? `<p><a class="btn btn-primary" href="${htmlHref(source.cta.href)}">${escapeHtml(source.cta.text)}</a></p>` : ''}`, 'section-container');
}
function renderHomePricingSection(data) {
  const pricing = data.pricing || {};
  const cards = (Array.isArray(pricing.cards) ? pricing.cards : []).slice(0, 4).map((item, index) => `<article class="pricing-route-card"><span class="price-label">${String(index + 1).padStart(2, '0')}</span><h3>${escapeHtml(item.title || '')}</h3><p>${escapeHtml(item.text || '')}</p></article>`).join('');
  const side = pricing.sidePanel || { title: 'Как не ошибиться с форматом', text: 'Сначала смотрю сайт и ограничения внедрения, затем предлагаю старт: аудит, спринт, ежемесячный рост или экспертное сопровождение.', items: ['Разделяю срочные правки и задачи роста', 'Показываю, где нужен разработчик', 'Фиксирую результат по заявкам, а не по красивому отчёту'] };
  return section('pricing', pricing.title || 'Формат работы, бюджет и первый шаг', `${renderInlineInfographic(pricing.infographic)}<div class="home-pricing-layout"><div class="pricing-route home-pricing-cards">${cards}</div><aside class="home-pricing-side static-info-block content-flow"><p class="tag">Выбор формата</p><h3>${escapeHtml(side.title)}</h3><p>${escapeHtml(side.text)}</p><ul>${(side.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>${pricing.cta ? `<p><a class="btn btn-primary" href="${htmlHref(pricing.cta.href)}">${escapeHtml(pricing.cta.text)}</a></p>` : ''}</aside></div>`, 'section-container');
}
function renderServicesDirectorySection(data, pillars, servicePages) {
  const items = (servicePages.length ? servicePages : pillars).filter(Boolean);
  if (!items.length) return '';
  const cards = items.map((item, index) => `<article class="service-directory-card"><span class="price-label">Направление ${String(index + 1).padStart(2, '0')}</span><h3>${item.href ? `<a href="${htmlHref(item.href)}">${escapeHtml(item.title || '')}</a>` : escapeHtml(item.title || '')}</h3><p>${escapeHtml(item.text || '')}</p>${Array.isArray(item.keywords) && item.keywords.length ? `<p class="muted">${item.keywords.map(escapeHtml).join(' · ')}</p>` : ''}${item.href ? `<p><a class="btn" href="${htmlHref(item.href)}">Открыть направление</a></p>` : ''}</article>`).join('');
  return section('service-directory', 'Направления работ и посадочные по задачам', `<p class="lead">Один каталог вместо двух похожих блоков: сразу видно, какая задача решается и куда перейти дальше.</p><div class="service-directory-grid">${cards}</div>`, 'section-container');
}
function renderPricingFormatsSection(data, packages, decisionRows) {
  const cards = packages.map((item, index) => `<article class="pricing-format-card${item.featured ? ' is-featured' : ''}${item.advisory ? ' is-advisory' : ''}"><span class="price-label">${escapeHtml(item.label || `Формат ${index + 1}`)}</span><h3>${escapeHtml(item.title || '')}</h3><p class="pricing-route-price">${escapeHtml(item.price || 'по задаче')}</p><p class="muted">${escapeHtml(item.period || '')}</p><p>${escapeHtml(item.text || '')}</p>${Array.isArray(item.features) && item.features.length ? `<ul>${item.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join('')}</ul>` : ''}${item.fit ? `<p class="pricing-fit"><strong>Подходит, если:</strong> ${escapeHtml(item.fit)}</p>` : ''}</article>`).join('');
  const rows = decisionRows.length ? `<div class="pricing-choice-strip">${decisionRows.map((row) => `<article><h3>${escapeHtml(row.situation || '')}</h3><p><strong>${escapeHtml(row.format || '')}</strong></p><p>${escapeHtml(row.reason || '')}</p></article>`).join('')}</div>` : '';
  return section('pricing-formats', data.packagesTitle || 'Форматы сотрудничества и когда их выбирать', `<p class="lead">Формат определяет текущая задача: нет ясной картины — нужен аудит; есть одна критичная зона — спринт; нужен стабильный рост — ежемесячная работа; есть внутренняя команда — экспертная поддержка.</p><div class="pricing-formats-layout">${cards}</div>${rows}`, 'section-container');
}
function renderPricingContactStrip() {
  const phoneHref = `tel:${String(site.phone || '').replace(/[^+\d]/g, '')}`;
  return section('pricing-contacts', 'Контакты для старта', `<div class="contact-repeat-grid"><article class="static-info-block"><h3>Мессенджер</h3><p>Пришлите сайт, регион и задачу. Отвечу, с какого формата разумнее начать.</p><p><a class="btn btn-primary" href="${htmlHref(site.telegram || '/contact/')}">Написать в мессенджер</a></p></article><article class="static-info-block"><h3>Телефон</h3><p>Если удобнее обсудить голосом, можно сразу обозначить нишу, город и текущую проблему.</p><p><a class="btn" href="${htmlHref(phoneHref)}">${escapeHtml(site.phone || 'Позвонить')}</a></p></article><article class="static-info-block"><h3>Форма</h3><p>Форма выше даёт достаточно данных для первичного разбора: сайт, имя, email и телефон.</p><p><a class="btn" href="/contact/#free-audit">Открыть контакты</a></p></article></div>`, 'section-container');
}

function renderCasesSnapshotSection(cases) {
  const items = (Array.isArray(cases) ? cases : []).slice(0, 3);
  if (!items.length) return '';
  const cards = items.map((item, index) => {
    const metrics = (Array.isArray(item.metricsPreview) && item.metricsPreview.length ? item.metricsPreview : (Array.isArray(item.metrics) ? item.metrics : [])).slice(0, 3);
    const href = getCaseHref(item, index);
    return `<article class="case-snapshot-card"><p class="muted">${escapeHtml(item.category || 'Кейс')}</p><h3><a href="${htmlHref(href)}">${escapeHtml(item.shortTitle || item.title || 'Кейс')}</a></h3><div class="snapshot-metrics">${metrics.map((metric) => `<span>${escapeHtml(metric)}</span>`).join('')}</div><div class="mini-path" aria-label="Логика кейса"><span>Старт</span><span>Работа</span><span>Эффект</span></div></article>`;
  }).join('');
  return section('cases-snapshot', 'Кейсы в одном экране', `<p class="lead">Чтобы не читать всё подряд, сначала видно нишу, ключевые цифры и путь от проблемы к результату.</p><div class="case-snapshot-grid">${cards}</div>`, 'section-container');
}

function firstCaseAction(caseItem) {
  if (Array.isArray(caseItem.actionsList) && caseItem.actionsList.length) return caseItem.actionsList[0];
  const audits = caseItem.audits || {};
  for (const key of Object.keys(audits)) {
    if (Array.isArray(audits[key]) && audits[key].length) return audits[key][0];
  }
  return caseItem.implementation || caseItem.task || '';
}

function hasCaseDomainMismatch(caseItem, text) {
  const source = String((caseItem.category || "") + " " + (caseItem.shortSummary || "")).toLowerCase();
  const target = String(text || "").toLowerCase();
  const sourceLooksMedical = ["клиник", "медицин", "пациент", "врач"].some((token) => source.includes(token));
  const targetLooksEducation = ["education", "enrollment", "абитуриент", "обуч", "зачислен"].some((token) => target.includes(token));
  return sourceLooksMedical && targetLooksEducation;
}

function safeCaseInfographicText(caseItem, text, fallback) {
  const value = String(text || "").trim();
  if (!value || hasCaseDomainMismatch(caseItem, value)) return fallback;
  return value;
}

function renderCaseVisualSummary(caseItem) {
  const metrics = (Array.isArray(caseItem.metricsPreview) && caseItem.metricsPreview.length ? caseItem.metricsPreview : (Array.isArray(caseItem.metrics) ? caseItem.metrics : [])).slice(0, 3);
  const startText = safeCaseInfographicText(caseItem, caseItem.shortSummary || caseItem.context, "Определили исходную точку, спрос, ограничения роста и ближайшие потери в пути до заявки.");
  const actionText = safeCaseInfographicText(caseItem, firstCaseAction(caseItem), "Усилили структуру страниц, доверие, контентные связи и путь пользователя до заявки.");
  const takeawayText = safeCaseInfographicText(caseItem, caseItem.takeaway || caseItem.result, "Лучше всего сработала связка диагностики, внедрения и контроля коммерческого результата.");
  const nodes = [
    { label: "Старт", title: caseItem.category || "Контекст", text: startText },
    { label: "Действие", title: "Что сделали", text: actionText },
    { label: "Эффект", title: metrics[0] || "Результат", text: metrics.slice(1).join(" · ") || caseItem.result || "Зафиксировали измеримый эффект." },
    { label: "Вывод", title: "Что можно повторить", text: takeawayText }
  ];
  const html = nodes.map((node, index) => '<article class="case-flow-node" data-step="' + String(index + 1).padStart(2, "0") + '"><p class="tag">' + escapeHtml(node.label) + '</p><h3>' + escapeHtml(node.title) + '</h3><p>' + escapeHtml(node.text) + '</p></article>').join('');
  return section('case-infographic', 'Кейс в одном экране', renderCaseEvidence(metrics) + '<div class="case-flow-infographic">' + html + '</div>', 'section-container');
}

function renderPricingRouteSection(packages) {
  const items = (Array.isArray(packages) ? packages : []).slice(0, 4);
  if (!items.length) return '';
  const html = items.map((item, index) => `<article class="pricing-route-card${item.featured ? ' is-featured' : ''}${item.advisory ? ' is-advisory' : ''}"><span class="price-label">${escapeHtml(item.label || `Формат ${index + 1}`)}</span><h3>${escapeHtml(item.title || '')}</h3><p class="pricing-route-price">${escapeHtml(item.price || 'по задаче')}</p><p class="muted">${escapeHtml(item.period || item.fit || '')}</p></article>`).join('');
  return section('pricing-route', 'Как выбрать формат', `<p class="lead">Сначала отделяем диагностический старт, спринт, постоянный рост и экспертное сопровождение команды.</p><div class="pricing-route">${html}</div>`, 'section-container');
}


function renderLanding(page) {
  const data = page.landing;
  const heroVisual = data.hero.visual && data.hero.visual.src
    ? `<figure class="hero-editorial-visual"><img src="${htmlHref(data.hero.visual.src)}" width="${Number(data.hero.visual.width) || 1200}" height="${Number(data.hero.visual.height) || 900}" fetchpriority="high" decoding="async" alt="${escapeHtml(data.hero.visual.alt || '')}"><figcaption><strong>2 проекта максимум</strong><span>Лично: стратегия → внедрение → измерение</span></figcaption></figure>`
    : `<div class="capacity-console"><div class="console-top"><span>Личная загрузка</span><span class="console-live">приём проектов</span></div><div class="capacity-number"><strong>2</strong><span>проекта<br>максимум</span></div><div class="capacity-slots"><span class="is-active">Проект 01</span><span>Место 02</span></div></div>`;
  const hero = `<section id="hero" class="section hero hero-growth"><div class="hero-orb hero-orb-a"></div><div class="hero-orb hero-orb-b"></div><div class="section-container hero-growth-grid"><div class="content-flow hero-growth-copy">${data.hero.label ? `<p class="hero-kicker"><span></span>${escapeHtml(data.hero.label)}</p>` : ''}<h1>${escapeHtml(data.hero.title)}</h1><p class="lead">${escapeHtml(data.hero.lead)}</p><div class="hero-actions"><a class="btn btn-primary" href="${htmlHref(data.hero.ctaPrimary.href)}">${escapeHtml(data.hero.ctaPrimary.text)} <span aria-hidden="true">↗</span></a><a class="btn btn-ghost" href="${htmlHref(data.hero.ctaSecondary.href)}">${escapeHtml(data.hero.ctaSecondary.text)}</a></div><div class="hero-trust">${(data.hero.stats || []).map((stat, index) => `<span><b>${String(index + 1).padStart(2, '0')}</b>${escapeHtml(stat)}</span>`).join('')}</div><p class="hero-micro">${escapeHtml(data.hero.micro)}</p></div><div class="hero-growth-visual">${heroVisual}</div></div><div class="hero-marquee" aria-label="Направления работы"><div>СТРАТЕГИЯ <i>✦</i> ТЕХНИЧЕСКОЕ SEO <i>✦</i> КОНТЕНТ <i>✦</i> АНАЛИТИКА <i>✦</i> GEO / AI <i>✦</i> ВНЕДРЕНИЯ <i>✦</i> СТРАТЕГИЯ <i>✦</i> ТЕХНИЧЕСКОЕ SEO <i>✦</i></div></div></section>`;
  const comparisonData = data.comparison || {};
  const comparisonRows = Array.isArray(comparisonData.rows) ? comparisonData.rows : [];
  const comparison = comparisonRows.length ? section('comparison', comparisonData.title || 'Не агентский конвейер', `<p class="lead">${escapeHtml(comparisonData.lead || '')}</p><div class="comparison-board"><div class="comparison-head"><span>Что происходит с проектом</span><span>Типичное агентство</span><span>Synapsee</span></div>${comparisonRows.map((row) => `<div class="comparison-row"><strong>${escapeHtml(row.label || '')}</strong><span class="comparison-agency">${escapeHtml(row.agency || '')}</span><span class="comparison-synapsee">${escapeHtml(row.synapsee || '')}</span></div>`).join('')}</div><p class="comparison-note">${escapeHtml(comparisonData.note || '')}</p>`, 'section-container') : '';
  const eeat = section('eeat', data.eeat.title, `${data.eeat.lead ? `<p class="lead">${escapeHtml(data.eeat.lead)}</p>` : ''}<div class="cards-grid grid-1-2-3">${data.eeat.cards.map((item) => `<article class="card"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join('')}</div><p><a class="btn" href="${htmlHref(data.eeat.cta.href)}">${escapeHtml(data.eeat.cta.text)}</a></p>`, 'section-container');
  const aiSearch = renderHomeAiSearchSection(data);
  const results = section('results', data.results.title, `${data.results.lead ? `<p class="lead">${escapeHtml(data.results.lead)}</p>` : ''}<div class="cards-grid grid-1-2-3">${data.results.cards.map((item) => `<article class="card"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join('')}</div><p><a class="btn" href="${htmlHref(data.results.cta.href)}">${escapeHtml(data.results.cta.text)}</a></p>`, 'section-container');
  const process = renderHomeProcessSection(data);
  const pricing = renderHomePricingSection(data);
  const clients = renderHomeCaseShowcase(data);
  const reviewItems = Array.isArray(data.reviews && data.reviews.items) ? data.reviews.items : [];
  const reviews = reviewItems.length ? section('reviews', data.reviews.title || 'Как Synapsee работает с доверием', `<div class="cards-grid grid-1-2-3">${reviewItems.map((item) => `<article class="card"><h3>${escapeHtml(item.title || '')}</h3><p>${escapeHtml(item.text || '')}</p></article>`).join('')}</div>`, 'section-container') : '';
  const teamCards = Array.isArray(data.team && data.team.cards) ? data.team.cards : [];
  const teamIntroLines = Array.isArray(data.team && data.team.introLines) ? data.team.introLines : [];
  const teamBody = `<div class="content-flow team-section-flow">${data.team && data.team.lead ? `<p class="lead">${escapeHtml(data.team.lead)}</p>` : ''}${teamIntroLines.length ? `<div class="team-intro static-info-block">${teamIntroLines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}</div>` : ''}${teamCards.length ? `<div class="cards-grid grid-1-2-3">${teamCards.map((card) => `<article class="card"><h3>${escapeHtml(card.title || '')}</h3><p>${escapeHtml(card.text || '')}</p></article>`).join('')}</div>` : ''}</div>`;
  const team = section('team', (data.team && data.team.title) || 'Сильная экспертиза без агентской потери скорости', teamBody, 'section-container');
  const faq = section('faq', data.faqTitle || 'Вопросы и ответы', `<div class="cards-grid grid-1-2-3">${data.faq.map((item) => `<article class="card"><details><summary>${escapeHtml(item.q)}</summary><p>${escapeHtml(item.a)}</p></details></article>`).join('')}</div>`, 'section-container');
  const contact = section('contact', data.finalCta.title, `${data.finalCta.text ? `<p class="lead">${escapeHtml(data.finalCta.text)}</p>` : ''}<div class="static-info-block home-final-cta-card"><div class="home-final-cta-copy"><ul>${data.finalCta.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul></div><div class="home-final-cta-action-wrap"><a class="btn btn-primary home-final-cta-action" href="${htmlHref(data.finalCta.cta.href)}">${escapeHtml(data.finalCta.cta.text)}</a></div></div>${data.finalCta.micro ? `<p class="muted">${escapeHtml(data.finalCta.micro)}</p>` : ''}`, 'section-container');
  const proofMetrics = renderProofMetricsSection(
    'proof-metrics',
    data.proofTitle || 'Сначала доказательства, потом детали',
    data.proofMetrics || [],
    'Показываю не только процесс, но и тип результата, который уже получался в проектах.'
  );
  const auditCta = renderAuditCtaSection({
    id: 'home-audit',
    title: 'Разбор сайта для выбора формата',
    text: 'Оставьте сайт, имя, email и телефон — я посмотрю, где сейчас теряются заявки из поиска и какой формат SEO-работы имеет смысл первым.',
    bullets: ['Что мешает индексации и росту страниц', 'Какие разделы стоит усилить под спрос', 'Нужен ли проекту SEO, GEO/AI или техническая база'],
    service: 'Первичный SEO-аудит сайта',
    source: 'Главная страница'
  });
  return hero + comparison + proofMetrics + eeat + results + clients + process + aiSearch + pricing + auditCta + team + faq + contact;
}
function renderBlogIndex(page) {
  const categories = [...new Set(blog.map((post) => post.category).filter(Boolean))];
  const hero = `<section class="section"><div class="section-container content-flow"><h1>${escapeHtml(page.h1)}</h1><p class="lead">${escapeHtml(page.lead)}</p></div></section>`;
  const visual = renderEditorialVisual({
    id: 'blog-editorial-visual',
    eyebrow: 'Карта знаний',
    title: 'От вопроса к практическому решению',
    text: 'Материалы сгруппированы вокруг реальных задач: найти причину, проверить гипотезу и превратить вывод в действие.',
    visual: PAGE_VISUALS.journal,
    steps: categories,
    outcome: 'Решение, которое можно внедрить',
    tone: 'light'
  });
  const cards = `<section class="section"><div class="section-container"><div class="cards-grid grid-1-2-3">${blog.map((post) => `<article class="card"><p class="muted">${escapeHtml(post.category)} · ${escapeHtml(post.date)}</p><h2><a href="/blog/${escapeHtml(post.slug)}/">${escapeHtml(post.title)}</a></h2><p>${escapeHtml(post.lead)}</p></article>`).join('')}</div></div></section>`;
  return hero + visual + cards;
}
function renderLegalInline(value) {
  const input = String(value || '');
  const pattern = /\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^)\s]+)\)/g;
  let result = '';
  let cursor = 0;
  let match;
  while ((match = pattern.exec(input)) !== null) {
    result += escapeHtml(input.slice(cursor, match.index));
    result += `<a href="${escapeHtml(match[2])}">${escapeHtml(match[1])}</a>`;
    cursor = match.index + match[0].length;
  }
  return result + escapeHtml(input.slice(cursor));
}
function renderPrivacyPolicy(page) {
  const lines = privacyPolicyText.replace(/\r\n?/g, '\n').split('\n');
  const title = lines.shift() || page.h1 || page.title || '';
  let body = '';
  let sectionOpen = false;
  let sectionIndex = 0;
  lines.forEach((line) => {
    if (!line.trim()) return;
    const heading = line.match(/^(\d+)\.\s+/);
    if (heading) {
      if (sectionOpen) body += '</section>';
      sectionIndex += 1;
      const id = `privacy-section-${heading[1] || sectionIndex}`;
      body += `<section class="privacy-policy-section" aria-labelledby="${id}"><h2 id="${id}">${renderLegalInline(line)}</h2>`;
      sectionOpen = true;
      return;
    }
    body += `<p>${renderLegalInline(line)}</p>`;
  });
  if (sectionOpen) body += '</section>';
  return `<section class="section privacy-shell"><div class="section-container"><article class="privacy-document"><h1>${renderLegalInline(title)}</h1>${body}</article></div></section>`;
}
function renderSimplePage(page) {
  if (normalizeInternalHtmlPath(page.slug || '') === '/privacy/') return renderPrivacyPolicy(page);
  const cards = Array.isArray(page.cards) ? page.cards : [];
  const blocks = Array.isArray(page.sections) ? page.sections : [];
  const renderCardGrid = (items) => `<div class="cards-grid grid-1-2-3">${items.map((c) => `<article class="card"><h3>${escapeHtml(c.title || '')}</h3><p>${escapeHtml(c.text || '')}</p>${Array.isArray(c.items) && c.items.length ? `<ul>${c.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}${c.href ? `<p><a href="${htmlHref(c.href)}">${escapeHtml(c.cta || 'Подробнее')}</a></p>` : ''}</article>`).join('')}</div>`;
  const introCards = cards.length ? renderCardGrid(cards) : '';
  const sectionHtml = blocks.map((block, index) => {
    const id = String(block.id || `simple-section-${index + 1}`).trim();
    const lead = block.lead ? `<p class="lead">${escapeHtml(block.lead)}</p>` : '';
    const text = block.text ? `<p>${escapeHtml(block.text)}</p>` : '';
    const list = Array.isArray(block.items) && block.items.length ? `<div class="card"><ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : '';
    const grid = Array.isArray(block.cards) && block.cards.length ? renderCardGrid(block.cards) : '';
    const cta = block.cta && block.cta.href && block.cta.text ? `<p><a class="btn btn-primary" href="${htmlHref(block.cta.href)}">${escapeHtml(block.cta.text)}</a>${block.secondaryCta && block.secondaryCta.href && block.secondaryCta.text ? ` <a class="btn" href="${htmlHref(block.secondaryCta.href)}">${escapeHtml(block.secondaryCta.text)}</a>` : ''}</p>` : '';
    return section(id, block.title || '', `${lead}${text}${grid}${list}${cta}`, 'section-container');
  }).join('');
  const finalCta = page.finalCta && page.finalCta.href && page.finalCta.text ? `<p><a class="btn btn-primary" href="${htmlHref(page.finalCta.href)}">${escapeHtml(page.finalCta.text)}</a></p>` : '';
  const pageVisual = renderSimpleEditorialVisual(page, cards, blocks);
  return `<section class="section hero"><div class="section-container content-flow"><h1>${escapeHtml(page.h1 || page.title || '')}</h1><p class="lead">${escapeHtml(page.lead || '')}</p>${introCards}${finalCta}</div></section>${pageVisual}${sectionHtml}`;
}
function renderContactPage(page) {
  const data = page.contact || {};
  const hero = data.hero || {};
  const firstMessage = data.firstMessage || {};
  const briefCards = data.briefCards || {};
  const startFlow = data.startFlow || {};
  const fit = data.fit || {};
  const finalCta = data.finalCta || {};
  const responseBlocks = Array.isArray(data.responseBlocks) ? data.responseBlocks : [];

  const firstItems = Array.isArray(firstMessage.items) ? firstMessage.items : [];
  const briefItems = Array.isArray(briefCards.cards) ? briefCards.cards : [];
  const flowSteps = Array.isArray(startFlow.steps) ? startFlow.steps : [];
  const fitGood = Array.isArray(fit.good) ? fit.good : [];
  const fitBad = Array.isArray(fit.bad) ? fit.bad : [];
  const regions = (asArray(site.areaServed).length ? asArray(site.areaServed) : ['Санкт-Петербург', 'Ленинградская область']).join(', ');
  const responseBlocksSection = responseBlocks.length ? section('contact-expectations', data.responseBlocksTitle || 'Как устроен первый контакт', `<div class="cards-grid grid-1-2-3">${responseBlocks.map((item) => `<article class="card"><h3>${escapeHtml(item.title || '')}</h3><p>${escapeHtml(item.text || '')}</p>${Array.isArray(item.items) && item.items.length ? `<ul>${item.items.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>` : ''}${item.href ? `<p><a href="${htmlHref(item.href)}">${escapeHtml(item.cta || 'Открыть')}</a></p>` : ''}</article>`).join('')}</div>`, 'section-container') : '';

  return `<section class="section hero"><div class="section-container content-flow"><h1>${escapeHtml(page.h1 || page.title || '')}</h1><p class="lead">${escapeHtml(page.lead || '')}</p><p><a class="btn btn-primary" href="${htmlHref((hero.primaryCta && hero.primaryCta.href) || site.telegram)}">${escapeHtml((hero.primaryCta && hero.primaryCta.text) || 'Открыть контакты')}</a> <a class="btn" href="${htmlHref((hero.secondaryCta && hero.secondaryCta.href) || `mailto:${site.email}`)}">${escapeHtml((hero.secondaryCta && hero.secondaryCta.text) || site.email || 'Почта')}</a></p><p class="muted">${escapeHtml(hero.micro || '')}</p></div></section>
  ${renderEditorialVisual({
    id: 'contact-editorial-visual',
    eyebrow: 'Первый контакт',
    title: 'От ссылки на сайт к понятному первому шагу',
    text: 'Короткий маршрут показывает, какие вводные нужны и что вы получите в ответ без длинного брифа.',
    visual: PAGE_VISUALS.strategy,
    steps: ['Сайт и регион', 'Цель бизнеса', 'Проверка сигналов', 'Приоритет действий'],
    outcome: '3–5 практичных выводов'
  })}
  ${section('local-presence', 'Регион и формат работы', `<div class="cards-grid grid-1-2-3"><article class="card"><h3>Рабочий регион</h3><p>${escapeHtml(regions)}</p></article><article class="card"><h3>Контакт</h3><p>Мессенджер: <a href="${htmlHref(site.telegram)}">${escapeHtml(site.telegramHandle || site.telegram || 'Открыть чат')}</a></p><p>Телефон: <a href="${htmlHref(`tel:${String(site.phone || '').replace(/[^+\d]/g, '')}`)}">${escapeHtml(site.phone || '')}</a></p></article><article class="card"><h3>Формат</h3><p>Первичный разбор проходит удалённо: сайт, ниша, регион, цель и ограничения внедрения.</p></article></div>`, 'section-container')}
  ${responseBlocksSection}
  ${renderAuditCtaSection({
    id: 'free-audit',
    title: 'Заявка на бесплатный аудит',
    text: 'Форма без длинного брифа: сайт нужен для проверки, email — чтобы отправить аудит, телефон и имя — чтобы быстро задать уточняющий вопрос и задать уточняющий вопрос.',
    bullets: ['Проверю технические ограничения', 'Посмотрю структуру спроса и посадочные страницы', 'Подскажу первый практичный шаг'],
    service: 'Бесплатный аудит сайта',
    source: 'Страница контактов',
    secondaryText: 'Сразу написать в мессенджер'
  })}
  ${renderInfographicTimeline({
    id: 'audit-answer-map',
    title: 'Что будет в первом ответе',
    lead: 'Разбор не превращается в длинный отчёт: сначала только практичные сигналы, которые помогают решить, двигаться дальше или нет.',
    items: [
      { title: 'Техника', text: 'Индексация, скорость, служебные файлы, канонические адреса и критичные ошибки.' },
      { title: 'Спрос', text: 'Какие страницы уже могут забирать спрос, а где не хватает структуры.' },
      { title: 'Конверсия', text: 'Что мешает доверию и заявке: оффер, доказательства, форма, мобильный путь.' },
      { title: 'Следующий шаг', text: 'Что выбрать: аудит, спринт, ежемесячный рост или экспертную поддержку.' }
    ],
    variant: 'audit'
  })}


  ${section('first-message', firstMessage.title || 'Что прислать в первом сообщении', `<div class="card"><ul>${firstItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`, 'section-container')}
  ${section('short-brief', briefCards.title || 'Вводные для старта', `<div class="cards-grid grid-1-2-3">${briefItems.map((item) => `<article class="card"><h3>${escapeHtml(item.title || '')}</h3><p>${escapeHtml(item.text || '')}</p></article>`).join('')}</div>`, 'section-container')}
  ${section('start', startFlow.title || 'Как проходит старт', `<div class="cards-grid grid-1-2-4">${flowSteps.map((step, index) => `<article class="card"><p class="muted">Шаг ${index + 1}</p><p>${escapeHtml(step)}</p></article>`).join('')}</div>`, 'section-container')}
  ${section('fit', fit.title || 'Когда лучше писать', `<div class="cards-grid grid-1-2-3"><article class="card"><h3>${escapeHtml(fit.goodTitle || 'Подходит, если')}</h3><ul>${fitGood.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article><article class="card"><h3>${escapeHtml(fit.badTitle || 'Не подходит, если')}</h3><ul>${fitBad.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article></div>`, 'section-container')}
  ${section('contact-cta', finalCta.title || 'Обсудить проект', `<div class="card"><p>${escapeHtml(finalCta.text || '')}</p><p><a class="btn btn-primary" href="${htmlHref((finalCta.primaryCta && finalCta.primaryCta.href) || site.telegram)}">${escapeHtml((finalCta.primaryCta && finalCta.primaryCta.text) || 'Мессенджер')}</a> <a class="btn" href="${htmlHref((finalCta.secondaryCta && finalCta.secondaryCta.href) || `mailto:${site.email}`)}">${escapeHtml((finalCta.secondaryCta && finalCta.secondaryCta.text) || site.email || 'Почта')}</a></p></div>`, 'section-container')}`;
}
function renderServicesOfferPage(page) {
  const data = page.servicesOffer || {};
  const hero = data.hero || {};
  const pillars = Array.isArray(data.pillars) ? data.pillars : [];
  const packages = Array.isArray(data.packages) ? data.packages : [];
  const servicePages = Array.isArray(data.servicePages) ? data.servicePages : [];
  const faq = Array.isArray(data.faq) ? data.faq : [];
  const included = data.included || {};
  const processSteps = Array.isArray(data.process && data.process.steps) ? data.process.steps : [];
  const fit = data.fit || {};
  const finalCta = data.finalCta || {};
  const isServicesHub = normalizeInternalHtmlPath(page.slug || '') === '/services/';
  const servicePagesSection = (!isServicesHub && servicePages.length) ? section('service-pages', data.servicePagesTitle || 'Посадочные по задачам', `${data.servicePagesLead ? `<p class="lead">${escapeHtml(data.servicePagesLead)}</p>` : ''}<div class="cards-grid grid-1-2-3">${servicePages.map((item) => `<article class="card"><h3><a href="${htmlHref(item.href || '/services/')}">${escapeHtml(item.title || '')}</a></h3><p>${escapeHtml(item.text || '')}</p>${Array.isArray(item.keywords) && item.keywords.length ? `<p class="muted">${item.keywords.map(escapeHtml).join(' · ')}</p>` : ''}</article>`).join('')}</div>`, 'section-container') : '';
  const faqSection = faq.length ? section('service-faq', data.faqTitle || 'Вопросы по услуге', `<div class="cards-grid grid-1-2-3">${faq.map((item) => `<article class="card"><details><summary>${escapeHtml(item.q || '')}</summary><p>${escapeHtml(item.a || '')}</p></details></article>`).join('')}</div>`, 'section-container') : '';

  return `<section id="services-hero" class="section hero page-hero-services"><div class="section-container content-flow"><h1>${escapeHtml(hero.title || page.h1 || page.title || '')}</h1><p class="lead">${escapeHtml(hero.lead || page.lead || '')}</p><p><a class="btn btn-primary" href="${htmlHref((hero.primaryCta && hero.primaryCta.href) || site.telegram)}">${escapeHtml((hero.primaryCta && hero.primaryCta.text) || 'Открыть контакты')}</a> <a class="btn" href="${htmlHref((hero.secondaryCta && hero.secondaryCta.href) || '/contact/')}">${escapeHtml((hero.secondaryCta && hero.secondaryCta.text) || 'Открыть контакты')}</a></p><p class="muted">${escapeHtml(hero.micro || '')}</p></div></section>
  ${renderServiceEditorialVisual(page, pillars, processSteps)}
  ${isServicesHub ? renderServicesDirectorySection(data, pillars, servicePages) : section('service-pillars', data.pillarsTitle || 'Ключевые направления', `<div class="cards-grid grid-1-2-3">${pillars.map((item) => `<article class="card"><h3>${item.href ? `<a href="${htmlHref(item.href)}">${escapeHtml(item.title || '')}</a>` : escapeHtml(item.title || '')}</h3><p>${escapeHtml(item.text || '')}</p></article>`).join('')}</div>`, 'section-container')}
  ${servicePagesSection}
  ${renderInfographicTimeline({
    id: 'service-map',
    title: 'Карта направлений работы',
    lead: 'Услуги связаны в одну систему: техническая база открывает индексацию, страницы забирают спрос, удобство доводит до заявки, нейроответы усиливают доверие.',
    items: pillars.slice(0, 4),
    variant: 'services'
  })}

  ${section('engagement-models', data.packagesTitle || 'Форматы сотрудничества', `<div class="cards-grid grid-1-2-4">${packages.map((item) => `<article class="card"><h3>${escapeHtml(item.title || '')}</h3><p>${escapeHtml(item.text || '')}</p></article>`).join('')}</div>`, 'section-container')}
  ${section('scope', data.scopeTitle || 'Что входит в работу и что согласуем отдельно', `<div class="cards-grid grid-1-2-2"><article class="card"><h3>${escapeHtml(included.inTitle || 'Входит в работу')}</h3><ul>${(included.in || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article><article class="card"><h3>${escapeHtml(included.outTitle || 'Отдельно согласуем')}</h3><ul>${(included.out || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article></div>`, 'section-container')}
  ${section('process', (data.process && data.process.title) || 'Процесс запуска', `<div class="cards-grid grid-1-2-3">${processSteps.map((item, index) => `<article class="card"><p class="muted">Шаг ${index + 1}</p><p>${escapeHtml(item)}</p></article>`).join('')}</div>`, 'section-container')}
  ${renderAuditCtaSection({
    id: 'service-audit',
    title: 'Понять, какая услуга нужна сайту',
    text: 'Если непонятно, начинать с SEO, технической базы, удобства сайта или ИИ-видимости, бесплатный аудит быстро покажет приоритет.',
    bullets: ['Выявлю узкое место в текущей системе роста', 'Отделю срочные правки от задач на развитие', 'Подскажу формат работ без навязывания лишнего'],
    service: 'Подбор SEO-услуги после аудита',
    source: 'Страница услуг'
  })}

  ${section('fit-filter', fit.title || 'Кому подходит формат', `<div class="cards-grid grid-1-2-2"><article class="card"><h3>${escapeHtml(fit.goodTitle || 'Подходит, если')}</h3><ul>${(fit.good || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article><article class="card"><h3>${escapeHtml(fit.badTitle || 'Не подходит, если')}</h3><ul>${(fit.bad || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article></div>`, 'section-container')}
  ${faqSection}
  ${section('final-cta', finalCta.title || 'Следующий шаг', `<div class="card"><p>${escapeHtml(finalCta.text || '')}</p><p><a class="btn btn-primary" href="${htmlHref((finalCta.primaryCta && finalCta.primaryCta.href) || site.telegram)}">${escapeHtml((finalCta.primaryCta && finalCta.primaryCta.text) || 'Открыть контакты')}</a> <a class="btn" href="${htmlHref((finalCta.secondaryCta && finalCta.secondaryCta.href) || '/contact/')}">${escapeHtml((finalCta.secondaryCta && finalCta.secondaryCta.text) || 'Открыть контакты')}</a></p></div>`, 'section-container')}`;
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
    const anchor = normalizeCaseAnchor(item, index);
    const previewLead = item.shortSummary || item.summary || item.context || item.start || '';
    const previewPoints = Array.isArray(item.metricsPreview) && item.metricsPreview.length
      ? item.metricsPreview.slice(0, 3)
      : (Array.isArray(item.actionsList) ? item.actionsList.slice(0, 2) : []);
    const detailHref = getCaseHref(item, index);
    return `<article class="card case-list-card" id="${escapeHtml(anchor)}"><p class="muted">${escapeHtml(item.category || item.niche || '')}</p><h3>${escapeHtml(item.shortTitle || item.title || '')}</h3>${item.clientName ? `<p><strong>Клиент:</strong> ${escapeHtml(item.clientName)}</p>` : ''}${previewLead ? `<p>${escapeHtml(previewLead)}</p>` : ''}${previewPoints.length ? `<ul>${previewPoints.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>` : ''}${item.duration ? `<p class="muted"><strong>Срок / формат:</strong> ${escapeHtml(item.duration)}</p>` : ''}<p class="case-list-card-cta"><a class="btn btn-primary case-list-card-link" href="${htmlHref(detailHref)}">Смотреть кейс</a></p></article>`;
  }).join('')}</div>`, 'section-container');

  const evaluationSection = section('cases-evaluation', evaluation.title || 'Как оцениваем результат', `<p class="lead">${escapeHtml(evaluation.lead || 'Оцениваем не по одной метрике, а по связке продуктовых и коммерческих сигналов.')}</p><div class="cards-grid grid-1-2-3">${(evaluation.dimensions || []).map((item) => `<article class="card"><h3>${escapeHtml(item.title || '')}</h3><p>${escapeHtml(item.text || '')}</p></article>`).join('')}</div>`, 'section-container');
  const casesSnapshot = renderCasesSnapshotSection(cases);

  return `<section id="cases-hero" class="section hero page-hero-services"><div class="section-container content-flow"><h1>${escapeHtml(hero.title || page.h1 || page.title || '')}</h1><p class="lead">${escapeHtml(hero.lead || page.lead || '')}</p><p><a class="btn btn-primary" href="${htmlHref((hero.primaryCta && hero.primaryCta.href) || site.telegram)}">${escapeHtml((hero.primaryCta && hero.primaryCta.text) || 'Открыть контакты')}</a> <a class="btn" href="${htmlHref((hero.secondaryCta && hero.secondaryCta.href) || '/contact/')}">${escapeHtml((hero.secondaryCta && hero.secondaryCta.text) || 'Открыть контакты')}</a></p></div></section>
  ${renderEditorialVisual({
    id: 'cases-editorial-visual',
    eyebrow: 'Портфель доказательств',
    title: 'Сначала контекст и измерение, затем вывод',
    text: 'Кейсы читаются как система: исходная проблема, конкретные действия, зафиксированные изменения и ограничения переноса результата.',
    visual: PAGE_VISUALS.cases,
    steps: ['Исходная точка', 'Что изменили', 'Как измерили', 'Что можно повторить'],
    outcome: cases.length + ' подробных кейсов'
  })}
  ${casesSnapshot}
  ${casesSection}
  ${evaluationSection}
  ${section('proof-style', proof.title || 'Как читать эти кейсы', `<div class="static-info-block"><ul>${(proof.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`, 'section-container')}
  ${section('approach-patterns', data.patternsTitle || 'Повторяющиеся подходы', `<div class="cards-grid grid-1-2-3">${patterns.map((item) => `<article class="card"><h3>${escapeHtml(item.title || '')}</h3><p>${escapeHtml(item.text || '')}</p></article>`).join('')}</div>`, 'section-container')}
  ${renderAuditCtaSection({
    id: 'cases-audit',
    title: 'Проверить, какой сценарий похож на ваш сайт',
    text: 'Кейсы помогают сориентироваться, но точный следующий шаг видно только после первичной проверки вашего сайта.',
    bullets: ['Сравню проект с похожими паттернами роста', 'Покажу, где можно получить быстрый эффект', 'Скажу, какой результат реалистично ждать первым'],
    service: 'Аудит сайта после просмотра кейсов',
    source: 'Страница кейсов'
  })}

  ${section('fit-filter', fit.title || 'Кому релевантны кейсы', `<div class="cards-grid grid-1-2-2"><article class="card"><h3>${escapeHtml(fit.goodTitle || 'Релевантно, если')}</h3><ul>${(fit.good || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article><article class="card"><h3>${escapeHtml(fit.badTitle || 'Не стоит переносить напрямую, если')}</h3><ul>${(fit.bad || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article></div>`, 'section-container')}
  ${section('final-cta', finalCta.title || 'Следующий шаг', `<div class="card"><p>${escapeHtml(finalCta.text || '')}</p><p><a class="btn btn-primary" href="${htmlHref((finalCta.primaryCta && finalCta.primaryCta.href) || site.telegram)}">${escapeHtml((finalCta.primaryCta && finalCta.primaryCta.text) || 'Открыть контакты')}</a> <a class="btn" href="${htmlHref((finalCta.secondaryCta && finalCta.secondaryCta.href) || '/contact/')}">${escapeHtml((finalCta.secondaryCta && finalCta.secondaryCta.text) || 'Открыть контакты')}</a></p></div>`, 'section-container')}`;
}

function renderCaseDetailPage(page) {
  const caseIndexRaw = Number(page.caseIndex);
  const caseIndex = Number.isInteger(caseIndexRaw) && caseIndexRaw >= 0 ? caseIndexRaw : 0;
  const caseItem = Array.isArray(casesData) && casesData.length ? casesData[caseIndex] : null;
  if (!caseItem) {
    return `<section class="section"><div class="section-container content-flow"><h1>${escapeHtml(page.h1 || page.title || 'Кейс')}</h1><p class="lead">Кейс временно недоступен.</p><p><a href="/cases/">← Назад к кейсам</a></p></div></section>`;
  }

  const detail = caseItem.caseDetail || {};
  const renderInlineEmphasis = (text) => {
    const safe = escapeHtml(String(text || ''));
    const withStrong = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return withStrong.replace(/\*(.+?)\*/g, '<em>$1</em>');
  };
  const renderListItem = (item) => `<li>${renderInlineEmphasis(item)}</li>`;
  const renderParagraphItems = (items) => (Array.isArray(items) ? items : [])
    .filter(Boolean)
    .map((item) => `<p>${renderInlineEmphasis(item)}</p>`)
    .join('');

  const renderNamedListCard = (title, items) => {
    if (!Array.isArray(items) || !items.length) return '';
    return `<article class="card"><h3>${escapeHtml(title)}</h3><ul>${items.map(renderListItem).join('')}</ul></article>`;
  };
  const renderCaseTable = (table) => {
    const columns = Array.isArray(table.columns) ? table.columns : [];
    const rows = Array.isArray(table.rows) ? table.rows : [];
    if (!columns.length || !rows.length) return '';
    return `<article class="card case-table-card"><h3>${escapeHtml(table.title || 'Таблица')}</h3><div class="case-table-wrap"><table class="case-table"><thead><tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></article>`;
  };
  const proof = detail.proof || {};
  const proofCharts = Array.isArray(proof.charts) ? proof.charts : [];
  let screenshotGallery = Array.isArray(proof.screenshots && proof.screenshots.gallery) ? proof.screenshots.gallery : [];
  if (!screenshotGallery.length) screenshotGallery = discoverCaseScreenshots(caseIndex, caseItem);
  const screenshotList = Array.isArray(proof.screenshots && proof.screenshots.list) ? proof.screenshots.list : [];
  const screenshotsSection = screenshotGallery.length
    ? section(
      'case-project-screenshots',
      proof.title || 'Скриншоты проекта',
      `<div class="case-screenshots-gallery" data-case-screenshots>${screenshotGallery.map((shot, index) => {
        const imageSrc = shot.src || '';
        const imageAlt = shot.alt || `Скриншот проекта ${index + 1}`;
        return `<button class="case-screenshot-card" type="button" data-screenshot-index="${index}" data-screenshot-src="${escapeHtml(imageSrc)}" aria-label="Открыть ${escapeHtml(imageAlt)}"><img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(imageAlt)}" loading="lazy"></button>`;
      }).join('')}</div>
      <div class="case-screenshot-lightbox" data-screenshot-lightbox hidden aria-hidden="true">
        <button class="case-screenshot-lightbox-overlay" type="button" data-lightbox-close aria-label="Закрыть просмотр"></button>
        <div class="case-screenshot-lightbox-dialog" role="dialog" aria-modal="true" aria-label="Просмотр скриншотов проекта">
          <button class="case-screenshot-lightbox-close" type="button" data-lightbox-close aria-label="Закрыть просмотр">×</button>
          <button class="case-screenshot-lightbox-nav case-screenshot-lightbox-prev" type="button" data-lightbox-prev aria-label="Предыдущий скриншот">‹</button>
          <figure class="case-screenshot-lightbox-figure">
            <img data-lightbox-image src="" alt="">
          </figure>
          <button class="case-screenshot-lightbox-nav case-screenshot-lightbox-next" type="button" data-lightbox-next aria-label="Следующий скриншот">›</button>
        </div>
      </div>
      <script>
        (() => {
          const gallery = document.querySelector('[data-case-screenshots]');
          if (!gallery) return;
          const lightbox = document.querySelector('[data-screenshot-lightbox]');
          const imageNode = lightbox ? lightbox.querySelector('[data-lightbox-image]') : null;
          if (!lightbox || !imageNode) return;
          const items = [...gallery.querySelectorAll('[data-screenshot-src]')];
          if (!items.length) return;
          let activeIndex = 0;
          let lastTrigger = null;
          const updateImage = (index) => {
            const nextIndex = (index + items.length) % items.length;
            activeIndex = nextIndex;
            const source = items[nextIndex];
            imageNode.src = source.dataset.screenshotSrc || '';
            imageNode.alt = source.querySelector('img')?.alt || '';
          };
          const openLightbox = (index, trigger) => {
            updateImage(index);
            lightbox.hidden = false;
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.classList.add('lightbox-open');
            lastTrigger = trigger || null;
          };
          const closeLightbox = () => {
            lightbox.hidden = true;
            lightbox.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('lightbox-open');
            if (lastTrigger) lastTrigger.focus();
          };
          items.forEach((item, index) => {
            item.addEventListener('click', () => openLightbox(index, item));
          });
          lightbox.addEventListener('click', (event) => {
            if (event.target.closest('[data-lightbox-close]')) closeLightbox();
          });
          lightbox.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => updateImage(activeIndex - 1));
          lightbox.querySelector('[data-lightbox-next]')?.addEventListener('click', () => updateImage(activeIndex + 1));
          document.addEventListener('keydown', (event) => {
            if (lightbox.hidden) return;
            if (event.key === 'Escape') {
              closeLightbox();
              return;
            }
            if (event.key === 'ArrowLeft') {
              updateImage(activeIndex - 1);
              return;
            }
            if (event.key === 'ArrowRight') {
              updateImage(activeIndex + 1);
            }
          });
        })();
      </script>`,
      'section-container'
    )
    : ((proofCharts.length || screenshotList.length)
      ? section('case-proof', proof.title || 'Графики и скриншоты для proof section', `<div class="cards-grid grid-1-2-2">${proofCharts.length ? `<article class="card"><h3>Графики</h3><div class="content-flow">${proofCharts.map((chart) => `<div><p><strong>${escapeHtml(chart.title || '')}</strong></p><ul>${(Array.isArray(chart.items) ? chart.items : []).map(renderListItem).join('')}</ul></div>`).join('')}</div></article>` : ''}${screenshotList.length ? `<article class="card"><h3>Скриншоты</h3><ul>${screenshotList.map(renderListItem).join('')}</ul></article>` : ''}</div>`, 'section-container')
      : '');
  const metrics = detail.metrics || {};
  const tableBlock = detail.tables || {};
  const tables = Array.isArray(tableBlock.items) ? tableBlock.items : [];
  const namedGroupSection = (id, block, fallbackTitle) => {
    const groups = Array.isArray(block && block.groups) ? block.groups : [];
    const cards = groups.map((group) => renderNamedListCard(group.title || '', group.items || [])).join('');
    if (!cards) return '';
    return section(id, block.title || fallbackTitle, `<div class="cards-grid grid-1-2-2">${cards}</div>`, 'section-container');
  };
  const customSections = Array.isArray(detail.customSections) ? detail.customSections : [];
  const renderCustomSection = (block, index) => {
    const sectionId = String(block.id || '').trim() || `case-custom-${index + 1}`;
    const paragraphsHtml = renderParagraphItems(block.paragraphs);
    const listItems = Array.isArray(block.list) ? block.list : [];
    const listHtml = listItems.length ? `<ul>${listItems.map(renderListItem).join('')}</ul>` : '';
    const paragraphsAfterListHtml = renderParagraphItems(block.paragraphsAfterList);
    const listAfterParagraphsItems = Array.isArray(block.listAfterParagraphs) ? block.listAfterParagraphs : [];
    const listAfterParagraphsHtml = listAfterParagraphsItems.length ? `<ul>${listAfterParagraphsItems.map(renderListItem).join('')}</ul>` : '';
    const flow = Array.isArray(block.flow) ? block.flow : [];
    const flowHtml = flow.map((item) => {
      if (!item || typeof item !== 'object') return '';
      if (item.type === 'paragraph') return `<p>${renderInlineEmphasis(item.text || '')}</p>`;
      if (item.type === 'list') {
        const items = Array.isArray(item.items) ? item.items : [];
        return items.length ? `<ul>${items.map(renderListItem).join('')}</ul>` : '';
      }
      if (item.type === 'table' && item.table) return renderCaseTable(item.table);
      return '';
    }).join('');
    const subsections = Array.isArray(block.subsections) ? block.subsections : [];
    const subsectionsHtml = subsections
      .map((sub) => {
        const subFlow = Array.isArray(sub.flow) ? sub.flow : [];
        const subFlowHtml = subFlow.map((item) => {
          if (!item || typeof item !== 'object') return '';
          if (item.type === 'paragraph') return `<p>${renderInlineEmphasis(item.text || '')}</p>`;
          if (item.type === 'list') {
            const items = Array.isArray(item.items) ? item.items : [];
            return items.length ? `<ul>${items.map(renderListItem).join('')}</ul>` : '';
          }
          if (item.type === 'table' && item.table) return renderCaseTable(item.table);
          return '';
        }).join('');
        const subParagraphs = renderParagraphItems(sub.paragraphs);
        const subListItems = Array.isArray(sub.list) ? sub.list : [];
        const subListHtml = subListItems.length ? `<ul>${subListItems.map(renderListItem).join('')}</ul>` : '';
        const subParagraphsAfterList = renderParagraphItems(sub.paragraphsAfterList);
        const subListAfterParagraphsItems = Array.isArray(sub.listAfterParagraphs) ? sub.listAfterParagraphs : [];
        const subListAfterParagraphsHtml = subListAfterParagraphsItems.length ? `<ul>${subListAfterParagraphsItems.map(renderListItem).join('')}</ul>` : '';
        const subTableHtml = sub.table ? renderCaseTable(sub.table) : '';
        if (!subFlowHtml && !subParagraphs && !subListHtml && !subParagraphsAfterList && !subListAfterParagraphsHtml && !subTableHtml && !sub.title) return '';
        return `<article class="case-subsection-card content-flow"><h3>${renderInlineEmphasis(sub.title || '')}</h3>${subFlowHtml || `${subParagraphs}${subListHtml}${subParagraphsAfterList}${subListAfterParagraphsHtml}`}${subTableHtml}</article>`;
      })
      .join('');
    const tableHtml = block.table ? renderCaseTable(block.table) : '';
    const paragraphsAfterSubsectionsHtml = renderParagraphItems(block.paragraphsAfterSubsections);
    const subsectionsTitleHtml = block.subsectionsTitle ? `<h3>${renderInlineEmphasis(block.subsectionsTitle)}</h3>` : '';
    const blockBody = `<div class="card content-flow">${flowHtml || `${paragraphsHtml}${listHtml}${paragraphsAfterListHtml}${listAfterParagraphsHtml}`}${subsectionsTitleHtml}${subsectionsHtml ? `<div class="case-subsections">${subsectionsHtml}</div>` : ''}${tableHtml}${paragraphsAfterSubsectionsHtml}</div>`;
    return section(sectionId, block.title || '', blockBody, 'section-container');
  };

  const hero = detail.hero || {};
  const introBodyParagraphs = Array.isArray(detail.introBodyParagraphs) ? detail.introBodyParagraphs : [];
  const introParagraphs = Array.isArray(hero.introParagraphs) && hero.introParagraphs.length
    ? hero.introParagraphs
    : [hero.lead || ''].filter(Boolean);
  const heroIntroHtml = introParagraphs
    .map((text, index) => `<p${index === 0 ? ' class="lead"' : ''}>${renderInlineEmphasis(text)}</p>`)
    .join('');
  const introBodySection = introBodyParagraphs.length
    ? `<section id="case-intro" class="section"><div class="section-container"><div class="card content-flow">${introBodyParagraphs.map((text) => `<p>${renderInlineEmphasis(text)}</p>`).join('')}</div></div></section>`
    : '';
  const heroMetaHtml = hero.showMeta === false
    ? ''
    : `<p><strong>${escapeHtml(hero.clientLabel || 'Клиент')}:</strong> ${escapeHtml(caseItem.clientName || 'Под NDA')}</p><p><strong>${escapeHtml(hero.categoryLabel || 'Категория')}:</strong> ${escapeHtml(caseItem.category || '')}</p>`;
  const heroSection = `<section id="case-hero" class="section hero"><div class="section-container content-flow">${hero.eyebrow ? `<p class="muted">${escapeHtml(hero.eyebrow)}</p>` : ''}<h1>${renderInlineEmphasis(hero.title || caseItem.shortTitle || page.h1 || page.title || '')}</h1>${heroIntroHtml}${heroMetaHtml}</div></section>`;
  const caseEditorialSection = renderCaseEditorialVisual(caseItem);
  const visualSummarySection = renderCaseVisualSummary(caseItem);
  const beforeAfterSection = renderCaseBeforeAfter(caseItem);

  if (customSections.length) {
    const finalBlockFlow = Array.isArray(detail.finalBlock && detail.finalBlock.flow) ? detail.finalBlock.flow : [];
    const finalBlockFlowHtml = finalBlockFlow.map((item) => {
      if (!item || typeof item !== 'object') return '';
      if (item.type === 'paragraph') return `<p>${renderInlineEmphasis(item.text || '')}</p>`;
      if (item.type === 'list') {
        const items = Array.isArray(item.items) ? item.items : [];
        return items.length ? `<ul>${items.map(renderListItem).join('')}</ul>` : '';
      }
      if (item.type === 'table' && item.table) return renderCaseTable(item.table);
      return '';
    }).join('');
    const finalBlockParagraphs = renderParagraphItems(detail.finalBlock && detail.finalBlock.paragraphs);
    const finalBlockList = Array.isArray(detail.finalBlock && detail.finalBlock.list) ? detail.finalBlock.list : [];
    const finalBlockListHtml = finalBlockList.length ? `<ul>${finalBlockList.map(renderListItem).join('')}</ul>` : '';
    const finalSubsections = Array.isArray(detail.finalBlock && detail.finalBlock.subsections) ? detail.finalBlock.subsections : [];
    const finalSubsectionsHtml = finalSubsections
      .map((sub) => {
        const paragraphs = renderParagraphItems(sub && sub.paragraphs);
        const listItems = Array.isArray(sub && sub.list) ? sub.list : [];
        const listHtml = listItems.length ? `<ul>${listItems.map(renderListItem).join('')}</ul>` : '';
        if (!paragraphs && !listHtml) return '';
        return `<article class="case-subsection-card content-flow"><h3>${renderInlineEmphasis((sub && sub.title) || '')}</h3>${paragraphs}${listHtml}</article>`;
      })
      .join('');
    const customFinalBlock = (detail.finalBlock && (detail.finalBlock.text || finalBlockParagraphs || finalBlockListHtml || finalBlockFlowHtml || finalSubsectionsHtml))
      ? `<section id="case-final-block" class="section"><div class="section-container content-flow">${detail.finalBlock.title ? `<h2>${escapeHtml(detail.finalBlock.title)}</h2>` : ''}<div class="card content-flow">${detail.finalBlock.text ? `<p>${escapeHtml(detail.finalBlock.text)}</p>` : ''}${finalBlockFlowHtml || `${finalBlockParagraphs}${finalBlockListHtml}`}${finalSubsectionsHtml ? `<div class="case-subsections">${finalSubsectionsHtml}</div>` : ''}</div></div></section>`
      : '';
    return `${heroSection}
    ${caseEditorialSection}
    ${introBodySection}
    ${visualSummarySection}
    ${beforeAfterSection}
    ${customSections.map(renderCustomSection).join('')}
    ${screenshotsSection}
    ${customFinalBlock}
    <section id="case-cta" class="section"><div class="section-container content-flow"><p><a class="btn" href="/cases/">← Назад к кейсам</a> <a class="btn btn-primary" href="/contact/#free-audit">Получить бесплатный аудит</a></p></div></section>`;
  }

  return `${heroSection}
  ${caseEditorialSection}
  ${introBodySection}
  ${visualSummarySection}
  ${beforeAfterSection}
  ${Array.isArray(detail.premiumResults) && detail.premiumResults.length ? section('case-key-results', 'Ключевые результаты', `<div class="cards-grid grid-1-2-2">${detail.premiumResults.map((card) => `<article class="card case-premium-result-card"><h3>${escapeHtml(card.title || '')}</h3><ul>${(Array.isArray(card.items) ? card.items : []).map(renderListItem).join('')}</ul></article>`).join('')}</div>`, 'section-container') : ''}
  ${(detail.context && (detail.context.text || (Array.isArray(detail.context.list) && detail.context.list.length))) ? section('case-context', detail.context.title || 'Контекст и стартовая точка', `<div class="card">${detail.context.text ? `<p>${escapeHtml(detail.context.text)}</p>` : ''}${Array.isArray(detail.context.list) && detail.context.list.length ? `<ul>${detail.context.list.map(renderListItem).join('')}</ul>` : ''}</div>`, 'section-container') : ''}
  ${(detail.startingBase && Array.isArray(detail.startingBase.items) && detail.startingBase.items.length) ? section('case-starting-base', detail.startingBase.title || 'База на старте', `<div class="card"><ul>${detail.startingBase.items.map(renderListItem).join('')}</ul></div>`, 'section-container') : ''}
  ${(detail.businessProblem && Array.isArray(detail.businessProblem.items) && detail.businessProblem.items.length) ? section('case-business-problem', detail.businessProblem.title || 'Проблема бизнеса', `<div class="card">${detail.businessProblem.lead ? `<p>${escapeHtml(detail.businessProblem.lead)}</p>` : ''}${detail.businessProblem.listTitle ? `<p><strong>${escapeHtml(detail.businessProblem.listTitle)}</strong></p>` : ''}<ul>${detail.businessProblem.items.map(renderListItem).join('')}</ul></div>`, 'section-container') : ''}
  ${(detail.taskBlock && detail.taskBlock.text) ? section('case-task', detail.taskBlock.title || 'Задача', `<div class="card"><p>${escapeHtml(detail.taskBlock.text)}</p></div>`, 'section-container') : ''}
  ${(detail.goals && Array.isArray(detail.goals.items) && detail.goals.items.length) ? section('case-goals', detail.goals.title || 'Задача проекта', `<div class="card"><ul>${detail.goals.items.map(renderListItem).join('')}</ul></div>`, 'section-container') : ''}
  ${namedGroupSection('case-audits', detail.audits, 'Что было сделано: аудиты')}
  ${(detail.actions && Array.isArray(detail.actions.items) && detail.actions.items.length) ? section('case-actions', detail.actions.title || 'Что сделали', `<div class="card"><ul>${detail.actions.items.map(renderListItem).join('')}</ul></div>`, 'section-container') : ''}
  ${namedGroupSection('case-strengthening', detail.strengthening, 'Усилили сайт по ключевым направлениям')}
  ${namedGroupSection('case-scaling', detail.scaling, 'Как был масштабирован проект после работы агентства')}
  ${(detail.implementation && detail.implementation.text) ? section('case-implementation', detail.implementation.title || 'Внедрение', `<div class="card"><p>${escapeHtml(detail.implementation.text)}</p></div>`, 'section-container') : ''}
  ${(detail.result && detail.result.lead) ? section('case-result', detail.result.title || 'Результат', `<div class="card"><p class="case-result-lead">${escapeHtml(detail.result.lead)}</p></div>`, 'section-container') : ''}
  ${section('case-metrics', metrics.title || 'Метрики и подтверждение', `<div class="card">${Array.isArray(metrics.items) && metrics.items.length ? `<ul>${metrics.items.map(renderListItem).join('')}</ul>` : '<p>Публичные абсолютные цифры не раскрываются; эффект подтверждён в рабочей отчётности.</p>'}</div>`, 'section-container')}
  ${(detail.growth && Array.isArray(detail.growth.items) && detail.growth.items.length) ? section('case-growth', detail.growth.title || 'Как вырос бизнес', `<div class="card"><ul>${detail.growth.items.map(renderListItem).join('')}</ul></div>`, 'section-container') : ''}
  ${tables.length ? section('case-tables', tableBlock.title || 'Таблицы результатов', `<div class="cards-grid${tableBlock.stacked ? ' case-tables-stack' : ''}">${tables.map(renderCaseTable).join('')}</div>`, 'section-container') : ''}
  ${screenshotsSection}
  ${(detail.duration && detail.duration.text) ? section('case-duration', detail.duration.title || 'Срок и формат работы', `<div class="card"><p>${escapeHtml(detail.duration.text)}</p></div>`, 'section-container') : ''}
  ${(detail.evidence && (detail.evidence.text || caseItem.evidence)) ? section('case-evidence', detail.evidence.title || 'Подтверждение', `<div class="card"><p>${escapeHtml(buildCaseEvidenceText({ evidence: detail.evidence.text || caseItem.evidence }))}</p></div>`, 'section-container') : ''}
  ${(detail.takeaway && detail.takeaway.text) ? section('case-takeaway', detail.takeaway.title || 'Вывод', `<div class="card"><p>${escapeHtml(detail.takeaway.text)}</p></div>`, 'section-container') : ''}
  ${(detail.finalBlock && detail.finalBlock.text) ? `<section id="case-final-block" class="section"><div class="section-container content-flow">${detail.finalBlock.title ? `<h2>${escapeHtml(detail.finalBlock.title)}</h2>` : ''}<div class="card"><p>${escapeHtml(detail.finalBlock.text)}</p></div></div></section>` : ''}
  <section id="case-cta" class="section"><div class="section-container content-flow"><p><a class="btn" href="/cases/">← Назад к кейсам</a> <a class="btn btn-primary" href="/contact/#free-audit">Получить бесплатный аудит</a></p></div></section>`;
}
function renderJournalIndex(page) {
  const data = page.journal || {};
  const heroData = data.hero || {};
  const topics = Array.isArray(data.topics) ? data.topics : [];
  const readingPaths = Array.isArray(data.readingPaths) ? data.readingPaths : [];
  const principles = Array.isArray(data.principles) ? data.principles : [];
  const finalCta = data.finalCta || {};
  const posts = Array.isArray(journalPosts) ? journalPosts : [];
  const topicMap = new Map(topics.map((topic) => [topic.id || topic.slug || '', topic]));
  const hero = `<section class="section hero page-hero-journal"><div class="section-container content-flow"><h1>${escapeHtml(page.h1 || 'Журнал')}</h1><p class="lead">${escapeHtml(page.lead || '')}</p><p>${escapeHtml(heroData.text || '')}</p><p><a class="btn btn-primary" href="${htmlHref((heroData.primaryCta && heroData.primaryCta.href) || site.telegram)}">${escapeHtml((heroData.primaryCta && heroData.primaryCta.text) || 'Открыть контакты')}</a> <a class="btn" href="${htmlHref((heroData.secondaryCta && heroData.secondaryCta.href) || '/contact/')}">${escapeHtml((heroData.secondaryCta && heroData.secondaryCta.text) || 'Открыть контакты')}</a></p></div></section>`;
  const journalVisual = renderEditorialVisual({
    id: 'journal-editorial-visual',
    eyebrow: 'Редакционная карта',
    title: 'Вопрос → данные → вывод → внедрение',
    text: 'Каждая тема строится вокруг практической задачи и помогает перейти от понимания причины к проверяемому действию.',
    visual: PAGE_VISUALS.journal,
    steps: topics,
    outcome: posts.length + ' материалов в журнале',
    tone: 'light'
  });
  const topicButtons = `<div class="journal-filter" data-journal-filter><button class="is-active" type="button" data-topic-filter="all">Все темы</button>${topics.map((topic) => `<button type="button" data-topic-filter="${escapeHtml(topic.id || topic.slug || '')}">${escapeHtml(topic.title || '')}</button>`).join('')}</div>`;
  const postsSection = section('journal-posts', data.archiveTitle || 'Свежие материалы по SEO и поисковой видимости', `${topicButtons}<div class="cards-grid grid-1-2-3 journal-post-grid" data-journal-list>${posts.map((post) => { const topicId = post.topic || post.theme || 'search'; const topic = topicMap.get(topicId); return `<article class="card journal-post-card" data-topic="${escapeHtml(topicId)}"><p class="muted">${escapeHtml((topic && topic.title) || post.topicLabel || 'Материал')} · ${escapeHtml(post.date || '')}</p><h3><a href="/journal/${escapeHtml(post.slug || '')}/">${escapeHtml(post.title || '')}</a></h3><p>${escapeHtml(post.excerpt || '')}</p><p><a class="btn" href="/journal/${escapeHtml(post.slug || '')}/">Читать материал</a></p></article>`; }).join('')}</div><p class="journal-empty" data-journal-empty hidden>По этой теме материалы появятся после следующего обновления.</p><script>(() => { const root = document.querySelector('[data-journal-filter]'); const list = document.querySelector('[data-journal-list]'); const empty = document.querySelector('[data-journal-empty]'); if (!root || !list) return; const cards = [...list.querySelectorAll('[data-topic]')]; root.addEventListener('click', (event) => { const button = event.target.closest('[data-topic-filter]'); if (!button) return; const topic = button.dataset.topicFilter; root.querySelectorAll('button').forEach((item) => item.classList.toggle('is-active', item === button)); let shown = 0; cards.forEach((card) => { const visible = topic === 'all' || card.dataset.topic === topic; card.hidden = !visible; if (visible) shown += 1; }); if (empty) empty.hidden = shown !== 0; }); })();</script>`, 'section-container');
  const topicsSection = section('topics', data.topicsTitle || 'Темы, за которыми следит агентство', `<div class="cards-grid grid-1-2-3">${topics.map((topic) => { const href = topic.href || (topic.postSlug ? `/journal/${topic.postSlug}/` : '/journal/'); return `<article class="card"><h3>${escapeHtml(topic.title || '')}</h3><p>${escapeHtml(topic.text || '')}</p><p class="muted">${escapeHtml(topic.stage || '')}</p><p><a class="btn" href="${htmlHref(href)}">Открыть материал</a></p></article>`; }).join('')}</div>`, 'section-container');
  const readingPathsSection = section('reading-paths', data.readingPathsTitle || 'С чего начать чтение', `<div class="cards-grid grid-1-2-3">${readingPaths.map((item) => `<article class="card"><h3>${escapeHtml(item.title || '')}</h3><p>${escapeHtml(item.text || '')}</p><p class="muted">${escapeHtml(item.audience || '')}</p>${item.href ? `<p><a class="btn" href="${htmlHref(item.href)}">Перейти</a></p>` : ''}</article>`).join('')}</div>`, 'section-container');
  const principlesSection = section('agency-method', data.principlesTitle || 'Как агентство выбирает темы', `<div class="static-info-block"><ul>${principles.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`, 'section-container');
  const finalCtaSection = section('journal-cta', finalCta.title || 'Обсудить вашу ситуацию', `<div class="static-info-block"><p>${escapeHtml(finalCta.text || '')}</p><p><a class="btn btn-primary" href="${htmlHref((finalCta.primaryCta && finalCta.primaryCta.href) || site.telegram)}">${escapeHtml((finalCta.primaryCta && finalCta.primaryCta.text) || 'Открыть контакты')}</a> <a class="btn" href="${htmlHref((finalCta.secondaryCta && finalCta.secondaryCta.href) || '/contact/')}">${escapeHtml((finalCta.secondaryCta && finalCta.secondaryCta.text) || 'Открыть контакты')}</a></p></div>`, 'section-container');
  return hero + journalVisual + postsSection + topicsSection + readingPathsSection + principlesSection + finalCtaSection;
}
function renderJournalPost(post) {
  const blocks = Array.isArray(post.content) ? post.content : [];
  const body = blocks.map((block) => {
    if (block.type === 'heading') return `<h2>${escapeHtml(block.text || '')}</h2>`;
    if (block.type === 'list') return `<ul>${(block.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
    return `<p>${escapeHtml(block.text || '')}</p>`;
  }).join('');
  const headings = blocks.filter((block) => block.type === 'heading').map((block) => block.text).filter(Boolean);
  const visual = renderEditorialVisual({
    id: 'article-editorial-visual',
    eyebrow: 'Карта материала',
    title: 'Как устроен разбор',
    text: 'Сначала виден маршрут мысли, затем можно переходить к подробным объяснениям и спискам.',
    visual: PAGE_VISUALS.journal,
    steps: headings,
    outcome: 'Практический вывод для внедрения',
    tone: 'light'
  });
  return `<section class="section"><div class="section-container content-flow"><p class="muted">${escapeHtml(post.date || '')}</p><h1>${escapeHtml(post.title || '')}</h1><p class="lead">${escapeHtml(post.excerpt || '')}</p></div></section>${visual}<section class="section article-reading-section"><div class="section-container content-flow"><article class="card">${body}</article><p><a href="/journal/">← Вернуться в журнал</a></p></div></section>`;
}
function renderPricingOfferPage(page) {
  const data = page.pricingOffer || {};
  const hero = data.hero || {};
  const model = data.model || {};
  const packages = Array.isArray(data.packages) ? data.packages : [];
  const decisionRows = Array.isArray(data.decisionRows) ? data.decisionRows : [];
  const scope = data.scope || {};
  const steps = Array.isArray(data.steps) ? data.steps : [];
  const faq = Array.isArray(data.faq) ? data.faq : [];
  const finalCta = data.finalCta || {};

  const heroSection = `<section id="pricing-hero" class="section hero page-hero-services"><div class="section-container content-flow"><h1>${escapeHtml(hero.title || page.h1 || page.title || '')}</h1><p class="lead">${escapeHtml(hero.lead || page.lead || '')}</p><p><a class="btn btn-primary" href="${htmlHref((hero.primaryCta && hero.primaryCta.href) || '/contact/')}">${escapeHtml((hero.primaryCta && hero.primaryCta.text) || 'Открыть контакты')}</a> <a class="btn" href="${htmlHref((hero.secondaryCta && hero.secondaryCta.href) || site.telegram)}">${escapeHtml((hero.secondaryCta && hero.secondaryCta.text) || 'Открыть контакты')}</a></p><p class="muted">${escapeHtml(hero.micro || '')}</p></div></section>`;
  const pricingVisual = renderEditorialVisual({
    id: 'pricing-editorial-visual',
    eyebrow: 'Карта выбора',
    title: 'Формат зависит от задачи, а не от красивого тарифа',
    text: 'Диагностика, объём внедрений, скорость изменений и доступ команды определяют разумный способ старта.',
    visual: PAGE_VISUALS.strategy,
    steps: packages,
    outcome: 'Прозрачный формат и бюджет'
  });
  const modelSection = section('pricing-model', model.title || 'Как формируется стоимость', `<div class="card"><p>${escapeHtml(model.text || '')}</p><ul>${(model.points || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`, 'section-container');
  const packagesSection = renderPricingFormatsSection(data, packages, decisionRows);
  const scopeSection = section('pricing-scope', data.scopeTitle || 'Что входит и что считается отдельно', `<div class="cards-grid grid-1-2-3"><article class="card"><h3>${escapeHtml(scope.inTitle || 'Входит')}</h3><ul>${(scope.in || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article><article class="card"><h3>${escapeHtml(scope.outTitle || 'Отдельно')}</h3><ul>${(scope.out || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article></div>`, 'section-container');
  const stepsSection = section('pricing-steps', data.stepsTitle || 'Этапы работы', `<div class="cards-grid grid-1-2-4">${steps.map((item, index) => `<article class="card"><p class="muted">Этап ${index + 1}</p><p>${escapeHtml(item)}</p></article>`).join('')}</div>`, 'section-container');
  const faqSection = section('pricing-faq', data.faqTitle || 'Вопросы и ответы', `<div class="cards-grid grid-1-2-3">${faq.map((item) => `<article class="card"><details><summary>${escapeHtml(item.q || '')}</summary><p>${escapeHtml(item.a || '')}</p></details></article>`).join('')}</div>`, 'section-container');
  const finalCtaSection = section('pricing-cta', finalCta.title || 'Обсудить проект', `<div class="card"><p>${escapeHtml(finalCta.text || '')}</p><p><a class="btn btn-primary" href="${htmlHref((finalCta.primaryCta && finalCta.primaryCta.href) || '/contact/')}">${escapeHtml((finalCta.primaryCta && finalCta.primaryCta.text) || 'Открыть контакты')}</a> <a class="btn" href="${htmlHref((finalCta.secondaryCta && finalCta.secondaryCta.href) || site.telegram)}">${escapeHtml((finalCta.secondaryCta && finalCta.secondaryCta.text) || 'Открыть контакты')}</a></p></div>`, 'section-container');

  const auditCtaSection = renderAuditCtaSection({
    id: 'pricing-audit',
    title: 'Подобрать формат до оплаты',
    text: 'Оставьте сайт — я посмотрю вводные и подскажу, что разумнее: разовый аудит, тестовый месяц, базовый SEO или комплексный рост.',
    bullets: ['Оценю объём первичных работ', 'Пойму, подходит ли отдельный формат за 70 000 ₽', 'Скажу, где бюджет даст больше эффекта'],
    service: 'Подбор тарифа после бесплатного аудита',
    source: 'Страница цены'
  });

  return heroSection + pricingVisual + modelSection + packagesSection + auditCtaSection + renderPricingContactStrip() + scopeSection + stepsSection + faqSection + finalCtaSection;
}
function renderAuthorCard(person) { return `<div class="author-card"><div class="author-avatar">${escapeHtml(person.initials)}</div><div><strong><a href="/authors/${escapeHtml(person.slug)}/">${escapeHtml(person.name)}</a></strong><div class="muted">${escapeHtml(person.role)}</div><p>${escapeHtml(person.expertise)}</p></div></div>`; }
function renderPost(post) {
  const toc = `<nav class="toc"><strong>Содержание</strong><ol>${post.sections.map((s) => `<li><a href="#${escapeHtml(s.id)}">${escapeHtml(s.heading)}</a></li>`).join('')}</ol></nav>`;
  const author = authors.find((a) => a.slug === post.author);
  const expert = authors.find((a) => a.slug === post.expert);
  const body = post.sections.map((s) => `<h2 id="${escapeHtml(s.id)}">${escapeHtml(s.heading)}</h2><p>${escapeHtml(s.text)}</p>`).join('');
  const visual = renderEditorialVisual({
    id: 'blog-post-editorial-visual',
    eyebrow: 'Карта материала',
    title: 'Маршрут от вопроса к решению',
    text: 'Структура материала вынесена в визуальную карту, чтобы длинный текст было проще сканировать и читать по задаче.',
    visual: PAGE_VISUALS.journal,
    steps: post.sections,
    outcome: 'Проверяемая рекомендация',
    tone: 'light'
  });
  return `<section class="section"><div class="container content-flow"><p class="muted">${escapeHtml(post.category)} · ${escapeHtml(post.date)}</p><h1>${escapeHtml(post.title)}</h1><p class="lead">${escapeHtml(post.lead)}</p>${toc}</div></section>${visual}<section class="section article-reading-section"><div class="container content-flow"><article>${body}</article>${author ? `<h3>Автор</h3>${renderAuthorCard(author)}` : ''}${expert ? `<h3>Эксперт</h3>${renderAuthorCard(expert)}` : ''}</div></section>`;
}
function renderAuthorPage(person) {
  const authored = blog.filter((p) => p.author === person.slug || p.expert === person.slug);
  const visual = renderEditorialVisual({
    id: 'author-editorial-visual',
    eyebrow: 'E-E-A-T',
    title: 'Опыт, специализация и публичные материалы',
    text: 'Экспертность становится проверяемой, когда опыт связан с конкретной специализацией и опубликованными разборами.',
    visual: PAGE_VISUALS.strategy,
    steps: ['Практический опыт', 'Специализация', 'Метод работы', 'Публичные материалы'],
    outcome: authored.length + ' материалов автора'
  });
  return `<section class="section"><div class="container content-flow"><h1>${escapeHtml(person.name)}</h1><p class="lead">${escapeHtml(person.role)}</p><div class="card"><p><strong>Опыт:</strong> ${escapeHtml(person.experience)}</p><p><strong>Специализация:</strong> ${escapeHtml(person.expertise)}</p></div></div></section>${visual}<section class="section article-reading-section"><div class="container content-flow"><h2>Материалы и кейсы</h2><ul>${authored.map((p) => `<li><a href="/blog/${escapeHtml(p.slug)}/">${escapeHtml(p.title)}</a></li>`).join('')}</ul></div></section>`;
}
function writePage(page, html) {
  const slug = normalizeInternalHtmlPath(page.slug);
  const canonical = canonicalUrl(SITE_URL, page.canonicalPath || slug);
  const schema = normalizeStructuredDataUrls(buildPageSchema({ ...page, slug }, slug, canonical), SITE_URL);
  const pageForRender = {
    ...page,
    slug,
    schema: schema.length ? schema : undefined
  };
  const out = normalizeGeneratedHtmlLinks(renderLayout({ site, page: pageForRender, contentHtml: html, canonical }), SITE_URL);
  writeFile(routeToFile(slug), out);
  console.log('generated:', routeToFile(slug));
}
function writeUtilities() {
  const robots = `User-agent: *\nAllow: /\nSitemap: ${siteBaseUrl(SITE_URL)}/sitemap.xml\n`;
  writeFile(path.join(outDir, 'robots.txt'), robots);
  const pageUrls = pages.map((p) => p.slug);
  const urls = [...new Set([...pageUrls, ...blog.map((p) => `/blog/${p.slug}/`), ...authors.map((a) => `/authors/${a.slug}/`), ...journalPosts.map((p) => `/journal/${p.slug}/`)].map((u) => normalizeInternalHtmlPath(u)))];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${canonicalUrl(SITE_URL, u)}</loc><lastmod>${BUILD_DATE}</lastmod></url>`).join('\n')}
</urlset>
`;
  writeFile(path.join(outDir, 'sitemap.xml'), sitemap);
  const notFoundHtml = renderLayout({
    site,
    page: {
      slug: '/404.html',
      title: 'Страница не найдена — Synapsee',
      description: 'Страница не найдена. Перейдите к услугам, кейсам, журналу или контактам Synapsee.',
      robots: 'noindex, follow'
    },
    canonical: canonicalUrl(SITE_URL, '/404.html'),
    contentHtml: '<section class="section"><div class="section-container content-flow"><h1>Страница не найдена</h1><p class="lead">Такого адреса нет, но можно быстро вернуться к основным разделам.</p><p><a class="btn btn-primary" href="/contact/">Получить разбор сайта</a> <a class="btn" href="/services/">Услуги</a> <a class="btn" href="/cases/">Кейсы</a></p></div></section>'
  });
  writeFile(path.join(outDir, '404.html'), normalizeGeneratedHtmlLinks(notFoundHtml, SITE_URL));
}
function main() {
  fs.rmSync(outDir, { recursive: true, force: true });
  const landing = pages.find((p) => p.template === 'landing');
  const blogIndex = pages.find((p) => p.template === 'blog-index');
  const contact = pages.find((p) => p.slug === '/contact/');
  if (!landing || !blogIndex || !contact) throw new Error('Missing required pages');
  writePage(landing, renderLanding(landing));
  writePage(blogIndex, renderBlogIndex(blogIndex));
  writePage(contact, renderContactPage(contact));
  pages.filter((p) => p.template === 'services-offer').forEach((p) => writePage(p, renderServicesOfferPage(p)));
  pages.filter((p) => p.template === 'cases-proof').forEach((p) => writePage(p, renderCasesProofPage(p)));
  pages.filter((p) => p.template === 'pricing-offer').forEach((p) => writePage(p, renderPricingOfferPage(p)));
  pages.filter((p) => p.template === 'case-detail').forEach((p) => {
    const casePage = enrichCasePage(p);
    writePage(casePage, renderCaseDetailPage(casePage));
  });
  pages.filter((p) => p.template === 'simple' && p.slug !== '/contact/').forEach((p) => writePage(p, renderSimplePage(p)));
  const privacyPage = pages.find((p) => normalizeInternalHtmlPath(p.slug || '') === '/privacy/');
  if (privacyPage) writePage({ ...privacyPage, slug: '/politika-konfidencialnosti/', canonicalPath: '/privacy/', robots: 'noindex, follow' }, renderPrivacyPolicy(privacyPage));
  pages.filter((p) => p.template === 'journal-index').forEach((p) => writePage(p, renderJournalIndex(p)));
  blog.forEach((post) => writePage({ slug: `/blog/${post.slug}/`, title: post.title, description: post.lead, template: 'blog-post', post, ogType: 'article' }, renderPost(post)));
  authors.forEach((a) => writePage({ slug: `/authors/${a.slug}/`, title: `${a.name} — автор`, description: a.expertise, template: 'author', author: a }, renderAuthorPage(a)));
  journalPosts.forEach((post) => writePage({ slug: `/journal/${post.slug}/`, title: post.title, description: post.description || post.excerpt, template: 'journal-post', post, ogType: 'article' }, renderJournalPost(post)));
  writeUtilities();
  copyStaticCaseAssets();
  copyStaticAssets();
  fs.rmSync(finalOutDir, { recursive: true, force: true });
  fs.renameSync(outDir, finalOutDir);
}
try {
  main();
} catch (error) {
  fs.rmSync(outDir, { recursive: true, force: true });
  throw error;
}
