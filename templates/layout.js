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
:root{--bg:#F5F5F7;--bg2:#FBFBFD;--surface:#FFFFFF;--surface-muted:#F2F2F7;--border:#D2D2D7;--divider:#E5E5EA;--text:#1D1D1F;--text2:#3A3A3C;--text3:#6E6E73;--accent:#0066CC;--accent-hover:#0057B8;--focus:#0066CC66;--glass:#FFFFFFCC;--glass-border:#FFFFFFB8;--glass-clear:#FFFFFF4D;--dimming:#0000000D;--frosted:#F2F2F7E6;--shadow1:0 1px 2px #0000000A,0 12px 28px #00000010;--shadow2:0 4px 10px #0000000F,0 20px 50px #00000018;--r12:12px;--r20:20px;--r24:24px;--pill:999px;--s8:8px;--s12:12px;--s16:16px;--s20:20px;--s24:24px;--s32:32px;--s40:40px;--s48:48px;--s56:56px;--space-stack-sm:var(--s16);--space-stack-md:var(--s24);--space-stack-lg:var(--s32);--font:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;--font-rounded:ui-rounded,ui-sans-serif,system-ui,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:var(--font);font-size:16px;color:var(--text);background:linear-gradient(180deg,var(--bg2),var(--bg));line-height:1.65;letter-spacing:.002em}
.container{max-width:1200px;margin:0 auto;padding:0 24px}.section-container{width:100%;max-width:1200px;margin:0 auto;padding:0 24px}.grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:24px}.cards-grid{display:grid;gap:var(--gap,var(--s24));width:100%;grid-template-columns:repeat(var(--cols,1),minmax(0,1fr))}.cards-grid>*{min-width:0}.grid-1-2-3{--cols:1;--cols-md:2;--cols-lg:3}.grid-1-2-4{--cols:1;--cols-md:2;--cols-lg:4}.grid-lg-3{--cols-lg:3}.section{padding:var(--s56) 0;border-bottom:1px solid var(--divider)}
h1,h2,h3{font-family:var(--font-rounded);letter-spacing:-.02em;color:var(--text);margin:0 0 var(--s16)}h1{font-size:clamp(2rem,4vw,3.5rem);line-height:1.08}h2{font-size:clamp(1.55rem,2.35vw,2.25rem);line-height:1.2;margin-bottom:var(--s20)}h3{font-size:clamp(1.15rem,1.7vw,1.4rem);line-height:1.3;margin-bottom:var(--s12)}p,li{margin:0 0 var(--s16)}small,.meta,.muted{font-size:.94rem;line-height:1.5;color:var(--text3)}
.header{position:sticky;top:0;z-index:20;background:linear-gradient(180deg,var(--glass),#FFFFFFB5);backdrop-filter:blur(10px);border-bottom:1px solid var(--glass-border)}
.header-in{display:flex;justify-content:space-between;align-items:center;min-height:74px}.brand{font-family:var(--font-rounded);font-weight:700;color:var(--text);text-decoration:none}.nav{display:flex;gap:18px}.nav a{color:var(--text2);text-decoration:none;padding:6px 10px;border-radius:10px;transition:background-color .18s ease,color .18s ease}.nav a:hover,.nav a:focus-visible{background:var(--surface-muted);color:var(--text)}
.hero h1{font-size:clamp(2.2rem,5vw,4rem);line-height:1.02;margin:0 0 var(--s20)}.lead{font-size:1.13rem;color:var(--text2);line-height:1.62;max-width:68ch;margin-bottom:0}.hero .lead + .cards-grid{margin-top:var(--space-stack-lg)}.hero .cards-grid + p{margin-top:var(--space-stack-lg)}.hero p + .muted{margin-top:var(--space-stack-sm)}
a{color:var(--accent);text-underline-offset:3px;transition:color .18s ease,opacity .18s ease}a:hover{color:var(--accent-hover)}a:focus-visible,button:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:12px 20px;border-radius:var(--pill);border:1px solid var(--border);font-weight:600;letter-spacing:.01em;line-height:1.2;text-decoration:none;color:var(--text);background:linear-gradient(180deg,#fff,#f7f7fb);box-shadow:0 1px 0 #FFFFFFB3 inset;transition:transform .16s ease,box-shadow .2s ease,background .2s ease,color .2s ease,border-color .2s ease}.btn:hover,.btn:focus-visible{transform:translateY(-1px);box-shadow:0 1px 0 #FFFFFFB3 inset,var(--shadow1)}.btn:active{transform:translateY(0);box-shadow:0 1px 0 #FFFFFF80 inset,0 2px 8px #00000012}.btn + .btn{margin-left:var(--s12)}
.btn-primary{background:linear-gradient(180deg,#0A72D8,var(--accent));border-color:#0A72D8;color:#fff;text-shadow:0 1px 1px #00000026}.btn-primary:hover,.btn-primary:focus-visible,.btn-primary:active{background:linear-gradient(180deg,#0F7DE6,var(--accent-hover));border-color:#0060c0;color:#fff}
.btn-secondary,.btn:not(.btn-primary){background:linear-gradient(180deg,#FFFFFF,#F2F2F7);border-color:#CACAD1;color:var(--text)}.btn-secondary:hover,.btn-secondary:focus-visible,.btn:not(.btn-primary):hover,.btn:not(.btn-primary):focus-visible{background:linear-gradient(180deg,#FFFFFF,#EDEEF4);border-color:#BDBEC8;color:var(--text)}
.card,.toc,.author-card{background:linear-gradient(180deg,#FFFFFFE8,#FFFFFFD9);border:1px solid #FFFFFFCC;box-shadow:var(--shadow1);line-height:1.6;transition:border-color .2s ease,box-shadow .2s ease,transform .18s ease}.card{border-radius:var(--r20);padding:var(--s24);text-align:left}.card:hover{transform:translateY(-2px);border-color:#FFFFFF;box-shadow:var(--shadow2)}.card p,.card li{overflow-wrap:break-word;word-break:normal;hyphens:auto}.card h3 + p{margin-top:2px}
.kpi{font:700 clamp(1.8rem,3.2vw,2.4rem)/1.05 var(--font-rounded);letter-spacing:-.02em}.muted{color:var(--text3)}
.toc{padding:var(--s20);border-radius:var(--r12)}
.scroll-rail{position:fixed;right:24px;top:50%;transform:translateY(-50%);z-index:30;background:linear-gradient(180deg,var(--glass),#FFFFFFA8);backdrop-filter:blur(8px);border:1px solid var(--glass-border);box-shadow:var(--shadow1);border-radius:24px;padding:10px 9px;display:flex;flex-direction:column;gap:10px}
.rail-track{display:flex;flex-direction:column;gap:10px}.rail-tick{position:relative;width:30px;height:10px;border:0;background:transparent;cursor:pointer}.rail-tick::before{content:"";display:block;height:2px;width:13px;background:var(--text3);border-radius:2px;margin-left:auto;transition:.2s}
.rail-tick.is-active::before{width:24px;background:var(--accent)}.rail-tip{position:absolute;right:36px;top:50%;transform:translateY(-50%);background:var(--surface);border:1px solid var(--border);border-radius:999px;padding:5px 9px;font-size:12px;opacity:0;pointer-events:none;white-space:nowrap;box-shadow:var(--shadow1)}
.rail-tick.is-active .rail-tip,.rail-tick:hover .rail-tip{opacity:1}.rail-nav{border:1px solid var(--border);border-radius:999px;background:var(--surface);width:30px;height:30px;cursor:pointer;transition:background-color .2s ease,color .2s ease}.rail-nav:hover,.rail-nav:focus-visible{background:var(--surface-muted);color:var(--accent)}
.rail-mobile-toggle,.rail-mobile-sheet{display:none}
.author-card{display:flex;gap:12px;align-items:flex-start;padding:18px;border-radius:var(--r12)}
.author-avatar{width:56px;height:56px;border-radius:50%;background:var(--divider);display:flex;align-items:center;justify-content:center;font-weight:700}
@media (min-width:768px){.cards-grid{--cols:var(--cols-md,2)}}
@media (min-width:1200px){.cards-grid{--cols:var(--cols-lg,3)}}
@media (max-width:900px){.container,.section-container{padding:0 16px}.grid{grid-template-columns:1fr;gap:16px}.section{padding:48px 0}.scroll-rail{display:none}.rail-mobile-toggle{display:block;position:fixed;right:16px;bottom:16px;z-index:40;border:1px solid var(--border);background:var(--surface);border-radius:999px;padding:10px 14px;box-shadow:var(--shadow1)}.rail-mobile-sheet{display:grid;position:fixed;left:16px;right:16px;bottom:72px;z-index:40;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:8px;box-shadow:var(--shadow1)}}
@media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}.rail-tick::before{transition:none}}
@media (prefers-contrast: more){:root{--border:#8e8e93;--text3:#4a4a4f}}
@media (prefers-reduced-transparency: reduce){.header,.scroll-rail{background:var(--frosted);backdrop-filter:none}}
.site-footer{padding:48px 0;border-top:1px solid var(--divider);background:linear-gradient(var(--bg2),var(--bg));line-height:1.55}
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
          <li><a href="https://t.me/seo-prod" target="_blank" rel="noopener">Telegram</a></li>
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
