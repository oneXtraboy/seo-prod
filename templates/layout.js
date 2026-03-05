function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function navLink(href, label) {
  return `<a href="${href}">${escapeHtml(label)}</a>`;
}

function renderLayout({ site, page, contentHtml, canonical = '', railSections = [] }) {
  const title = page.title || site.defaultTitle;
  const description = page.description || site.defaultDescription;
  const motionReduced = `window.matchMedia('(prefers-reduced-motion: reduce)').matches`;

  const railHtml = page.enableRail && railSections.length
    ? `<aside class="scroll-rail" aria-label="Навигация по секциям">
        <button class="rail-nav" data-dir="prev" aria-label="Предыдущая секция">↑</button>
        <div class="rail-track">
          ${railSections.map((s, i) => `<button class="rail-tick" data-target="${escapeHtml(s.id)}" data-index="${i}" aria-label="${escapeHtml(s.title)}"><span class="rail-tip">${escapeHtml(s.title)}</span></button>`).join('')}
        </div>
        <button class="rail-nav" data-dir="next" aria-label="Следующая секция">↓</button>
      </aside>
      <button class="rail-mobile-toggle" aria-expanded="false" aria-controls="mobile-nav">Навигация по странице</button>
      <div class="rail-mobile-sheet" id="mobile-nav" hidden>
        ${railSections.map((s) => `<button class="mobile-nav-item" data-target="${escapeHtml(s.id)}">${escapeHtml(s.title)}</button>`).join('')}
      </div>`
    : '';

  const railScript = page.enableRail && railSections.length
    ? `<script>
      (() => {
        const sections = ${JSON.stringify(railSections.map((s) => s.id))};
        const ticks = [...document.querySelectorAll('.rail-tick')];
        const prefersReduced = ${motionReduced};
        let active = 0;
        function goTo(index) {
          const id = sections[index];
          const el = document.getElementById(id);
          if (!el) return;
          el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
        }
        function setActive(index) {
          active = index;
          ticks.forEach((t, i) => t.classList.toggle('is-active', i === index));
        }
        ticks.forEach((tick, i) => tick.addEventListener('click', () => goTo(i)));
        document.querySelectorAll('.mobile-nav-item').forEach((item, i) => item.addEventListener('click', () => goTo(i)));
        document.querySelectorAll('.rail-nav').forEach((btn) => btn.addEventListener('click', () => {
          const dir = btn.dataset.dir === 'next' ? 1 : -1;
          const next = Math.max(0, Math.min(sections.length - 1, active + dir));
          goTo(next);
        }));
        const obs = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const i = sections.indexOf(entry.target.id);
              if (i >= 0) setActive(i);
            }
          });
        }, { rootMargin: '-35% 0px -55% 0px', threshold: 0.01 });
        sections.forEach((id) => {
          const node = document.getElementById(id);
          if (node) obs.observe(node);
        });
        const toggle = document.querySelector('.rail-mobile-toggle');
        const sheet = document.getElementById('mobile-nav');
        if (toggle && sheet) {
          toggle.addEventListener('click', () => {
            const open = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!open));
            sheet.hidden = open;
          });
        }
      })();
    </script>`
    : '';

  return `<!doctype html>
<html lang="${escapeHtml(site.language || 'ru')}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}" />` : ''}
${page.schema ? `<script type="application/ld+json">${JSON.stringify(page.schema)}</script>` : ''}
<style>
:root{--bg:#F5F5F7;--bg2:#FBFBFD;--surface:#FFFFFF;--surface-muted:#F2F2F7;--border:#D2D2D7;--divider:#E5E5EA;--text:#1D1D1F;--text2:#3A3A3C;--text3:#6E6E73;--accent:#0066CC;--accent-hover:#0057B8;--focus:#0066CC66;--glass:#FFFFFFB3;--glass-border:#FFFFFF80;--glass-clear:#FFFFFF4D;--dimming:#0000000D;--frosted:#F2F2F7E6;--shadow1:0 1px 2px #0000000A,0 6px 20px #00000012;--shadow2:0 4px 10px #0000000F,0 20px 50px #00000018;--r12:12px;--r20:20px;--r24:24px;--pill:999px;--s8:8px;--s16:16px;--s24:24px;--s32:32px;--s48:48px;--font:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;--font-rounded:ui-rounded,ui-sans-serif,system-ui,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:var(--font);color:var(--text);background:linear-gradient(var(--bg2),var(--bg));line-height:1.5}
.container{max-width:1200px;margin:0 auto;padding:0 24px}.section-container{width:100%;max-width:1200px;margin:0 auto;padding:0 24px}.grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:24px}.cards-grid{display:grid;gap:var(--gap,24px);width:100%;grid-template-columns:repeat(var(--cols,1),minmax(0,1fr))}.cards-grid>*{min-width:0}.grid-1-2-3{--cols:1;--cols-md:2;--cols-lg:3}.grid-1-2-4{--cols:1;--cols-md:2;--cols-lg:4}.grid-lg-3{--cols-lg:3}.section{padding:48px 0;border-bottom:1px solid var(--divider)}main{width:100%}.scroll-rail~main .section-container{max-width:1180px;padding-right:96px}
.header{position:sticky;top:0;z-index:20;background:var(--glass);backdrop-filter:blur(14px);border-bottom:1px solid var(--glass-border)}
.header-in{display:flex;justify-content:space-between;align-items:center;min-height:72px}.brand{font-family:var(--font-rounded);font-weight:700;color:var(--text);text-decoration:none}.nav{display:flex;gap:16px}.nav a{color:var(--text2);text-decoration:none}
.hero h1{font-size:clamp(32px,5vw,60px);line-height:1.05;margin:0 0 16px}.lead{font-size:1.1rem;color:var(--text2);max-width:68ch}
.btn{display:inline-flex;align-items:center;gap:8px;padding:12px 18px;border-radius:var(--pill);border:1px solid var(--border);text-decoration:none;color:var(--text);background:var(--surface)}
.btn-primary{background:var(--accent);color:#fff;border-color:var(--accent)}.btn-primary:hover{background:var(--accent-hover)}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r20);padding:24px;box-shadow:var(--shadow1);text-align:left;line-height:1.45;transition:transform .2s ease,box-shadow .2s ease}.card:hover{transform:translateY(-2px);box-shadow:var(--shadow2)}.card p,.card li{overflow-wrap:break-word;word-break:normal;hyphens:auto}.card-title{margin:0 0 10px}.card-text{margin:0 0 10px}.quote{margin:0 0 12px;font-size:1.02rem;line-height:1.5}.quote-meta{color:var(--text3);font-size:.95rem}
.kpi{font:700 2rem/1 var(--font-rounded)}.muted{color:var(--text3)}
.toc{background:var(--surface-muted);padding:16px;border-radius:var(--r12);border:1px solid var(--border)}
.scroll-rail{position:fixed;right:20px;top:50%;transform:translateY(-50%);z-index:30;background:var(--glass);backdrop-filter:blur(12px);border:1px solid var(--glass-border);box-shadow:var(--shadow1);border-radius:24px;padding:10px;display:flex;flex-direction:column;gap:8px}
.rail-track{display:flex;flex-direction:column;gap:8px}.rail-tick{position:relative;width:28px;height:8px;border:0;background:transparent;cursor:pointer}.rail-tick::before{content:"";display:block;height:2px;width:12px;background:var(--text3);border-radius:2px;margin-left:auto;transition:.2s}
.rail-tick.is-active::before{width:24px;background:var(--accent)}.rail-tip{position:absolute;right:34px;top:50%;transform:translateY(-50%);background:var(--surface);border:1px solid var(--border);border-radius:999px;padding:4px 8px;font-size:12px;opacity:0;pointer-events:none;white-space:nowrap}
.rail-tick.is-active .rail-tip,.rail-tick:hover .rail-tip{opacity:1}.rail-nav{border:1px solid var(--border);border-radius:999px;background:var(--surface);width:28px;height:28px;cursor:pointer}
.rail-mobile-toggle,.rail-mobile-sheet{display:none}
.author-card{display:flex;gap:12px;align-items:flex-start;background:var(--surface-muted);padding:16px;border:1px solid var(--border);border-radius:var(--r12)}
.author-avatar{width:56px;height:56px;border-radius:50%;background:var(--divider);display:flex;align-items:center;justify-content:center;font-weight:700}
@media (min-width:768px){.cards-grid{--cols:var(--cols-md,2)}}
@media (min-width:1200px){.cards-grid{--cols:var(--cols-lg,3)}}
@media (max-width:900px){.container,.section-container{padding:0 16px}.grid{grid-template-columns:1fr;gap:16px}.scroll-rail~main .section-container{padding-right:16px}.scroll-rail{display:none}.rail-mobile-toggle{display:block;position:fixed;right:16px;bottom:16px;z-index:40;border:1px solid var(--border);background:var(--surface);border-radius:999px;padding:10px 14px}.rail-mobile-sheet{display:grid;position:fixed;left:16px;right:16px;bottom:72px;z-index:40;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:8px}}
@media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}.rail-tick::before,.card{transition:none}.card:hover{transform:none;box-shadow:var(--shadow1)}}
@media (prefers-contrast: more){:root{--border:#8e8e93;--text3:#4a4a4f}}
@media (prefers-reduced-transparency: reduce){.header,.scroll-rail{background:var(--frosted);backdrop-filter:none}}
.site-footer{padding:48px 0;border-top:1px solid var(--divider);background:linear-gradient(var(--bg2),var(--bg))}
.site-footer .footer-grid{align-items:start}
.site-footer .footer-brand{font-family:var(--font-rounded);font-weight:800;letter-spacing:.02em}
.site-footer .footer-title{font-weight:700;margin:0 0 10px}
.site-footer .footer-links{list-style:none;padding:0;margin:0;display:grid;gap:8px}
.site-footer .footer-links a{color:var(--text2);text-decoration:none}
.site-footer .footer-links a:hover{color:var(--text);text-decoration:underline}
.site-footer .footer-note,.site-footer .footer-micro{color:var(--text2);margin:10px 0 0}
.site-footer .footer-bottom{margin-top:28px;padding-top:18px;border-top:1px solid var(--divider);display:flex;gap:12px;justify-content:space-between;align-items:center;flex-wrap:wrap}
.site-footer .footer-meta{display:flex;gap:10px;align-items:center;color:var(--text2)}
.site-footer .footer-meta a{color:var(--text2);text-decoration:none}
.site-footer .footer-meta a:hover{color:var(--text);text-decoration:underline}
</style>
</head>
<body>
<header class="header"><div class="container header-in"><a class="brand" href="/">${escapeHtml(site.brandName || 'SEO-PROD')}</a><nav class="nav">${navLink('/', 'Главная')}${navLink('/services/', 'Услуги')}${navLink('/cases/', 'Кейсы')}${navLink('/pricing/', 'Цены')}${navLink('/journal/', 'Журнал')}${navLink('/contact/', 'Контакты')}</nav></div></header>
${railHtml}
<main>${contentHtml}</main>
<footer class="site-footer">
  <div class="section-container">
    <div class="cards-grid grid-1-2-3 footer-grid">
      <div class="footer-col">
        <div class="footer-brand">${escapeHtml(site.brandName || 'SEO-PROD')}</div>
        <p class="footer-note">SEO с фокусом на заявки: GEO/AEO, контент, внедрения и контроль качества.</p>
        <a class="btn btn-primary footer-cta" href="/contact/">Заполнить бриф</a>
        <p class="footer-micro">Ответ в течение 15 минут • без спама</p>
      </div>

      <div class="footer-col">
        <div class="footer-title">Разделы</div>
        <ul class="footer-links">
          <li><a href="/">Главная</a></li>
          <li><a href="/services/">Услуги</a></li>
          <li><a href="/cases/">Кейсы</a></li>
          <li><a href="/pricing/">Цены</a></li>
          <li><a href="/journal/">Журнал</a></li>
          <li><a href="/contact/">Контакты</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <div class="footer-title">Контакты</div>
        <ul class="footer-links">
          <li><a href="https://t.me/USERNAME" target="_blank" rel="noopener">Telegram</a></li>
          <li><a href="mailto:hello@seo-prod.ru">hello@seo-prod.ru</a></li>
          <li><a href="tel:+79990000000">+7 (999) 000-00-00</a></li>
        </ul>
        <p class="footer-micro">Telegram: https://t.me/seo-prod · hello@seo-prod.ru · +7 (999) 000-00-00</p>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="footer-copy">© ${new Date().getFullYear()} ${escapeHtml(site.brandName || 'SEO-PROD')}</div>
      <div class="footer-meta"></div>
    </div>
  </div>
</footer>
${railScript}
</body></html>`;
}

module.exports = { renderLayout, escapeHtml };
