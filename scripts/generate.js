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

function renderCaseVisual(item) {
  if (item.topvisorImage) {
    return `<img class="clients-card-image" src="${escapeHtml(item.topvisorImage)}" alt="${escapeHtml(item.topvisorImageAlt || item.shortTitle || item.title || 'Визуал кейса')}" loading="lazy" decoding="async" />`;
  }
  return `<div class="clients-card-image-placeholder" role="img" aria-label="${escapeHtml(item.topvisorImageAlt || item.shortTitle || item.title || 'Слот под визуал кейса')}">Слот под реальный скрин Topvisor</div>`;
}

function renderTestimonialVisual(item, personName) {
  const testimonial = item.testimonial || {};
  if (testimonial.photo) {
    return `<img class="reviews-card-photo" src="${escapeHtml(testimonial.photo)}" alt="${escapeHtml(testimonial.photoAlt || personName || 'Фото представителя клиента')}" loading="lazy" decoding="async" />`;
  }
  return `<div class="reviews-card-photo-placeholder" role="img" aria-label="Слот под фото представителя клиента">Фото клиента</div>`;
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
      <div class="clients-carousel-main">
        <div class="clients-carousel-track" data-clients-carousel tabindex="0" aria-label="Карусель кейсов клиентов">
          ${featuredCases.map((item, index) => {
    const anchor = normalizeCaseAnchor(item, index);
    const href = getCaseHref(item, index);
    const metrics = Array.isArray(item.metricsPreview) ? item.metricsPreview.slice(0, 3) : [];
    return `<article class="clients-card" id="home-case-${escapeHtml(anchor)}">
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
        <div class="clients-carousel-progress" data-clients-progress role="slider" aria-label="Навигация по кейсам" aria-valuemin="1" aria-valuemax="${featuredCases.length || 1}" aria-valuenow="1" aria-valuetext="Кейс 1 из ${featuredCases.length || 1}" tabindex="0">
          <div class="clients-carousel-progress-track">
            <div class="clients-carousel-progress-fill" data-clients-progress-fill></div>
          </div>
        </div>
      </div>
      <button class="clients-carousel-nav" type="button" data-dir="next" aria-label="Следующие кейсы">→</button>
    </div>
    <p class="clients-cta-wrap"><a class="btn btn-primary clients-cta-btn" href="/cases/">Смотреть все кейсы</a></p>
    <script>
      (() => {
        const root = document.querySelector('[data-clients-carousel]');
        const progress = document.querySelector('[data-clients-progress]');
        const progressFill = document.querySelector('[data-clients-progress-fill]');
        if (!root) return;
        const totalSlides = Math.max(1, root.querySelectorAll('.clients-card').length);
        const navButtons = document.querySelectorAll('.clients-carousel-nav');
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
        const getMaxScroll = () => Math.max(root.scrollWidth - root.clientWidth, 0);
        const getRatioFromScroll = () => {
          const maxScroll = getMaxScroll();
          if (!maxScroll) return 0;
          return clamp(root.scrollLeft / maxScroll, 0, 1);
        };
        const setProgressRatio = (ratio) => {
          if (!progress || !progressFill) return;
          const nextRatio = clamp(ratio, 0, 1);
          const segmentRatio = 1 / totalSlides;
          const maxOffset = 1 - segmentRatio;
          const leftRatio = nextRatio * maxOffset;
          progressFill.style.width = (segmentRatio * 100).toFixed(3) + '%';
          progressFill.style.left = (leftRatio * 100).toFixed(3) + '%';
        };
        const getActiveIndex = () => {
          const step = getStep();
          if (!step) return 0;
          return Math.round(root.scrollLeft / step);
        };
        const syncProgress = () => {
          const ratio = getRatioFromScroll();
          setProgressRatio(ratio);
          if (!progress) return;
          const cards = root.querySelectorAll('.clients-card');
          const maxIndex = Math.max(cards.length - 1, 0);
          const currentIndex = clamp(getActiveIndex(), 0, maxIndex);
          progress.setAttribute('aria-valuemin', '1');
          progress.setAttribute('aria-valuemax', String(maxIndex + 1));
          progress.setAttribute('aria-valuenow', String(currentIndex + 1));
          progress.setAttribute('aria-valuetext', 'Кейс ' + (currentIndex + 1) + ' из ' + (maxIndex + 1));
        };
        const scrollToRatio = (ratio) => {
          const maxScroll = getMaxScroll();
          root.scrollTo({ left: clamp(ratio, 0, 1) * maxScroll, behavior: prefersReduced ? 'auto' : 'smooth' });
        };
        const getPointerRatio = (clientX) => {
          if (!progress) return 0;
          const rect = progress.getBoundingClientRect();
          if (!rect.width) return 0;
          return clamp((clientX - rect.left) / rect.width, 0, 1);
        };
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
        if (progress) {
          progress.addEventListener('click', (event) => {
            scrollToRatio(getPointerRatio(event.clientX));
          });
          progress.addEventListener('keydown', (event) => {
            if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') return;
            event.preventDefault();
            if (event.key === 'Home') {
              scrollToRatio(0);
              return;
            }
            if (event.key === 'End') {
              scrollToRatio(1);
              return;
            }
            const dir = event.key === 'ArrowRight' ? 1 : -1;
            root.scrollBy({ left: getStep() * dir, behavior: prefersReduced ? 'auto' : 'smooth' });
          });
          let dragging = false;
          const startDrag = (event) => {
            dragging = true;
            progress.setPointerCapture(event.pointerId);
            scrollToRatio(getPointerRatio(event.clientX));
          };
          const onDrag = (event) => {
            if (!dragging) return;
            scrollToRatio(getPointerRatio(event.clientX));
          };
          const stopDrag = (event) => {
            dragging = false;
            if (progress.hasPointerCapture(event.pointerId)) {
              progress.releasePointerCapture(event.pointerId);
            }
          };
          progress.addEventListener('pointerdown', startDrag);
          progress.addEventListener('pointermove', onDrag);
          progress.addEventListener('pointerup', stopDrag);
          progress.addEventListener('pointercancel', stopDrag);
        }
        root.addEventListener('keydown', (event) => {
          if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
          event.preventDefault();
          const dir = event.key === 'ArrowRight' ? 1 : -1;
          root.scrollBy({ left: getStep() * dir, behavior: prefersReduced ? 'auto' : 'smooth' });
        });
        root.addEventListener('scroll', syncProgress, { passive: true });
        window.addEventListener('resize', syncProgress);
        syncProgress();
      })();
    </script></div></section>`;
  const reviewCases = featuredCases.slice(0, 6);
  const reviews = `<section id="reviews" class="section"><div class="section-container section-container-wide content-flow reviews-section-flow"><div class="reviews-intro"><h2>${escapeHtml(data.reviews.title)}</h2><p class="lead">${escapeHtml(data.reviews.lead || 'Отзывы привязаны к тем же компаниям, что и в кейсах. Если отзыв ещё не согласован, показываем честный статус публикации.')}</p></div>
    <div class="reviews-carousel-wrap">
      <button class="reviews-carousel-nav" type="button" data-reviews-dir="prev" aria-label="Предыдущие отзывы">←</button>
      <div class="reviews-carousel-main">
        <div class="reviews-carousel-track" data-reviews-carousel tabindex="0" aria-label="Карусель отзывов клиентов">
          ${reviewCases.map((item, index) => {
    const testimonial = item.testimonial || {};
    const personName = testimonial.name || 'Представитель клиента';
    const role = testimonial.role || 'Отзыв подтверждается и готовится к публикации';
    const quote = testimonial.quote || 'Публичный отзыв по этому кейсу в процессе согласования. Используем реальный кейс и компанию без вымышленных цитат.';
    const anchor = normalizeCaseAnchor(item, index);
    return `<article class="reviews-card">
              <div class="reviews-card-body">
                <div class="reviews-card-content">
                  <div class="reviews-card-meta">
                    <p class="reviews-card-company">${escapeHtml(item.clientName || 'Клиент под NDA')}</p>
                    <p class="reviews-card-person">${escapeHtml(personName)}</p>
                    <p class="reviews-card-role">${escapeHtml(role)}</p>
                  </div>
                  <blockquote class="reviews-card-quote">“${escapeHtml(quote)}”</blockquote>
                  <p class="reviews-card-link"><a href="${escapeHtml(getCaseHref(item, index))}">Перейти к кейсу</a></p>
                </div>
                <div class="reviews-card-media">
                  <div class="reviews-card-photo-slot">${renderTestimonialVisual(item, personName)}</div>
                </div>
              </div>
            </article>`;
  }).join('')}
        </div>
        <div class="reviews-carousel-progress" data-reviews-progress role="slider" aria-label="Навигация по отзывам" aria-valuemin="1" aria-valuemax="${reviewCases.length || 1}" aria-valuenow="1" aria-valuetext="Отзыв 1 из ${reviewCases.length || 1}" tabindex="0">
          <div class="reviews-carousel-progress-track">
            <div class="reviews-carousel-progress-fill" data-reviews-progress-fill></div>
          </div>
        </div>
      </div>
      <button class="reviews-carousel-nav" type="button" data-reviews-dir="next" aria-label="Следующие отзывы">→</button>
    </div>
    <script>
      (() => {
        const root = document.querySelector('[data-reviews-carousel]');
        const progress = document.querySelector('[data-reviews-progress]');
        const progressFill = document.querySelector('[data-reviews-progress-fill]');
        if (!root) return;
        const navButtons = document.querySelectorAll('[data-reviews-dir]');
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
        const getMaxScroll = () => Math.max(root.scrollWidth - root.clientWidth, 0);
        const getVisibleCount = () => window.matchMedia('(min-width: 1024px)').matches ? 2 : 1;
        const getTotalPages = () => Math.max(root.querySelectorAll('.reviews-card').length - getVisibleCount() + 1, 1);
        const getStep = () => {
          const card = root.querySelector('.reviews-card');
          if (!card) return root.clientWidth;
          const styles = window.getComputedStyle(root);
          const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
          return card.getBoundingClientRect().width + gap;
        };
        const setProgress = () => {
          const maxScroll = getMaxScroll();
          const ratio = maxScroll ? clamp(root.scrollLeft / maxScroll, 0, 1) : 0;
          const totalPages = getTotalPages();
          const segmentRatio = 1 / totalPages;
          const maxOffset = 1 - segmentRatio;
          if (progressFill) {
            progressFill.style.width = (segmentRatio * 100).toFixed(3) + '%';
            progressFill.style.left = (ratio * maxOffset * 100).toFixed(3) + '%';
          }
          if (progress) {
            const currentIndex = clamp(Math.round(ratio * (totalPages - 1)), 0, totalPages - 1);
            progress.setAttribute('aria-valuemin', '1');
            progress.setAttribute('aria-valuemax', String(totalPages));
            progress.setAttribute('aria-valuenow', String(currentIndex + 1));
            progress.setAttribute('aria-valuetext', 'Отзыв ' + (currentIndex + 1) + ' из ' + totalPages);
          }
        };
        const scrollToRatio = (ratio) => {
          root.scrollTo({ left: clamp(ratio, 0, 1) * getMaxScroll(), behavior: prefersReduced ? 'auto' : 'smooth' });
        };
        const getPointerRatio = (clientX) => {
          if (!progress) return 0;
          const rect = progress.getBoundingClientRect();
          if (!rect.width) return 0;
          return clamp((clientX - rect.left) / rect.width, 0, 1);
        };
        navButtons.forEach((button) => {
          button.addEventListener('click', () => {
            const dir = button.dataset.reviewsDir === 'next' ? 1 : -1;
            root.scrollBy({ left: getStep() * dir, behavior: prefersReduced ? 'auto' : 'smooth' });
          });
        });
        root.addEventListener('scroll', setProgress, { passive: true });
        root.addEventListener('keydown', (event) => {
          if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
          event.preventDefault();
          const dir = event.key === 'ArrowRight' ? 1 : -1;
          root.scrollBy({ left: getStep() * dir, behavior: prefersReduced ? 'auto' : 'smooth' });
        });
        if (progress) {
          progress.addEventListener('click', (event) => {
            scrollToRatio(getPointerRatio(event.clientX));
          });
          progress.addEventListener('keydown', (event) => {
            if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') return;
            event.preventDefault();
            if (event.key === 'Home') {
              scrollToRatio(0);
              return;
            }
            if (event.key === 'End') {
              scrollToRatio(1);
              return;
            }
            const dir = event.key === 'ArrowRight' ? 1 : -1;
            root.scrollBy({ left: getStep() * dir, behavior: prefersReduced ? 'auto' : 'smooth' });
          });
          let dragging = false;
          progress.addEventListener('pointerdown', (event) => {
            dragging = true;
            progress.setPointerCapture(event.pointerId);
            scrollToRatio(getPointerRatio(event.clientX));
          });
          progress.addEventListener('pointermove', (event) => {
            if (!dragging) return;
            scrollToRatio(getPointerRatio(event.clientX));
          });
          const stopDrag = (event) => {
            dragging = false;
            if (progress.hasPointerCapture(event.pointerId)) {
              progress.releasePointerCapture(event.pointerId);
            }
          };
          progress.addEventListener('pointerup', stopDrag);
          progress.addEventListener('pointercancel', stopDrag);
        }
        window.addEventListener('resize', setProgress);
        setProgress();
      })();
    </script></div></section>`;
  const teamMembers = String(data.team.text || '')
    .split(/\n+/)
    .map((line) => line.replace(/^\s*•\s*/, '').trim())
    .filter(Boolean)
    .map((line, index) => {
      const [namePart, rolePart] = line.split(/\s+—\s+/);
      const name = namePart && namePart.trim() ? namePart.trim() : `Сотрудник ${index + 1}`;
      const description = rolePart && rolePart.trim()
        ? rolePart.trim()
        : 'Профиль и вклад в проекты уточняются. Слот оставлен как честный placeholder без вымышленных регалий.';
      return {
        name,
        role: description.split('.')[0] || 'Профиль уточняется',
        description
      };
    });
  const teamIntroLines = Array.isArray(data.team.introLines) && data.team.introLines.length
    ? data.team.introLines
    : [
      'Команда SEO-PROD работает как единая продакшн-группа: стратегия, контент, техника и PR синхронизированы в одном ритме.',
      'Мы не собираем «универсальный отдел», а формируем роли под цель проекта: лиды, качество спроса, окупаемость внедрений.',
      'Каждый специалист отвечает за свой участок и фиксирует вклад в общей системе приоритетов и проверок качества.',
      'Описание ниже — рабочие профили и зоны ответственности. Формулировки могут обновляться по мере расширения команды.',
      'Фото и награды показываем только когда есть подтверждённые материалы; до этого оставляем прозрачные placeholder-слоты.',
      'Это помогает сохранить честный контракт: без вымышленных достижений, но с понятной структурой и ответственными ролями.'
    ];
  const team = section('team', data.team.title, `<div class="content-flow team-section-flow"><div class="team-intro card">${teamIntroLines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}</div><div class="team-cards">${teamMembers.map((member) => `<article class="team-card"><div class="team-card-copy"><p class="team-card-role">${escapeHtml(member.role)}</p><h3 class="team-card-name">${escapeHtml(member.name)}</h3><p class="team-card-description">${escapeHtml(member.description)}</p></div><aside class="team-card-media" aria-label="Слот фото и наград"><div class="team-card-media-slot"><p class="team-card-media-label">Слот под фото / награды</p><p class="team-card-media-note">Добавим подтверждённые материалы после согласования.</p></div></aside></article>`).join('')}</div></div>`, 'section-container');
  const faq = section('faq', 'FAQ', `<div class="cards-grid grid-1-2-3">${data.faq.map((item) => `<article class="card"><details><summary>${escapeHtml(item.q)}</summary><p>${escapeHtml(item.a)}</p></details></article>`).join('')}</div>`, 'section-container');
  const contact = section('contact', data.finalCta.title, `<div class="card home-final-cta-card"><div class="home-final-cta-copy"><ul>${data.finalCta.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul></div><div class="home-final-cta-action-wrap"><a class="btn btn-primary home-final-cta-action" href="${escapeHtml(data.finalCta.cta.href)}">${escapeHtml(data.finalCta.cta.text)}</a></div></div>`, 'section-container');
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
    const anchor = normalizeCaseAnchor(item, index);
    const previewLead = item.shortSummary || item.summary || item.context || item.start || '';
    const previewPoints = Array.isArray(item.metricsPreview) && item.metricsPreview.length
      ? item.metricsPreview.slice(0, 3)
      : (Array.isArray(item.actionsList) ? item.actionsList.slice(0, 2) : []);
    const detailHref = getCaseHref(item, index);
    return `<article class="card case-list-card" id="${escapeHtml(anchor)}"><p class="muted">${escapeHtml(item.category || item.niche || '')}</p><h3>${escapeHtml(item.shortTitle || item.title || '')}</h3>${item.clientName ? `<p><strong>Клиент:</strong> ${escapeHtml(item.clientName)}</p>` : ''}${previewLead ? `<p>${escapeHtml(previewLead)}</p>` : ''}${previewPoints.length ? `<ul>${previewPoints.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>` : ''}${item.duration ? `<p class="muted"><strong>Срок / формат:</strong> ${escapeHtml(item.duration)}</p>` : ''}<p class="case-list-card-cta"><a class="btn btn-primary case-list-card-link" href="${escapeHtml(detailHref)}">Смотреть кейс</a></p></article>`;
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

function renderCaseDetailPage(page) {
  const caseIndexRaw = Number(page.caseIndex);
  const caseIndex = Number.isInteger(caseIndexRaw) && caseIndexRaw >= 0 ? caseIndexRaw : 0;
  const caseItem = Array.isArray(casesData) && casesData.length ? casesData[caseIndex] : null;
  if (!caseItem) {
    return `<section class="section"><div class="section-container content-flow"><h1>${escapeHtml(page.h1 || page.title || 'Кейс')}</h1><p class="lead">Кейс временно недоступен.</p><p><a href="/cases/">← Назад к кейсам</a></p></div></section>`;
  }

  const detail = caseItem.caseDetail || {};
  const renderListItem = (item) => `<li>${escapeHtml(item)}</li>`;
  const renderParagraphItems = (items) => (Array.isArray(items) ? items : [])
    .filter(Boolean)
    .map((item) => `<p>${escapeHtml(item)}</p>`)
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
  const screenshotGallery = Array.isArray(proof.screenshots && proof.screenshots.gallery) ? proof.screenshots.gallery : [];
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
    const subsections = Array.isArray(block.subsections) ? block.subsections : [];
    const subsectionsHtml = subsections
      .map((sub) => {
        const subParagraphs = renderParagraphItems(sub.paragraphs);
        const subListItems = Array.isArray(sub.list) ? sub.list : [];
        const subListHtml = subListItems.length ? `<ul>${subListItems.map(renderListItem).join('')}</ul>` : '';
        if (!subParagraphs && !subListHtml) return '';
        return `<article class="case-subsection-card content-flow"><h3>${escapeHtml(sub.title || '')}</h3>${subParagraphs}${subListHtml}</article>`;
      })
      .join('');
    const blockBody = `<div class="card content-flow">${paragraphsHtml}${listHtml}${subsectionsHtml ? `<div class="case-subsections">${subsectionsHtml}</div>` : ''}</div>`;
    return section(sectionId, block.title || '', blockBody, 'section-container');
  };

  const hero = detail.hero || {};
  const introBodyParagraphs = Array.isArray(detail.introBodyParagraphs) ? detail.introBodyParagraphs : [];
  const introParagraphs = Array.isArray(hero.introParagraphs) && hero.introParagraphs.length
    ? hero.introParagraphs
    : [hero.lead || ''].filter(Boolean);
  const heroIntroHtml = introParagraphs
    .map((text, index) => `<p${index === 0 ? ' class="lead"' : ''}>${escapeHtml(text)}</p>`)
    .join('');
  const introBodySection = introBodyParagraphs.length
    ? `<section id="case-intro" class="section"><div class="section-container"><div class="card content-flow">${introBodyParagraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join('')}</div></div></section>`
    : '';
  const heroMetaHtml = hero.showMeta === false
    ? ''
    : `<p><strong>${escapeHtml(hero.clientLabel || 'Клиент')}:</strong> ${escapeHtml(caseItem.clientName || 'Под NDA')}</p><p><strong>${escapeHtml(hero.categoryLabel || 'Категория')}:</strong> ${escapeHtml(caseItem.category || '')}</p>`;
  const heroSection = `<section id="case-hero" class="section hero"><div class="section-container content-flow">${hero.eyebrow ? `<p class="muted">${escapeHtml(hero.eyebrow)}</p>` : ''}<h1>${escapeHtml(hero.title || caseItem.shortTitle || page.h1 || page.title || '')}</h1>${heroIntroHtml}${heroMetaHtml}</div></section>`;

  if (customSections.length) {
    return `${heroSection}
    ${introBodySection}
    ${customSections.map(renderCustomSection).join('')}
    <section id="case-cta" class="section"><div class="section-container content-flow"><p><a class="btn" href="/cases/">← Назад в /cases/</a> <a class="btn btn-primary" href="/contact/">Перейти в /contact/</a></p></div></section>`;
  }

  return `${heroSection}
  ${introBodySection}
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
  ${(detail.finalBlock && detail.finalBlock.text) ? section('case-final-block', detail.finalBlock.title || 'Финальный блок', `<div class="card"><p>${escapeHtml(detail.finalBlock.text)}</p></div>`, 'section-container') : ''}
  <section id="case-cta" class="section"><div class="section-container content-flow"><p><a class="btn" href="/cases/">← Назад в /cases/</a> <a class="btn btn-primary" href="/contact/">Перейти в /contact/</a></p></div></section>`;
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
  pages.filter((p) => p.template === 'case-detail').forEach((p) => writePage(p, renderCaseDetailPage(p)));
  pages.filter((p) => p.template === 'simple' && p.slug !== '/contact/').forEach((p) => writePage(p, renderSimplePage(p)));
  pages.filter((p) => p.template === 'journal-index').forEach((p) => writePage(p, renderJournalIndex(p)));
  blog.forEach((post) => writePage({ slug: `/blog/${post.slug}/`, title: post.title, description: post.lead }, renderPost(post)));
  authors.forEach((a) => writePage({ slug: `/authors/${a.slug}/`, title: `${a.name} — автор`, description: a.expertise }, renderAuthorPage(a)));
  journalPosts.forEach((post) => writePage({ slug: `/journal/${post.slug}/`, title: post.title, description: post.description || post.excerpt }, renderJournalPost(post)));
  writeUtilities();
}
main();
