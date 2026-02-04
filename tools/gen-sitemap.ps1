param(
  [string]$Root = (Resolve-Path "$PSScriptRoot\..").Path,
  [string]$Out  = "sitemap.xml"
)

$exclude = @("node_modules", ".git", "tools")

$indexes = Get-ChildItem -Path $Root -Recurse -File -Filter "index.html" |
  Where-Object {
    $full = $_.FullName
    foreach ($x in $exclude) { if ($full -match "\\$x\\") { return $false } }
    return $true
  }

function ToUrlPath($root, $fullPath) {
  $rel = $fullPath.Substring($root.Length).TrimStart("\")
  $dir = Split-Path $rel -Parent
  if ([string]::IsNullOrWhiteSpace($dir)) { return "/" }
  return "/" + ($dir -replace "\\","/") + "/"
}

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

# Собираем map: url -> lastmod (по mtime index.html)
$entries = $indexes | ForEach-Object {
  $url = ToUrlPath $Root $_.FullName
  $lastmod = $_.LastWriteTime.ToString("yyyy-MM-dd")
  [pscustomobject]@{
    Url = $url
    LastMod = $lastmod
  }
} | Sort-Object Url -Unique

# Генерим XML (loc оставляем относительным)
$lines = @()
$lines += '<?xml version="1.0" encoding="UTF-8"?>'
$lines += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
foreach ($e in $entries) {
  $p = $e.Url
  $lines += '  <url>'
  $lines += "    <loc>$p</loc>"
  $lines += "    <lastmod>$($e.LastMod)</lastmod>"
  $lines += "    <changefreq>$(Get-ChangeFreq $p)</changefreq>"
  $lines += "    <priority>$(Get-Priority $p)</priority>"
  $lines += '  </url>'
}
$lines += '</urlset>'

$dest = Join-Path $Root $Out
Set-Content -Path $dest -Value $lines -Encoding UTF8

Write-Host "OK: generated $Out with $($entries.Count) URLs"
$entries | ForEach-Object { Write-Host (" - {0} (lastmod {1})" -f $_.Url, $_.LastMod) }
