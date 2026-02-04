param(
  [Parameter(Mandatory=$true)][string]$Slug,
  [Parameter(Mandatory=$true)][string]$Title,
  [Parameter(Mandatory=$true)][string]$Description
)

# Нормализация slug
$Slug = $Slug.Trim().Trim("/")
if ($Slug -match "\s") { throw "Slug must not contain spaces. Example: services or pricing" }

$root = (Resolve-Path "$PSScriptRoot\..").Path
$dir  = Join-Path $root $Slug
$out  = Join-Path $dir "index.html"

if (Test-Path $out) { throw "Page already exists: $out" }

New-Item -ItemType Directory -Path $dir -Force | Out-Null

# Путь страницы (с завершающим /)
$path = "/$Slug/"

# Экранирование для HTML-атрибутов
function HtmlEscape([string]$s) {
  return $s.Replace("&","&amp;").Replace("<","&lt;").Replace(">","&gt;").Replace('"',"&quot;")
}

$t = HtmlEscape $Title
$d = HtmlEscape $Description

$html = @"
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- SEO -->
  <title>$t — SEO-PROD</title>
  <meta name="description" content="$d">
  <meta name="robots" content="index, follow">

  <!-- hreflang (placeholder) -->
  <link rel="alternate" hreflang="ru" href="$path" />
  <link rel="alternate" hreflang="x-default" href="$path" />

  <!-- Open Graph (Telegram + VK) -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="SEO-PROD">
  <meta property="og:title" content="$t — SEO-PROD">
  <meta property="og:description" content="$d">
  <meta property="og:image" content="/og.png">

  <!-- config.js + auto canonical/og:url + absolute og:image -->
  <script src="/config.js"></script>
  <script>
    (function () {
      var base = (window.SITE_URL || "").replace(/\/$/, "");
      if (!base) return;

      var path = window.location.pathname;
      if (!path.endsWith("/")) path += "/";

      // canonical
      var link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = base + path;

      // og:url
      var og = document.querySelector('meta[property="og:url"]');
      if (!og) {
        og = document.createElement("meta");
        og.setAttribute("property", "og:url");
        document.head.appendChild(og);
      }
      og.setAttribute("content", base + path);

      // og:image (absolute)
      var img = document.querySelector('meta[property="og:image"]');
      if (img) img.setAttribute("content", base + "/og.png");
    })();
  </script>

  <!-- BreadcrumbList -->
  <script type="application/ld+json">
  {
    "@context":"https://schema.org",
    "@type":"BreadcrumbList",
    "itemListElement":[
      {"@type":"ListItem","position":1,"name":"Home","item":"/"},
      {"@type":"ListItem","position":2,"name":"$t","item":"$path"}
    ]
  }
  </script>

  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 900px; margin: auto; line-height: 1.6; }
    nav a { margin-right: 12px; }
    .muted { opacity: 0.8; }
  </style>
</head>

<body>
  <nav>
    <a href="/">Home</a>
    <a href="/blog/">Blog</a>
    <a href="/about/">About</a>
    <a href="/contact/">Contact</a>
  </nav>

  <h1>$t</h1>
  <p class="muted">$d</p>

  <p>Контент будет добавлен позже.</p>

  <footer>
    <hr>
    <p>© 2026 SEO-PROD</p>
  </footer>
</body>
</html>
"@

Set-Content -Path $out -Value $html -Encoding UTF8
Write-Host "OK: created $out"

# Обновим sitemap автоматически
$gen = Join-Path $root "tools\gen-sitemap.ps1"
if (Test-Path $gen) {
  powershell -ExecutionPolicy Bypass -File $gen
  Write-Host "OK: sitemap regenerated"
} else {
  Write-Host "WARN: tools\gen-sitemap.ps1 not found; sitemap not regenerated"
}
