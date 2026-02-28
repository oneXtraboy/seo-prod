const fs = require("fs");
const path = require("path");

const { SITE_URL } = require("../config");
const pages = require("../content/pages.json");

// берем существующий корневой index.html как шаблон
const templatePath = path.join(__dirname, "..", "index.html");
const outDir = path.join(__dirname, "..", "public");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function normalizeSiteUrl(u) {
  return String(u || "").replace(/\/+$/, "");
}

function renderFromTemplate(html, page) {
  // Минимальные подстановки: title/description/h1
  // Если в шаблоне нет маркеров — просто оставим как есть, сайт всё равно соберётся.
  let out = html;

  const title = page.title || "";
  const description = page.description || "";
  const h1 = page.h1 || page.title || "";

  out = out.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(title)}</title>`);

  // meta description
  if (out.includes('name="description"')) {
    out = out.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/s, `<meta name="description" content="${escapeHtml(description)}">`);
  }

  // h1
  out = out.replace(/<h1[^>]*>.*?<\/h1>/s, `<h1>${escapeHtml(h1)}</h1>`);

  // canonical (если есть placeholder)
  const canonical = normalizeSiteUrl(SITE_URL) + (page.slug || "/");
  out = out.replace(/{{\s*CANONICAL\s*}}/g, canonical);

  return out;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function main() {
  const template = fs.readFileSync(templatePath, "utf8");

  // главная
  for (const page of pages) {
    const slug = page.slug || "/";
    const html = renderFromTemplate(template, page);

    const filePath =
      slug === "/"
        ? path.join(outDir, "index.html")
        : path.join(outDir, slug.replace(/^\//, ""), "index.html");

    writeFile(filePath, html);
    console.log("generated:", filePath);
  }

  // 404.html (простая)
  const notFound = `<!doctype html><meta charset="utf-8"><title>404</title><h1>404</h1><p>Страница не найдена</p>`;
  writeFile(path.join(outDir, "404.html"), notFound);

  console.log("OK");
}

main();
