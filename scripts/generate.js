const fs = require("fs");
const path = require("path");

const config = require("../config");

const content = require("../content/pages.json");

const templatesDir = path.join(__dirname, "../templates");
const publicDir = path.join(__dirname, "../public");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadTemplate(name) {
  return fs.readFileSync(
    path.join(templatesDir, name),
    "utf8"
  );
}

function render(page) {

  const layout = loadTemplate("layout.html");

  let html = layout;

  html = html.replace(/{{title}}/g, page.title || "");
  html = html.replace(/{{description}}/g, page.description || "");
  html = html.replace(/{{content}}/g, page.h1 || "");

  return html;
}

function build() {

  ensureDir(publicDir);

  content.forEach(page => {

    const html = render(page);

    let filePath;

    if (page.slug === "/") {

      filePath = path.join(publicDir, "index.html");

    } else {

      const dir = path.join(publicDir, page.slug);

      ensureDir(dir);

      filePath = path.join(dir, "index.html");

    }

    fs.writeFileSync(filePath, html);

    console.log("generated:", filePath);

  });

}

build();
