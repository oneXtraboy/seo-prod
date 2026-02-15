function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderLayout({ site, page, contentHtml, canonical = '' }) {
  const title = page.title || site.defaultTitle;
  const description = page.description || site.defaultDescription;

  return `<!doctype html>
<html lang="${escapeHtml(site.language || 'en')}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    ${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}">` : ''}
    <style>
      :root {
        color-scheme: dark;
        --bg: #0f1115;
        --panel: #171a21;
        --text: #ebedf0;
        --muted: #a8b0bd;
        --accent: #4ea1ff;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: var(--bg);
        color: var(--text);
        line-height: 1.6;
      }
      .header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        background: rgba(15, 17, 21, 0.94);
        backdrop-filter: blur(8px);
        border-bottom: 1px solid #242936;
      }
      .header-inner,
      .content {
        width: min(960px, 92vw);
        margin: 0 auto;
      }
      .header-inner {
        min-height: 64px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 0;
      }
      .brand {
        font-size: 1.05rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-decoration: none;
        color: var(--text);
      }
      .contact {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .contact a {
        color: var(--accent);
        text-decoration: none;
        font-weight: 500;
      }
      .content {
        padding-top: 98px;
        padding-bottom: 48px;
      }
      .panel {
        background: var(--panel);
        border: 1px solid #242936;
        border-radius: 12px;
        padding: 24px;
      }
      h1 {
        margin-top: 0;
        margin-bottom: 16px;
        line-height: 1.2;
      }
      p {
        margin-top: 0;
        margin-bottom: 12px;
        color: var(--muted);
      }
      @media (max-width: 700px) {
        .header-inner {
          align-items: flex-start;
          flex-direction: column;
        }
        .contact {
          justify-content: flex-start;
        }
        .content {
          padding-top: 132px;
        }
      }
    </style>
  </head>
  <body>
    <header class="header">
      <div class="header-inner">
        <a class="brand" href="/">${escapeHtml(site.brandName)}</a>
        <nav class="contact">
          <a href="tel:${escapeHtml(site.phone)}">${escapeHtml(site.phone)}</a>
          <a href="${escapeHtml(site.telegram)}" target="_blank" rel="noopener noreferrer">Telegram</a>
        </nav>
      </div>
    </header>
    <main class="content">
      <section class="panel">
        ${contentHtml}
      </section>
    </main>
  </body>
</html>`;
}

module.exports = { renderLayout, escapeHtml };
