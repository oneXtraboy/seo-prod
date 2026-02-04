param(
  [string]$Root = (Resolve-Path "$PSScriptRoot\..").Path,
  [string]$Out  = "sitemap.xml",
  [string]$LastMod = (Get-Date -Format "yyyy-MM-dd")
)

# Ищем все index.html, кроме всяких служебных папок
$exclude = @("node_modules", ".git", "tools")

$indexes = Get-ChildItem -Path $Root -Recurse -File -Filter "index.html" |
  Where-Object {
    $full = $_.FullName
    foreach ($x in $exclude) { if ($full -match "\\$x\\") { return $false } }
    return $true
  }

# Превращаем путь до index.html в URL-путь: /, /blog/, /about/ ...
$paths = $indexes | ForEach-Object {
  $rel = $_.FullName.Substring($Root.Length).TrimStart("\")
  $dir = Split-Path $rel -Parent
  if ([string]::IsNullOrWhiteSpace($dir)) { "/" }
  else { "/" + ($dir -replace "\\","/") + "/" }
} | Sort-Object -Unique

# Проставляем частоты и приоритеты (простая логика)
function Get-ChangeFreq($p) {
  if ($p -eq "/") { "weekly" }
  elseif ($p -like "/blog/*") { "weekly" }
  else { "monthly" }
}
function Get-Priority($p) {
  if ($p -eq "/") { "1.0" }
  elseif ($p -eq "/blog/") { "0.8" }
  else { "0.5" }
}

# Генерируем XML (loc остаётся относительным — домен не зашиваем)
$lines = @()
$lines += '<?xml version="1.0" encoding="UTF-8"?>'
$lines += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
foreach ($p in $paths) {
  $lines += '  <url>'
  $lines += "    <loc>$p</loc>"
  $lines += "    <lastmod>$LastMod</lastmod>"
  $lines += "    <changefreq>$(Get-ChangeFreq $p)</changefreq>"
  $lines += "    <priority>$(Get-Priority $p)</priority>"
  $lines += '  </url>'
}
$lines += '</urlset>'

$dest = Join-Path $Root $Out
Set-Content -Path $dest -Value $lines -Encoding UTF8

Write-Host "OK: generated $Out with $($paths.Count) URLs"
$paths | ForEach-Object { Write-Host " - $_" }
